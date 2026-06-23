<script lang="ts">
	import type { CalendarLayout } from '$lib/types';
	import type { PlannerStore } from '$lib/planner.svelte';
	import { carGridSpan } from '$lib/utils/timeline';
	import CarCard from './CarCard.svelte';
	import ItemForm from './ItemForm.svelte';

	type Props = {
		store: PlannerStore;
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { store, layout, rowOffset }: Props = $props();

	let editingCarId = $state<string | null>(null);

	const sortedCars = $derived(
		[...store.data.cars].sort((a, b) => a.pickup.localeCompare(b.pickup))
	);

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

{#each sortedCars as car (car.id)}
	{@const span = carGridSpan(car, layout)}
	{#if span}
		<div
			class="z-20 flex justify-center"
			style="grid-row: {rowOffset + span.startRow} / span {span.rowSpan}; grid-column: 2 / 4"
		>
			{#if editingCarId === car.id}
				<div class="min-w-72 px-2">
					{#key car.id}
						<ItemForm
							type="car"
							initial={getCarInitial(car.id)}
							onsubmit={(v) => handleCarEditSubmit(car.id, v)}
							oncancel={() => (editingCarId = null)}
						/>
					{/key}
				</div>
			{:else}
				<div class="w-8 shrink-0">
					<CarCard
						{car}
						onedit={() => (editingCarId = car.id)}
						ondelete={() => store.removeCar(car.id)}
					/>
				</div>
			{/if}
		</div>
	{/if}
{/each}
