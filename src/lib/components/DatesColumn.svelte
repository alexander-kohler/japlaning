<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import { formatDay } from '$lib/utils/dates';

	type Props = {
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { layout, rowOffset }: Props = $props();
</script>

{#each layout.days as day (day.date)}
	<div
		class="relative flex items-center justify-center border-b border-slate-200 bg-slate-50 px-2"
		style="grid-row: {rowOffset + day.gridRowTop} / span 2; grid-column: 1"
	>
		<span class="text-sm font-medium whitespace-nowrap text-slate-700">{formatDay(day.date)}</span>
	</div>
{/each}
