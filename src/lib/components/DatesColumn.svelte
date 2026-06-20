<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import { formatTimelineDayLabel } from '$lib/utils/dates';

	type Props = {
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { layout, rowOffset }: Props = $props();
</script>

{#each layout.days as day, index (day.date)}
	{@const previousDate = index > 0 ? layout.days[index - 1].date : null}
	<div
		class="relative flex items-center justify-center border-b border-slate-200 bg-slate-50 px-2"
		style="grid-row: {rowOffset + day.gridRowTop} / span 2; grid-column: 1"
	>
		<span class="text-sm font-medium whitespace-nowrap text-slate-700"
			>{formatTimelineDayLabel(day.date, previousDate)}</span
		>
	</div>
{/each}
