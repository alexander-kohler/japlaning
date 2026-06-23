<script lang="ts">
	import type { Car } from '$lib/types';
	import { formatDay } from '$lib/utils/dates';

	type Props = {
		car: Car;
		onedit?: () => void;
		ondelete?: () => void;
	};

	let { car, onedit, ondelete }: Props = $props();
</script>

<div class="group relative flex h-full w-full flex-col items-center py-1.5">
	<div class="flex h-full w-8 flex-col items-center">
		<div class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 shadow-sm">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
			</svg>
		</div>
		<div class="my-1 w-px flex-1 border-l border-dashed border-slate-300"></div>
		<div class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 shadow-sm">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
			</svg>
		</div>
	</div>

	<div
		class="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-1 text-center opacity-0 transition-opacity group-hover:opacity-100"
	>
		<span class="inline-block rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
			{car.name}
		</span>
		<span class="mt-0.5 block text-[9px] font-medium text-slate-400">
			{formatDay(car.pickup)} – {formatDay(car.dropoff)}
		</span>
	</div>

	<div
		class="absolute top-0.5 right-0.5 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if onedit}
			<button
				type="button"
				class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-700"
				onclick={onedit}
				aria-label="Edit car rental"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
				</svg>
			</button>
		{/if}
		{#if ondelete}
			<button
				type="button"
				class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-red-400 shadow-sm transition-colors hover:bg-white hover:text-red-600"
				onclick={ondelete}
				aria-label="Delete car rental"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
				</svg>
			</button>
		{/if}
	</div>
</div>
