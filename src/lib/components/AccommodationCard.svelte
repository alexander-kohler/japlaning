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
	class="group relative flex h-full w-full flex-col justify-center rounded border-2 border-sky-300 bg-sky-100 px-3 py-2 text-center text-sky-900"
>
	<span class="text-sm font-semibold">{accommodation.name}</span>
	<span class="mt-1 text-[10px] uppercase tracking-wide text-sky-600">
		{formatDay(accommodation.checkIn)} – {formatDay(accommodation.checkOut)}
	</span>

	<div
		class="absolute top-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if onedit}
			<button
				type="button"
				class="rounded bg-white/80 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-white"
				onclick={onedit}
				aria-label="Edit accommodation"
			>
				Edit
			</button>
		{/if}
		{#if ondelete}
			<button
				type="button"
				class="rounded bg-white/80 px-1.5 py-0.5 text-xs text-red-600 hover:bg-white"
				onclick={ondelete}
				aria-label="Delete accommodation"
			>
				Del
			</button>
		{/if}
	</div>
</div>
