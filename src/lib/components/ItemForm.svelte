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

<form class="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3" onsubmit={handleSubmit}>
	{#if type === 'accommodation'}
		<label class="flex min-w-40 flex-1 flex-col gap-1 text-xs text-slate-600">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Hotel name"
				class="rounded border border-slate-300 px-2 py-1.5 text-sm"
			/>
		</label>
		<label class="flex flex-col gap-1 text-xs text-slate-600">
			Check-in
			<input type="date" bind:value={checkIn} class="rounded border border-slate-300 px-2 py-1.5 text-sm" />
		</label>
		<label class="flex flex-col gap-1 text-xs text-slate-600">
			Check-out
			<input type="date" bind:value={checkOut} class="rounded border border-slate-300 px-2 py-1.5 text-sm" />
		</label>
	{:else if type === 'car'}
		<label class="flex min-w-40 flex-1 flex-col gap-1 text-xs text-slate-600">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Rental car"
				class="rounded border border-slate-300 px-2 py-1.5 text-sm"
			/>
		</label>
		<label class="flex flex-col gap-1 text-xs text-slate-600">
			Pick-up
			<input type="date" bind:value={pickup} class="rounded border border-slate-300 px-2 py-1.5 text-sm" />
		</label>
		<label class="flex flex-col gap-1 text-xs text-slate-600">
			Drop-off
			<input type="date" bind:value={dropoff} class="rounded border border-slate-300 px-2 py-1.5 text-sm" />
		</label>
	{:else}
		<label class="flex min-w-40 flex-1 flex-col gap-1 text-xs text-slate-600">
			Name
			<input
				type="text"
				bind:value={name}
				placeholder="Activity name"
				class="rounded border border-slate-300 px-2 py-1.5 text-sm"
			/>
		</label>
		{#if type === 'activity' && accommodations.length > 1}
			<label class="flex flex-col gap-1 text-xs text-slate-600">
				Accommodation
				<select
					bind:value={accommodationId}
					class="rounded border border-slate-300 px-2 py-1.5 text-sm"
				>
					{#each accommodations as acc (acc.id)}
						<option value={acc.id}>{acc.name}</option>
					{/each}
				</select>
			</label>
		{/if}
		<label class="flex flex-col gap-1 text-xs text-slate-600">
			Date <span class="text-slate-400">(optional)</span>
			<input
				type="date"
				bind:value={activityDate}
				min={dateConstraints.min}
				max={dateConstraints.max}
				class="rounded border border-slate-300 px-2 py-1.5 text-sm"
			/>
		</label>
	{/if}

	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
		>
			Save
		</button>
		<button
			type="button"
			class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
			onclick={oncancel}
		>
			Cancel
		</button>
	</div>

	{#if error}
		<p class="w-full text-sm text-red-600">{error}</p>
	{/if}
</form>
