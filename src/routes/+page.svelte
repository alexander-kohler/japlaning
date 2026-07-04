<script lang="ts">
	import { travelItems } from '$lib/data';

	type Activity = {
		id: string;
		name: string;
		start?: string;
		end?: string;
	};

	type TimelineItem = {
		id: string;
		kind: string;
		name: string;
		start: string;
		end: string;
		activities?: Activity[];
	};

	type CarRental = {
		id: string;
		name: string;
		start: string;
		end: string;
	};

	const HOUR_MS = 1000 * 60 * 60;
	const DAY_MS = 1000 * 60 * 60 * 24;
	const HOUR_HEIGHT = 2.5;
	const MIN_CARD_HEIGHT = 22;
	const NAME_CHARS_PER_LINE = 34;
	const BASE_CARD_HEIGHT = 26;
	const LINE_HEIGHT = 12;
	const CARD_GAP = 1;

	const items = [...(travelItems.items as TimelineItem[])].sort(
		(a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
	);

	const cars = travelItems.cars as CarRental[];

	const timelineStartMs = toStartOfDay(
		Math.min(
			...items.map((item) => new Date(item.start).getTime()),
			...cars.map((car) => new Date(car.start).getTime())
		)
	);
	const timelineEndMs = toEndOfDay(
		Math.max(
			...items.map((item) => new Date(item.end).getTime()),
			...cars.map((car) => new Date(car.end).getTime())
		)
	);

	type Segment = {
		id: string;
		name: string;
		top: number;
		height: number;
		start: string;
		end: string;
		kind?: string;
		emoji?: string;
	};

	type RawSegment = {
		id: string;
		name: string;
		start: string;
		end: string;
		startMs: number;
		endMs: number;
		kind?: string;
		emoji?: string;
		minHeight: number;
	};

	type DayLayout = {
		dayStart: number;
		top: number;
		hourHeight: number;
		height: number;
	};

	const rawItemSegments: RawSegment[] = items.map((item) => {
		const startMs = new Date(item.start).getTime();
		const endMs = new Date(item.end).getTime();
		const minHeight = desiredCardHeight(`${itemEmoji(item.kind)} ${item.name}`);
		return {
			id: item.id,
			name: item.name,
			start: item.start,
			end: item.end,
			startMs,
			endMs,
			kind: item.kind,
			emoji: transitEmoji(item.kind),
			minHeight
		};
	});

	const rawActivitySegments: RawSegment[] = items.flatMap((item) => {
		if (!item.activities?.length) return [];
		const parentStartMs = new Date(item.start).getTime();
		const parentEndMs = new Date(item.end).getTime();

		return item.activities.map((activity) => {
			const rawStartMs = activity.start ? new Date(activity.start).getTime() : parentStartMs;
			const rawEndMs = activity.end ? new Date(activity.end).getTime() : rawStartMs + 2 * HOUR_MS;
			const safeStartMs = Math.max(parentStartMs, rawStartMs);
			const safeEndMs = Math.max(safeStartMs + HOUR_MS, Math.min(parentEndMs, rawEndMs));
			const desiredHeight = desiredCardHeight(`🎯 ${activity.name}`);

			return {
				id: activity.id,
				name: activity.name,
				start: activity.start ?? item.start,
				end: activity.end ?? item.end,
				startMs: safeStartMs,
				endMs: safeEndMs,
				minHeight: desiredHeight
			};
		});
	});

	const rawCarSegments: RawSegment[] = cars.map((car) => {
		const startMs = new Date(car.start).getTime();
		const endMs = new Date(car.end).getTime();
		return {
			id: car.id,
			name: car.name,
			start: car.start,
			end: car.end,
			startMs,
			endMs,
			minHeight: 24
		};
	});

	const dayLayouts = buildDayLayouts([rawItemSegments, rawActivitySegments, rawCarSegments]);
	const dayLayoutMap = new Map(dayLayouts.map((layout) => [layout.dayStart, layout]));

	const itemSegments: Segment[] = rawItemSegments.map((segment) => ({
		id: segment.id,
		name: segment.name,
		start: segment.start,
		end: segment.end,
		kind: segment.kind,
		emoji: segment.emoji,
		top: pxFromMs(segment.startMs),
		height: scaledHeightFromMs(segment.startMs, segment.endMs, segment.minHeight)
	}));

	const activitySegments: Segment[] = rawActivitySegments.map((segment) => ({
		id: segment.id,
		name: segment.name,
		start: segment.start,
		end: segment.end,
		top: pxFromMs(segment.startMs),
		height: scaledHeightFromMs(segment.startMs, segment.endMs, segment.minHeight)
	}));

	const carSegments: Segment[] = rawCarSegments.map((segment) => ({
		id: segment.id,
		name: segment.name,
		start: segment.start,
		end: segment.end,
		top: pxFromMs(segment.startMs),
		height: scaledHeightFromMs(segment.startMs, segment.endMs, segment.minHeight)
	}));

	const timelineHeight = Math.max(
		300,
		totalDayHeight(dayLayouts),
		maxBottom(itemSegments),
		maxBottom(activitySegments),
		maxBottom(carSegments)
	);

	const days = buildDays();

	function formatCompactDateTime(value: string): string {
		return new Date(value).toLocaleString('en-GB', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function toStartOfDay(ms: number): number {
		const date = new Date(ms);
		date.setHours(0, 0, 0, 0);
		return date.getTime();
	}

	function toEndOfDay(ms: number): number {
		return toStartOfDay(ms) + DAY_MS;
	}

	function pxFromMs(ms: number): number {
		const dayStart = toStartOfDay(ms);
		const layout = dayLayoutMap.get(dayStart);
		if (!layout) return 0;
		const hourInDay = (ms - dayStart) / HOUR_MS;
		return layout.top + hourInDay * layout.hourHeight;
	}

	function desiredCardHeight(lineOne: string): number {
		const nameLines = Math.max(1, Math.ceil(lineOne.length / NAME_CHARS_PER_LINE));
		return BASE_CARD_HEIGHT + (nameLines - 1) * LINE_HEIGHT;
	}

	function scaledHeightFromMs(startMs: number, endMs: number, minHeight: number): number {
		let cursor = startMs;
		let total = 0;

		while (cursor < endMs) {
			const dayStart = toStartOfDay(cursor);
			const layout = dayLayoutMap.get(dayStart);
			if (!layout) break;
			const dayEnd = dayStart + DAY_MS;
			const sliceEnd = Math.min(endMs, dayEnd);
			const hours = (sliceEnd - cursor) / HOUR_MS;
			total += hours * layout.hourHeight;
			cursor = sliceEnd;
		}

		return Math.max(MIN_CARD_HEIGHT, minHeight, total);
	}

	function maxBottom(segments: Segment[]): number {
		return segments.reduce((max, segment) => Math.max(max, segment.top + segment.height), 0);
	}

	function totalDayHeight(layouts: DayLayout[]): number {
		if (!layouts.length) return 0;
		const last = layouts[layouts.length - 1];
		return last.top + last.height;
	}

	function buildDays(): Array<{ label: string; lineTop: number; centerTop: number }> {
		const output: Array<{ label: string; lineTop: number; centerTop: number }> = [];
		for (const layout of dayLayouts) {
			output.push({
				label: new Date(layout.dayStart).toLocaleDateString('en-GB', {
					weekday: 'short',
					day: '2-digit',
					month: 'short'
				}),
				lineTop: layout.top,
				centerTop: layout.top + layout.height / 2
			});
		}
		return output;
	}

	function buildDayLayouts(columns: RawSegment[][]): DayLayout[] {
		const dayStarts: number[] = [];
		for (let cursor = timelineStartMs; cursor < timelineEndMs; cursor += DAY_MS) {
			dayStarts.push(cursor);
		}

		const hourHeightByDay = new Map<number, number>();
		for (const dayStart of dayStarts) {
			hourHeightByDay.set(dayStart, HOUR_HEIGHT);
		}

		for (const segments of columns) {
			const byDay = new Map<number, RawSegment[]>();
			for (const segment of segments) {
				const dayStart = toStartOfDay(segment.startMs);
				const list = byDay.get(dayStart) ?? [];
				list.push(segment);
				byDay.set(dayStart, list);
			}

			for (const [dayStart, daySegments] of byDay.entries()) {
				daySegments.sort((a, b) => a.startMs - b.startMs);
				let requiredHourHeight = hourHeightByDay.get(dayStart) ?? HOUR_HEIGHT;

				for (let index = 0; index < daySegments.length; index += 1) {
					const current = daySegments[index];
					const hourInDay = (current.startMs - dayStart) / HOUR_MS;
					const remainingHours = Math.max(0.25, 24 - hourInDay);
					requiredHourHeight = Math.max(requiredHourHeight, current.minHeight / remainingHours);

					const next = daySegments[index + 1];
					if (next && next.startMs >= current.endMs) {
						const gapHours = Math.max(0.25, (next.startMs - current.startMs) / HOUR_MS);
						requiredHourHeight = Math.max(requiredHourHeight, (current.minHeight + CARD_GAP) / gapHours);
					}
				}

				hourHeightByDay.set(dayStart, requiredHourHeight);
			}
		}

		const layouts: DayLayout[] = [];
		let runningTop = 0;
		for (const dayStart of dayStarts) {
			const hourHeight = hourHeightByDay.get(dayStart) ?? HOUR_HEIGHT;
			const height = hourHeight * 24;
			layouts.push({ dayStart, top: runningTop, hourHeight, height });
			runningTop += height;
		}

		return layouts;
	}

	function formatTimeRange(start: string, end: string): string {
		return `${formatCompactDateTime(start)} -> ${formatCompactDateTime(end)}`;
	}

	function itemEmoji(kind: string): string {
		if (kind === 'accommodation') return '🏨';
		return transitEmoji(kind);
	}

	function transitEmoji(kind: string): string {
		if (kind === 'ferry') return '⛴️';
		if (kind === 'plane') return '✈️';
		return '🚆';
	}
</script>

<main class="mx-auto max-w-7xl px-2 py-3 md:px-3">
	<header class="mb-3">
		<h1 class="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">Japan Vertical Calendar</h1>
		<p class="mt-1 text-xs text-zinc-600">Date | Accommodation / Transit | Activities</p>
	</header>

	<section
		class="relative overflow-x-auto rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm"
		aria-label="Vertical travel timeline"
	>
		<div class="mb-1 grid min-w-[860px] grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
			<div>Date</div>
			<div>Accommodation / Transit</div>
			<div>Activities</div>
		</div>

		<div
			class="relative grid min-w-[860px] grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-2"
			style={`height: ${timelineHeight}px;`}
		>
			<div class="pointer-events-none absolute left-0 right-0 top-0 h-full">
				{#each days as day}
					<div class="absolute left-0 right-0 border-t border-zinc-200" style={`top: ${day.lineTop}px;`}></div>
				{/each}
			</div>

			<div class="relative h-full">
				{#each days as day}
					<div class="absolute right-1 -translate-y-1/2 text-[10px] font-medium text-zinc-500" style={`top: ${day.centerTop}px;`}>
						{day.label}
					</div>
				{/each}
			</div>

			<div class="relative h-full rounded-md border border-zinc-200 bg-zinc-50/70 px-1">
				{#each itemSegments as segment}
					<div
						class={`absolute left-1 right-1 rounded-md border px-1.5 py-1 shadow-sm ${
							segment.kind === 'accommodation'
								? 'border-sky-200 bg-sky-100/90'
								: 'border-amber-200 bg-amber-100/90'
						}`}
						style={`top: ${segment.top}px; height: ${segment.height}px;`}
						title={`${segment.name} (${formatTimeRange(segment.start, segment.end)})`}
					>
						<div class="pr-1 text-[11px] font-medium leading-4 text-zinc-900">
							{itemEmoji(segment.kind ?? 'transit')} {segment.name}
						</div>
						<p class="text-[10px] leading-3.5 text-zinc-700">
							{formatTimeRange(segment.start, segment.end)}
						</p>
					</div>
				{/each}
			</div>

			<div class="relative h-full rounded-md border border-zinc-200 bg-zinc-50/70 px-1">
				<div class="pointer-events-none absolute -left-[8px] top-0 h-full w-4">
					<div class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-zinc-300"></div>
					{#each carSegments as car}
						<div
							class="absolute left-1/2 flex w-5 -translate-x-1/2 flex-col items-center justify-between"
							style={`top: ${car.top}px; height: ${car.height}px;`}
							title={`${car.name} (${formatTimeRange(car.start, car.end)})`}
						>
							<span class="text-sm leading-none">🚗</span>
							<span class="w-px flex-1 bg-amber-500"></span>
							<span class="text-sm leading-none">🚗</span>
						</div>
					{/each}
				</div>

				{#if activitySegments.length}
					{#each activitySegments as activity}
						<div
							class="absolute left-1 right-1 rounded-md border border-emerald-200 bg-emerald-100/85 px-1.5 py-1 shadow-sm"
							style={`top: ${activity.top}px; height: ${activity.height}px;`}
							title={`${activity.name} (${formatTimeRange(activity.start, activity.end)})`}
						>
							<p class="pr-1 text-[11px] font-medium leading-4 text-zinc-900">🎯 {activity.name}</p>
							<p class="text-[10px] leading-3.5 text-zinc-700">
								{formatTimeRange(activity.start, activity.end)}
							</p>
						</div>
					{/each}
				{:else}
					<div class="absolute inset-x-2 top-2 rounded-md border border-dashed border-zinc-300 bg-white/70 p-2 text-xs text-zinc-500">
						No activities with times.
					</div>
				{/if}
			</div>
		</div>
	</section>
</main>
