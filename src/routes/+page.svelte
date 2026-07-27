<script lang="ts">
	import { travelItems } from '$lib/data';

	type TimelineItem = {
		id: string;
		kind: string;
		name: string;
		start: string;
		end: string;
	};

	type CarRental = {
		id: string;
		name: string;
		start: string;
		end: string;
	};

	const HOUR_MS = 1000 * 60 * 60;
	const DAY_MS = 1000 * 60 * 60 * 24;
	const HOUR_HEIGHT = 3;
	const MIN_CARD_HEIGHT = 36;
	const NAME_CHARS_PER_LINE = 36;
	const BASE_CARD_HEIGHT = 40;
	const BASE_TRANSIT_CARD_HEIGHT = 48;
	const LINE_HEIGHT = 18;
	const TRANSIT_LINE_HEIGHT = 20;
	const MAPS_BUTTON_HEIGHT = 24;
	const CARD_GAP = 1;

	let tableSection: HTMLElement;
	let isExporting = $state(false);
	let exportError = $state('');

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
		const minHeight =
			item.kind === 'accommodation'
				? desiredCardHeight(`${itemEmoji(item.kind)} ${item.name}`) + MAPS_BUTTON_HEIGHT
				: desiredCardHeight(
						`${itemEmoji(item.kind)} ${item.name}`,
						BASE_TRANSIT_CARD_HEIGHT,
						TRANSIT_LINE_HEIGHT
					);
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
			minHeight: 36
		};
	});

	const dayLayouts = buildDayLayouts([rawItemSegments, rawCarSegments]);
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

	function desiredCardHeight(
		lineOne: string,
		baseHeight = BASE_CARD_HEIGHT,
		lineHeight = LINE_HEIGHT
	): number {
		const nameLines = Math.max(1, Math.ceil(lineOne.length / NAME_CHARS_PER_LINE));
		return baseHeight + (nameLines - 1) * lineHeight;
	}

	async function downloadTableJpg(): Promise<void> {
		if (!tableSection || isExporting) return;

		isExporting = true;
		exportError = '';

		try {
			await document.fonts.ready;
			const { toJpeg } = await import('html-to-image');
			const width = tableSection.scrollWidth;
			const height = tableSection.scrollHeight;
			const dataUrl = await toJpeg(tableSection, {
				backgroundColor: '#ffffff',
				cacheBust: true,
				height,
				pixelRatio: 2,
				quality: 0.95,
				style: {
					height: `${height}px`,
					width: `${width}px`
				},
				width
			});

			const link = document.createElement('a');
			link.download = 'japan-vertical-calendar.jpg';
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error(error);
			exportError = 'Could not export the table. Please try again.';
		} finally {
			isExporting = false;
		}
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
					const durationHours = Math.max(0.25, (current.endMs - current.startMs) / HOUR_MS);
					const availableHours = current.endMs > dayStart + DAY_MS ? durationHours : remainingHours;
					requiredHourHeight = Math.max(requiredHourHeight, current.minHeight / availableHours);

					const next = daySegments[index + 1];
					if (next && next.startMs >= current.endMs) {
						const gapHours = Math.max(0.25, (next.startMs - current.startMs) / HOUR_MS);
						requiredHourHeight = Math.max(
							requiredHourHeight,
							(current.minHeight + CARD_GAP) / gapHours
						);
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

	function googleMapsUrl(name: string): string {
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
	}
</script>

<main class="mx-auto max-w-7xl px-1.5 py-3 sm:px-2 md:px-3">
	<header class="mb-3 flex flex-wrap items-start justify-between gap-2 px-0.5">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
				Japan Vertical Calendar
			</h1>
			<p class="mt-1 text-sm text-zinc-500">Date | Accommodation / Transit | Car rental</p>
			{#if exportError}
				<p class="mt-1 text-sm text-red-600">{exportError}</p>
			{/if}
		</div>
		<button
			type="button"
			class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
			disabled={isExporting}
			onclick={downloadTableJpg}
		>
			{isExporting ? 'Exporting...' : 'Export JPG'}
		</button>
	</header>

	<section
		bind:this={tableSection}
		class="relative overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1.5 shadow-sm sm:p-2.5"
		aria-label="Vertical travel timeline"
	>
		<div
			class="mb-1.5 grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-1.5 px-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:min-w-[720px] sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3 sm:px-1 sm:text-sm"
		>
			<div>Date</div>
			<div>Accommodation / Transit</div>
		</div>

		<div
			class="relative grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-1.5 sm:min-w-[720px] sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3"
			style={`height: ${timelineHeight}px;`}
		>
			<div class="pointer-events-none absolute left-0 right-0 top-0 h-full">
				{#each days as day}
					<div
						class="absolute left-0 right-0 border-t border-zinc-200"
						style={`top: ${day.lineTop}px;`}
					></div>
				{/each}
			</div>

			<div class="relative h-full">
				{#each days as day}
					<div
						class="absolute right-1 max-w-[68px] -translate-y-1/2 text-right text-[11px] font-normal leading-tight text-zinc-400 sm:max-w-none sm:text-sm"
						style={`top: ${day.centerTop}px;`}
					>
						{day.label}
					</div>
				{/each}
			</div>

			<div class="relative h-full rounded-md border border-zinc-200 bg-zinc-50/70 px-1 pr-7 sm:pr-9">
				{#each itemSegments as segment}
					<div
						class={`absolute left-0.5 right-6 overflow-hidden rounded-md border px-1.5 py-1 shadow-sm sm:left-1 sm:right-8 sm:px-2 sm:py-1.5 ${
							segment.kind === 'accommodation'
								? 'border-sky-200 bg-sky-100/90'
								: 'border-amber-200 bg-amber-100/90'
						}`}
						style={`top: ${segment.top}px; height: ${segment.height}px;`}
						title={`${segment.name} (${formatTimeRange(segment.start, segment.end)})`}
					>
						<div class="break-words pr-1 text-[13px] font-semibold leading-4 text-zinc-900 sm:text-sm sm:leading-5">
							{itemEmoji(segment.kind ?? 'transit')}
							{segment.name}
						</div>
						<p class="text-[11px] leading-4 text-zinc-500 sm:text-xs sm:leading-5">
							{formatTimeRange(segment.start, segment.end)}
						</p>
						{#if segment.kind === 'accommodation'}
							<a
								href={googleMapsUrl(segment.name)}
								target="_blank"
								rel="noopener noreferrer"
								class="mt-1 inline-flex items-center rounded border border-sky-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-sky-700 shadow-sm transition hover:bg-sky-50 sm:text-[11px]"
								aria-label={`Open ${segment.name} in Google Maps`}
							>
								Google Maps
							</a>
						{/if}
					</div>
				{/each}

				{#each carSegments as car}
					<div
						class="absolute right-1 flex w-5 flex-col items-center justify-between sm:right-1.5"
						style={`top: ${car.top}px; height: ${car.height}px;`}
						title={`${car.name} (${formatTimeRange(car.start, car.end)})`}
						aria-label={`${car.name}, ${formatTimeRange(car.start, car.end)}`}
					>
						<span class="rounded-full bg-white text-sm leading-none shadow-sm">🚗</span>
						<span class="my-0.5 w-0.5 flex-1 rounded-full bg-amber-500"></span>
						<span class="rounded-full bg-white text-sm leading-none shadow-sm">🚗</span>
					</div>
				{/each}
			</div>
		</div>
	</section>
</main>
