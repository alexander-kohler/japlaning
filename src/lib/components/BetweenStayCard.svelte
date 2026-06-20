<script lang="ts">
	import type { Activity } from '$lib/types';
	import { formatDay } from '$lib/utils/dates';

	type Props = {
		activity: Activity;
		onedit?: () => void;
		ondelete?: () => void;
	};

	let { activity, onedit, ondelete }: Props = $props();
</script>

<div
	class="group relative flex h-full w-full flex-col justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900"
>
	<span class="text-sm font-medium">{activity.name}</span>
	{#if activity.date}
		<span class="mt-0.5 text-xs text-amber-700">{formatDay(activity.date)}</span>
	{/if}

	<div
		class="absolute top-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if onedit}
			<button
				type="button"
				class="rounded bg-white/80 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-white"
				onclick={onedit}
				aria-label="Edit activity"
			>
				Edit
			</button>
		{/if}
		{#if ondelete}
			<button
				type="button"
				class="rounded bg-white/80 px-1.5 py-0.5 text-xs text-red-600 hover:bg-white"
				onclick={ondelete}
				aria-label="Delete activity"
			>
				Del
			</button>
		{/if}
	</div>
</div>
