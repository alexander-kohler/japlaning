<script lang="ts">
	import type { Accommodation } from '$lib/types';

	type FormType = 'accommodation' | 'car' | 'activity' | 'between-activity';

	type Props = {
		type: FormType;
		accommodations?: Accommodation[];
		initial?: Record<string, string>;
		dateConstraints?: { min?: string; max?: string };
		onsubmit: (values: Record<string, string>) => void;
		oncancel: () => void;
	};

	let {
		type,
		accommodations = [],
		initial = {},
		dateConstraints = {},
		onsubmit,
		oncancel
	}: Props = $props();

	let name = $state(initial.name ?? '');
	let checkIn = $state(initial.checkIn ?? '');
	let checkOut = $state(initial.checkOut ?? '');
	let pickup = $state(initial.pickup ?? '');
	let dropoff = $state(initial.dropoff ?? '');
	let accommodationId = $state(initial.accommodationId ?? accommodations[0]?.id ?? '');
	let activityDate = $state(initial.activityDate ?? '');
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (type === 'accommodation') {
			if (!name.trim()) {
				error = 'Please enter a name.';
				return;
			}
			if (!checkIn || !checkOut) {
				error = 'Please select check-in and check-out dates.';
				return;
			}
			if (checkOut < checkIn) {
				error = 'Check-out must be on or after check-in.';
				return;
			}
			onsubmit({ name: name.trim(), checkIn, checkOut });
		} else if (type === 'car') {
			if (!name.trim()) {
				error = 'Please enter a name.';
				return;
			}
			if (!pickup || !dropoff) {
				error = 'Please select pick-up and drop-off dates.';
				return;
			}
			if (dropoff < pickup) {
				error = 'Drop-off must be on or after pick-up.';
				return;
			}
			onsubmit({ name: name.trim(), pickup, dropoff });
		} else if (type === 'between-activity') {
			if (!name.trim()) {
				error = 'Please enter a name.';
				return;
			}
			if (activityDate) {
				if (dateConstraints.min && activityDate < dateConstraints.min) {
					error = `Date must be on or after ${dateConstraints.min}.`;
					return;
				}
				if (dateConstraints.max && activityDate > dateConstraints.max) {
					error = `Date must be on or before ${dateConstraints.max}.`;
					return;
				}
			}
			onsubmit({ name: name.trim(), activityDate });
		} else {
			if (!name.trim()) {
				error = 'Please enter a name.';
				return;
			}
			if (!accommodationId) {
				error = 'Please select an accommodation.';
				return;
			}
			onsubmit({ name: name.trim(), accommodationId, activityDate });
		}
	}
</script>

<form class="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onsubmit={handleSubmit}>
	{#if type === 'accommodation'}
		<label class="flex min-w-40 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-500">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Hotel name"
				class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
			/>
		</label>
		<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
			Check-in
			<input type="date" bind:value={checkIn} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
		</label>
		<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
			Check-out
			<input type="date" bind:value={checkOut} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
		</label>
	{:else if type === 'car'}
		<label class="flex min-w-40 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-500">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Rental car"
				class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
			/>
		</label>
		<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
			Pick-up
			<input type="date" bind:value={pickup} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
		</label>
		<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
			Drop-off
			<input type="date" bind:value={dropoff} class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
		</label>
	{:else}
		<label class="flex min-w-40 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-500">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Activity name"
				class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
			/>
		</label>
		{#if type === 'activity' && accommodations.length > 1}
			<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
				Accommodation
				<select
					bind:value={accommodationId}
					class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
				>
					{#each accommodations as acc (acc.id)}
						<option value={acc.id}>{acc.name}</option>
					{/each}
				</select>
			</label>
		{/if}
		<label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
			Date <span class="font-normal text-slate-400">(optional)</span>
			<input
				type="date"
				bind:value={activityDate}
				min={dateConstraints.min}
				max={dateConstraints.max}
				class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
			/>
		</label>
	{/if}

	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-100 transition-all hover:bg-sky-500 hover:shadow-md active:scale-95"
		>
			Save
		</button>
		<button
			type="button"
			class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
			onclick={oncancel}
		>
			Cancel
		</button>
	</div>

	{#if error}
		<p class="flex w-full items-center gap-1.5 text-sm text-red-500">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			{error}
		</p>
	{/if}
</form>
