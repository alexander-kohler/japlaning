<script lang="ts">
	import { onMount } from 'svelte';
	import { PREFECTURE_COUNT, getPrefecture } from '$lib/prefectures';

	type Props = {
		visitedCodes: string[];
		onToggle: (code: string, visited: boolean) => void;
	};

	let { visitedCodes, onToggle }: Props = $props();

	let containerEl = $state<HTMLDivElement | null>(null);
	let mapReady = $state(false);
	let mapError = $state('');
	let hoverCode = $state<string | null>(null);
	let pointerDown = $state(false);
	let dragMode = $state<'visit' | 'unvisit' | null>(null);

	const visited = $derived(new Set(visitedCodes));
	const hoverName = $derived.by(() => {
		if (!hoverCode) return '';
		const pref = getPrefecture(hoverCode);
		return pref ? `${pref.en} · ${pref.ja}` : '';
	});

	onMount(() => {
		void loadMap();

		const onUp = () => {
			pointerDown = false;
			dragMode = null;
		};
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		return () => {
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
		};
	});

	$effect(() => {
		if (!mapReady || !containerEl) return;
		applyVisitedStyles(visited);
	});

	async function loadMap(): Promise<void> {
		if (!containerEl) return;

		try {
			const res = await fetch('/maps/map-full.svg');
			if (!res.ok) throw new Error('Failed to load map');
			const svg = await res.text();
			containerEl.innerHTML = svg;

			const root = containerEl.querySelector('.geolonia-svg-map');
			if (!(root instanceof SVGElement)) throw new Error('Invalid map SVG');

			root.setAttribute('width', '100%');
			root.setAttribute('height', 'auto');
			root.style.display = 'block';
			root.style.maxWidth = '100%';
			root.style.touchAction = 'none';

			const prefs = containerEl.querySelectorAll('.geolonia-svg-map .prefecture');
			prefs.forEach((node) => {
				if (!(node instanceof SVGGElement)) return;
				node.style.cursor = 'pointer';
				node.style.transition = 'fill 160ms ease, filter 160ms ease';

				node.addEventListener('pointerenter', (event) => {
					const code = codeFromTarget(event.currentTarget);
					hoverCode = code;
					if (pointerDown && code && dragMode) {
						applyDrag(code);
					}
				});

				node.addEventListener('pointerleave', () => {
					hoverCode = null;
				});

				node.addEventListener('pointerdown', (event) => {
					event.preventDefault();
					const code = codeFromTarget(event.currentTarget);
					if (!code) return;
					pointerDown = true;
					const nextVisited = !visited.has(code);
					dragMode = nextVisited ? 'visit' : 'unvisit';
					onToggle(code, nextVisited);
					scratchFlash(event.currentTarget as SVGGElement);
				});
			});

			applyVisitedStyles(visited);
			mapReady = true;
		} catch {
			mapError = 'Could not load the prefecture map.';
		}
	}

	function codeFromTarget(target: EventTarget | null): string | null {
		if (!(target instanceof Element)) return null;
		const code = target.getAttribute('data-code');
		return code;
	}

	function applyDrag(code: string): void {
		if (!dragMode) return;
		const shouldVisit = dragMode === 'visit';
		if (visited.has(code) === shouldVisit) return;
		onToggle(code, shouldVisit);
		const el = containerEl?.querySelector(`.prefecture[data-code="${code}"]`);
		if (el instanceof SVGGElement) scratchFlash(el);
	}

	function applyVisitedStyles(set: Set<string>): void {
		if (!containerEl) return;
		const prefs = containerEl.querySelectorAll('.geolonia-svg-map .prefecture');
		prefs.forEach((node) => {
			if (!(node instanceof SVGGElement)) return;
			const code = node.getAttribute('data-code');
			const isVisited = code ? set.has(code) : false;
			node.classList.toggle('is-visited', isVisited);
			node.style.fill = isVisited ? 'var(--scratch-visited)' : 'var(--scratch-foil)';
			node.style.stroke = isVisited
				? 'var(--scratch-visited-stroke)'
				: 'var(--scratch-foil-stroke)';
		});
	}

	function scratchFlash(el: SVGGElement): void {
		el.classList.remove('scratching');
		// restart animation
		void el.getBoundingClientRect();
		el.classList.add('scratching');
		window.setTimeout(() => el.classList.remove('scratching'), 420);
	}
</script>

<div class="scratch-map-shell">
	{#if mapError}
		<p class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
			{mapError}
		</p>
	{:else}
		<div class="scratch-map-meta">
			<span class="text-sm text-zinc-600">
				{#if hoverName}
					{hoverName}
				{:else}
					Scratch a prefecture to mark it visited · {visitedCodes.length}/{PREFECTURE_COUNT}
				{/if}
			</span>
		</div>
		<div
			bind:this={containerEl}
			class="scratch-map-canvas"
			class:opacity-0={!mapReady}
			aria-label="Japan prefecture scratch map"
			role="img"
		></div>
		{#if !mapReady}
			<p class="py-16 text-center text-sm text-zinc-500">Loading map…</p>
		{/if}
	{/if}
</div>

<style>
	.scratch-map-shell {
		--scratch-foil: #c4c4cc;
		--scratch-foil-stroke: #71717a;
		--scratch-visited: #c23a2b;
		--scratch-visited-stroke: #7f1d1d;
	}

	.scratch-map-meta {
		margin-bottom: 0.75rem;
		min-height: 1.25rem;
	}

	.scratch-map-canvas {
		user-select: none;
		-webkit-user-select: none;
	}

	.scratch-map-canvas :global(.geolonia-svg-map .prefecture) {
		stroke-width: 1.25;
		stroke-linejoin: round;
	}

	.scratch-map-canvas :global(.geolonia-svg-map .prefecture:hover:not(.is-visited)) {
		fill: #d4d4d8 !important;
	}

	.scratch-map-canvas :global(.geolonia-svg-map .prefecture.is-visited:hover) {
		fill: #d9483b !important;
	}

	.scratch-map-canvas :global(.geolonia-svg-map .prefecture.scratching) {
		animation: scratch-reveal 420ms ease;
	}

	.scratch-map-canvas :global(.geolonia-svg-map .boundary-line) {
		stroke: #a1a1aa;
		pointer-events: none;
	}

	@keyframes scratch-reveal {
		0% {
			filter: brightness(1.55) saturate(1.2);
		}
		100% {
			filter: none;
		}
	}
</style>
