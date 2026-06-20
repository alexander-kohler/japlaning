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

<div class="group relative flex h-full w-full flex-col items-center py-1">
	<div class="flex h-full w-10 flex-col items-center">
		<span class="text-xl leading-none" aria-hidden="true">🚗</span>
		<div class="my-0.5 w-0.5 flex-1 bg-slate-400"></div>
		<span class="text-xl leading-none" aria-hidden="true">🚗</span>
	</div>

	<div
		class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-1 text-center opacity-0 transition-opacity group-hover:opacity-100"
	>
		<span class="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm">
			{car.name}
		</span>
		<span class="mt-0.5 block text-[10px] text-slate-500">
			{formatDay(car.pickup)} – {formatDay(car.dropoff)}
		</span>
	</div>

	<div
		class="absolute top-0 right-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if onedit}
			<button
				type="button"
				class="pointer-events-auto rounded bg-white/90 px-1.5 py-0.5 text-xs text-slate-600 shadow-sm hover:bg-white"
				onclick={onedit}
				aria-label="Edit car rental"
			>
				Edit
			</button>
		{/if}
		{#if ondelete}
			<button
				type="button"
				class="pointer-events-auto rounded bg-white/90 px-1.5 py-0.5 text-xs text-red-600 shadow-sm hover:bg-white"
				onclick={ondelete}
				aria-label="Delete car rental"
			>
				Del
			</button>
		{/if}
	</div>
</div>
