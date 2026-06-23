<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import type { PlannerStore } from '$lib/planner.svelte';
	import { formatRange } from '$lib/utils/dates';
	import { accommodationGridSpan } from '$lib/utils/timeline';
	import AccommodationCard from './AccommodationCard.svelte';
	import ItemForm from './ItemForm.svelte';

	type Props = {
		store: PlannerStore;
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { store, layout, rowOffset }: Props = $props();

	let editingAccommodationId = $state<string | null>(null);

	const sortedAccommodations = $derived(
		[...store.data.accommodations].sort((a, b) => a.checkIn.localeCompare(b.checkIn))
	);

	function getAccommodationInitial(id: string): Record<string, string> {
		const acc = store.data.accommodations.find((a) => a.id === id);
		if (!acc) return {};
		return { name: acc.name, checkIn: acc.checkIn, checkOut: acc.checkOut };
	}

	function handleEditSubmit(id: string, values: Record<string, string>) {
		store.updateAccommodation(id, {
			name: values.name,
			checkIn: values.checkIn,
			checkOut: values.checkOut
		});
		editingAccommodationId = null;
	}

</script>

{#each layout.days as day (day.date)}
	<div
		class="border-b border-l border-slate-200"
		style="grid-row: {rowOffset + day.gridRowTop} / span 2; grid-column: 2"
	></div>
{/each}

{#each sortedAccommodations as accommodation (accommodation.id)}
	{@const span = accommodationGridSpan(accommodation, layout)}
	{#if span}
		<div
			class="z-10 px-2"
			style="grid-row: {rowOffset + span.startRow} / span {span.rowSpan}; grid-column: 2"
		>
			{#if editingAccommodationId === accommodation.id}
				{#key accommodation.id}
					<ItemForm
						type="accommodation"
						initial={getAccommodationInitial(accommodation.id)}
						onsubmit={(v) => handleEditSubmit(accommodation.id, v)}
						oncancel={() => (editingAccommodationId = null)}
					/>
				{/key}
			{:else}
				<AccommodationCard
					{accommodation}
					onedit={() => (editingAccommodationId = accommodation.id)}
					ondelete={() => store.removeAccommodation(accommodation.id)}
				/>
			{/if}
		</div>
	{/if}
{/each}

{#each store.gapRanges as gap (gap.afterAccommodationId + gap.beforeAccommodationId)}
	<div
		class="z-0 px-2"
		style="grid-row: {rowOffset + gap.startRow} / span {gap.rowSpan}; grid-column: 2"
	>
		<div
			class="flex h-full flex-col justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-400"
		>
			<span class="text-xs font-semibold uppercase tracking-wide">No accommodation</span>
			<span class="mt-0.5 text-[10px]">{formatRange(gap.startDate, gap.endDate)}</span>
		</div>
	</div>
{/each}
