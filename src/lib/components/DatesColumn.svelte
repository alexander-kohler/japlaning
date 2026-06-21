<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import { formatTimelineDayLabel } from '$lib/utils/dates';

	type Props = {
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { layout, rowOffset }: Props = $props();

	function isWeekend(dateStr: string) {
		const d = new Date(dateStr + 'T00:00:00');
		const day = d.getDay();
		return day === 0 || day === 6;
	}

	function showMonthLabel(dateStr: string, prevDateStr: string | null): string | null {
		const date = new Date(dateStr + 'T00:00:00');
		if (!prevDateStr) {
			return date.toLocaleString('en', { month: 'short', year: 'numeric' });
		}
		const prev = new Date(prevDateStr + 'T00:00:00');
		if (date.getMonth() !== prev.getMonth()) {
			return date.toLocaleString('en', { month: 'short', year: 'numeric' });
		}
		return null;
	}
</script>

{#each layout.days as day, index (day.date)}
	{@const previousDate = index > 0 ? layout.days[index - 1].date : null}
	{@const weekend = isWeekend(day.date)}
	{@const monthLabel = showMonthLabel(day.date, previousDate)}
	<div
		class="relative flex flex-col items-center justify-center border-b px-2 {weekend
			? 'border-slate-200 bg-sky-50/40'
			: 'border-slate-200 bg-slate-50/60'}"
		style="grid-row: {rowOffset + day.gridRowTop} / span 2; grid-column: 1"
	>
		{#if monthLabel}
			<span class="mb-0.5 text-[8px] font-semibold uppercase tracking-widest text-slate-400"
				>{monthLabel}</span
			>
		{/if}
		<span
			class="text-sm font-semibold whitespace-nowrap {weekend ? 'text-sky-600' : 'text-slate-600'}"
			>{formatTimelineDayLabel(day.date, previousDate)}</span
		>
	</div>
{/each}
