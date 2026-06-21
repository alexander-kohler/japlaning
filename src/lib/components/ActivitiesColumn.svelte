<script lang="ts">
	import type { Activity, CalendarLayout } from '$lib/types';
	import type { PlannerStore } from '$lib/planner.svelte';
	import { formatDay } from '$lib/utils/dates';
	import {
		getActivitiesForCalendarDay,
		getAddContextForCalendarDay
	} from '$lib/utils/timeline';
	import ItemForm from './ItemForm.svelte';

	type Props = {
		store: PlannerStore;
		layout: CalendarLayout;
		rowOffset: number;
	};

	let { store, layout, rowOffset }: Props = $props();

	let editingId = $state<string | null>(null);
	let addingForKey = $state<string | null>(null);

	function getActivityInitial(id: string): Record<string, string> {
		const act = store.data.activities.find((a) => a.id === id);
		if (!act) return {};
		return {
			name: act.name,
			accommodationId: act.accommodationId ?? '',
			activityDate: act.date ?? ''
		};
	}

	function getBetweenDateConstraints(activity: Activity) {
		if (!activity.betweenStays) return {};
		const { afterAccommodationId, beforeAccommodationId } = activity.betweenStays;
		const transition = store.transitionDays.find(
			(t) =>
				t.fromAccommodationId === afterAccommodationId &&
				t.toAccommodationId === beforeAccommodationId
		);
		if (transition) return { min: transition.date, max: transition.date };
		const gap = store.gapRanges.find(
			(g) =>
				g.afterAccommodationId === afterAccommodationId &&
				g.beforeAccommodationId === beforeAccommodationId
		);
		if (gap) return { min: gap.startDate, max: gap.endDate };
		return {};
	}

	function cardClasses(tone: 'stay' | 'transit' | 'gap') {
		if (tone === 'stay') {
			return 'border-violet-200 bg-violet-100 text-violet-900';
		}
		return 'border-amber-200 bg-amber-100 text-amber-900';
	}

	function handleEditSubmit(id: string, values: Record<string, string>) {
		const existing = store.data.activities.find((a) => a.id === id);
		if (!existing) return;

		if (existing.betweenStays) {
			store.updateActivity(id, {
				name: values.name,
				date: values.activityDate || undefined,
				betweenStays: existing.betweenStays
			});
		} else {
			store.updateActivity(id, {
				name: values.name,
				accommodationId: existing.accommodationId,
				date: values.activityDate || undefined
			});
		}
		editingId = null;
	}

	function handleAddSubmit(accommodationId: string, values: Record<string, string>) {
		store.addActivity({
			name: values.name,
			accommodationId,
			date: values.activityDate || undefined
		});
		addingForKey = null;
	}

	function handleAddBetween(
		afterId: string,
		beforeId: string,
		values: Record<string, string>,
		defaultDate?: string
	) {
		store.addBetweenActivity(afterId, beforeId, {
			name: values.name,
			date: values.activityDate || defaultDate
		});
		addingForKey = null;
	}
</script>

{#each layout.days as day (day.date)}
	{@const entries = getActivitiesForCalendarDay(
		day.date,
		store.data.activities,
		store.data.accommodations,
		store.gapRanges,
		store.transitionDays
	)}
	{@const addContext = getAddContextForCalendarDay(
		day.date,
		store.data.accommodations,
		store.gapRanges,
		store.transitionDays
	)}
	{@const key = `day-${day.date}`}
	<div
		class="z-10 flex flex-col gap-1 border-b border-l border-slate-200 p-1.5"
		style="grid-row: {rowOffset + day.gridRowTop} / span 2; grid-column: 3"
	>
		{#if addContext || entries.length > 0}
			<div class="flex min-h-0 flex-1 flex-col justify-center gap-1">
				{#each entries as { activity, tone } (activity.id)}
					{#if editingId === activity.id}
						{#key activity.id}
							<ItemForm
								type={activity.betweenStays ? 'between-activity' : 'activity'}
								accommodations={store.data.accommodations}
								dateConstraints={activity.betweenStays
									? getBetweenDateConstraints(activity)
									: undefined}
								initial={getActivityInitial(activity.id)}
								onsubmit={(v) => handleEditSubmit(activity.id, v)}
								oncancel={() => (editingId = null)}
							/>
						{/key}
					{:else}
						<div
							class="group flex items-center justify-between rounded-lg border px-2 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md {cardClasses(tone)}"
						>
							<div class="min-w-0 flex-1 truncate">
								<span class="font-medium">{activity.name}</span>
								{#if activity.date}
									<span class="ml-2 text-xs opacity-60">{formatDay(activity.date)}</span>
								{/if}
							</div>
							<div class="ml-1 flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									type="button"
									class="flex h-5 w-5 items-center justify-center rounded-md bg-white/70 text-slate-500 hover:bg-white hover:text-slate-700"
									onclick={() => (editingId = activity.id)}
									aria-label="Edit activity"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
									</svg>
								</button>
								<button
									type="button"
									class="flex h-5 w-5 items-center justify-center rounded-md bg-white/70 text-red-400 hover:bg-white hover:text-red-600"
									onclick={() => store.removeActivity(activity.id)}
									aria-label="Delete activity"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
									</svg>
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		{#if addContext}
			<div class="flex justify-end">
				<button
					type="button"
					class="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
					onclick={() => (addingForKey = addingForKey === key ? null : key)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
					Add
				</button>
			</div>

			{#if addingForKey === key}
				{#if addContext.kind === 'stay'}
					<ItemForm
						type="activity"
						accommodations={store.data.accommodations}
						initial={{ accommodationId: addContext.accommodationId, activityDate: day.date }}
						onsubmit={(v) => handleAddSubmit(addContext.accommodationId, v)}
						oncancel={() => (addingForKey = null)}
					/>
				{:else}
					<ItemForm
						type="between-activity"
						dateConstraints={{ min: addContext.min, max: addContext.max }}
						initial={{ activityDate: day.date }}
						onsubmit={(v) =>
							handleAddBetween(addContext.afterId, addContext.beforeId, v, day.date)}
						oncancel={() => (addingForKey = null)}
					/>
				{/if}
			{/if}
		{/if}
	</div>
{/each}
