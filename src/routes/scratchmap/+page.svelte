<script lang="ts">
	import PrefectureScratchMap from '$lib/components/PrefectureScratchMap.svelte';
	import { PREFECTURE_COUNT, PREFECTURES } from '$lib/prefectures';

	let { data } = $props();

	let visitedCodes = $derived(data.visitedCodes);
	let saving = $state(false);
	let saveError = $state('');
	let pending = new Map<string, boolean>();
	let flushTimer: ReturnType<typeof setTimeout> | undefined;

	const visitedSet = $derived(new Set(visitedCodes));
	const visitedList = $derived(PREFECTURES.filter((prefecture) => visitedSet.has(prefecture.code)));
	const progress = $derived(visitedCodes.length);
	const percent = $derived(Math.round((progress / PREFECTURE_COUNT) * 100));

	function toggle(code: string, visited: boolean): void {
		const next = new Set(visitedCodes);
		if (visited) next.add(code);
		else next.delete(code);
		visitedCodes = [...next].sort((a, b) => Number(a) - Number(b));
		queueSave(code, visited);
	}

	function queueSave(code: string, visited: boolean): void {
		pending.set(code, visited);
		saveError = '';
		if (flushTimer) clearTimeout(flushTimer);
		flushTimer = setTimeout(() => {
			void flushPending();
		}, 180);
	}

	async function flushPending(): Promise<void> {
		if (pending.size === 0) return;
		const batch = [...pending.entries()];
		pending.clear();
		saving = true;

		try {
			for (const [code, visited] of batch) {
				const res = await fetch('/api/visited-prefectures', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ code, visited })
				});
				if (!res.ok) {
					const message = await res.text();
					throw new Error(message || 'Save failed');
				}
				const body = (await res.json()) as { codes: string[] };
				visitedCodes = body.codes;
			}
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Could not save changes';
		} finally {
			saving = false;
			if (pending.size > 0) {
				flushTimer = setTimeout(() => {
					void flushPending();
				}, 120);
			}
		}
	}

	async function clearAll(): Promise<void> {
		if (visitedCodes.length === 0) return;
		if (!confirm('Clear all scratched prefectures?')) return;

		saving = true;
		saveError = '';
		try {
			const res = await fetch('/api/visited-prefectures', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ codes: [] })
			});
			if (!res.ok) throw new Error('Clear failed');
			visitedCodes = [];
		} catch {
			saveError = 'Could not clear the map';
		} finally {
			saving = false;
		}
	}

	function unvisit(code: string): void {
		toggle(code, false);
	}
</script>

<svelte:head>
	<title>Scratch map · Japlaning</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-3 py-6 sm:px-4">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Scratch map</h1>
			<p class="mt-1 max-w-xl text-sm text-zinc-600">
				Scratch off prefectures you’ve visited. Progress is saved for everyone on this trip.
			</p>
		</div>
		<div class="flex items-center gap-3 text-sm text-zinc-600">
			<span class="tabular-nums font-medium text-zinc-900">{progress}/{PREFECTURE_COUNT}</span>
			<span class="hidden sm:inline">({percent}%)</span>
			{#if saving}
				<span class="text-zinc-400">Saving…</span>
			{/if}
			<button
				type="button"
				class="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
				disabled={progress === 0 || saving}
				onclick={() => void clearAll()}
			>
				Clear all
			</button>
		</div>
	</header>

	{#if saveError}
		<p class="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
			{saveError}
		</p>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
		<section class="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
			<div class="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
				<div
					class="h-full rounded-full bg-[#c23a2b] transition-[width] duration-300"
					style={`width: ${percent}%`}
				></div>
			</div>
			<PrefectureScratchMap {visitedCodes} onToggle={toggle} />
			<p class="mt-3 text-xs leading-relaxed text-zinc-500">
				Map:
				<a
					class="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700"
					href="https://github.com/geolonia/japanese-prefectures"
					target="_blank"
					rel="noreferrer"
				>
					geolonia/japanese-prefectures
				</a>
				(GFDL), based on Wikipedia’s Japan map.
			</p>
		</section>

		<aside class="rounded-xl border border-zinc-200 bg-white p-4">
			<h2 class="text-sm font-semibold text-zinc-900">Visited</h2>
			{#if visitedList.length === 0}
				<p class="mt-3 text-sm text-zinc-500">None yet — scratch the map to begin.</p>
			{:else}
				<ul class="mt-3 max-h-[32rem] space-y-1 overflow-y-auto text-sm">
					{#each visitedList as pref (pref.code)}
						<li
							class="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-zinc-50"
						>
							<span class="min-w-0 truncate text-zinc-800">
								{pref.en}
								<span class="text-zinc-400"> · {pref.ja}</span>
							</span>
							<button
								type="button"
								class="shrink-0 text-xs text-zinc-500 hover:text-rose-700"
								onclick={() => unvisit(pref.code)}
								aria-label={`Unmark ${pref.en}`}
							>
								Undo
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<details class="mt-5 border-t border-zinc-100 pt-4">
				<summary class="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-700">
					All prefectures
				</summary>
				<ul class="mt-2 max-h-64 space-y-0.5 overflow-y-auto text-xs text-zinc-600">
					{#each PREFECTURES as pref (pref.code)}
						<li class="flex items-center gap-2 py-0.5">
							<span
								class={`inline-block size-1.5 rounded-full ${visitedSet.has(pref.code) ? 'bg-[#c23a2b]' : 'bg-zinc-300'}`}
							></span>
							<button
								type="button"
								class="text-left hover:text-zinc-900"
								onclick={() => toggle(pref.code, !visitedSet.has(pref.code))}
							>
								{pref.en}
							</button>
						</li>
					{/each}
				</ul>
			</details>
		</aside>
	</div>

	<p class="mt-4 text-xs text-zinc-400">
		Saved to {data.persistence === 'turso' ? 'Turso' : 'local database'}. Tip: click again to
		unscratch; drag across neighbors to mark several at once.
	</p>
</div>
