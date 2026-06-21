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

<div class="space-y-5">
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-sky-200 transition-all hover:bg-sky-500 hover:shadow-md hover:shadow-sky-200 active:scale-95"
			onclick={() => (addingAccommodation = !addingAccommodation)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
			</svg>
			Add accommodation
		</button>
		<button
			type="button"
			class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
			onclick={() => (addingCar = !addingCar)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
			</svg>
			Add car
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
		<div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
			<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
				</svg>
			</div>
			<div>
				<p class="font-semibold text-slate-700">No items yet</p>
				<p class="mt-1 text-sm text-slate-400">Add an accommodation or car to start planning your trip.</p>
			</div>
		</div>
	{:else}
		<div
			class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
			style="display: grid; grid-template-columns: minmax(6rem, 1fr) 2fr 2fr; grid-template-rows: repeat({gridRowCount}, minmax(1.75rem, auto));"
		>
			<div
				class="border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
				style="grid-row: 1; grid-column: 1"
			>
				Date
			</div>
			<div
				class="border-b border-l border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
				style="grid-row: 1; grid-column: 2"
			>
				Accommodation
			</div>
			<div
				class="border-b border-l border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
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
