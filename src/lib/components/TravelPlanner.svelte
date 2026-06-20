<script lang="ts">
	import { PlannerStore } from '$lib/planner.svelte';
	import AccommodationColumn from './AccommodationColumn.svelte';
	import ActivitiesColumn from './ActivitiesColumn.svelte';
	import DatesColumn from './DatesColumn.svelte';
	import ItemForm from './ItemForm.svelte';

	const store = new PlannerStore();

	let addingAccommodation = $state(false);
	let addingCar = $state(false);

	const rowOffset = 1;
	const gridRowCount = $derived(rowOffset + store.totalRows);

	function handleAddAccommodation(values: Record<string, string>) {
		store.addAccommodation({
			name: values.name,
			checkIn: values.checkIn,
			checkOut: values.checkOut
		});
		addingAccommodation = false;
	}

	function handleAddCar(values: Record<string, string>) {
		store.addCar({
			name: values.name,
			pickup: values.pickup,
			dropoff: values.dropoff
		});
		addingCar = false;
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
			onclick={() => (addingAccommodation = !addingAccommodation)}
		>
			+ Add accommodation
		</button>
		<button
			type="button"
			class="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
			onclick={() => (addingCar = !addingCar)}
		>
			+ Add car
		</button>
	</div>

	{#if addingAccommodation}
		<ItemForm
			type="accommodation"
			onsubmit={handleAddAccommodation}
			oncancel={() => (addingAccommodation = false)}
		/>
	{/if}

	{#if addingCar}
		<ItemForm type="car" onsubmit={handleAddCar} oncancel={() => (addingCar = false)} />
	{/if}

	{#if store.calendarLayout.days.length === 0}
		<p class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
			Add an accommodation or car to start planning your trip.
		</p>
	{:else}
		<div
			class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
			style="display: grid; grid-template-columns: minmax(6rem, 1fr) 2fr 2fr; grid-template-rows: repeat({gridRowCount}, minmax(1.75rem, auto));"
		>
			<div
				class="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
				style="grid-row: 1; grid-column: 1"
			>
				Dates
			</div>
			<div
				class="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
				style="grid-row: 1; grid-column: 2"
			>
				Accommodation
			</div>
			<div
				class="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
				style="grid-row: 1; grid-column: 3"
			>
				Activities
			</div>

			<DatesColumn layout={store.calendarLayout} {rowOffset} />
			<AccommodationColumn {store} layout={store.calendarLayout} {rowOffset} />
			<ActivitiesColumn {store} layout={store.calendarLayout} {rowOffset} />
		</div>
	{/if}
</div>
