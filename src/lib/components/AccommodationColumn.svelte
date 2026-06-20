<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import type { PlannerStore } from '$lib/planner.svelte';
	import { formatRange } from '$lib/utils/dates';
	import { accommodationGridSpan, carGridSpan } from '$lib/utils/timeline';
	import AccommodationCard from './AccommodationCard.svelte';
	import CarCard from './CarCard.svelte';
	import ItemForm from './ItemForm.svelte';

	type Props = {
		store: PlannerStore;
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { store, layout, rowOffset }: Props = $props();

	let editingAccommodationId = $state<string | null>(null);
	let editingCarId = $state<string | null>(null);

	const sortedAccommodations = $derived(
		[...store.data.accommodations].sort((a, b) => a.checkIn.localeCompare(b.checkIn))
	);

	const sortedCars = $derived(
		[...store.data.cars].sort((a, b) => a.pickup.localeCompare(b.pickup))
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

	function getCarInitial(id: string): Record<string, string> {
		const car = store.data.cars.find((c) => c.id === id);
		if (!car) return {};
		return { name: car.name, pickup: car.pickup, dropoff: car.dropoff };
	}

	function handleCarEditSubmit(id: string, values: Record<string, string>) {
		store.updateCar(id, {
			name: values.name,
			pickup: values.pickup,
			dropoff: values.dropoff
		});
		editingCarId = null;
	}
</script>

{#each layout.days as day (day.date)}
	<div
		class="border-b border-slate-200"
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

{#each sortedCars as car (car.id)}
	{@const span = carGridSpan(car, layout)}
	{#if span}
		<div
			class="z-20 flex justify-end px-2"
			style="grid-row: {rowOffset + span.startRow} / span {span.rowSpan}; grid-column: 2"
		>
			{#if editingCarId === car.id}
				{#key car.id}
					<ItemForm
						type="car"
						initial={getCarInitial(car.id)}
						onsubmit={(v) => handleCarEditSubmit(car.id, v)}
						oncancel={() => (editingCarId = null)}
					/>
				{/key}
			{:else}
				<CarCard
					{car}
					onedit={() => (editingCarId = car.id)}
					ondelete={() => store.removeCar(car.id)}
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
			class="flex h-full flex-col justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-slate-500"
		>
			<span class="text-sm font-medium">No accommodation</span>
			<span class="mt-0.5 text-xs">{formatRange(gap.startDate, gap.endDate)}</span>
		</div>
	</div>
{/each}
