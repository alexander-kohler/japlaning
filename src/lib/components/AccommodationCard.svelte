<script lang="ts">
	import type { Accommodation } from '$lib/types';
	import { formatDay } from '$lib/utils/dates';

	type Props = {
		accommodation: Accommodation;
		onedit?: () => void;
		ondelete?: () => void;
	};

	let { accommodation, onedit, ondelete }: Props = $props();
</script>

<div
	class="group relative flex h-full w-full flex-col justify-center overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100/80 px-3 py-2.5 text-center shadow-sm transition-shadow hover:shadow-md"
>
	<div class="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-sky-400"></div>

	<div class="flex flex-col items-center gap-0.5 pl-1">
		<svg xmlns="http://www.w3.org/2000/svg" class="mb-0.5 h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
		</svg>
		<span class="text-sm font-semibold leading-tight text-sky-900">{accommodation.name}</span>
		<span class="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-500">
			{formatDay(accommodation.checkIn)} – {formatDay(accommodation.checkOut)}
		</span>
	</div>

	<div
		class="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if onedit}
			<button
				type="button"
				class="flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-700"
				onclick={onedit}
				aria-label="Edit accommodation"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
				</svg>
			</button>
		{/if}
		{#if ondelete}
			<button
				type="button"
				class="flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-red-400 shadow-sm transition-colors hover:bg-white hover:text-red-600"
				onclick={ondelete}
				aria-label="Delete accommodation"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
				</svg>
			</button>
		{/if}
	</div>
</div>
