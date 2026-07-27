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
		address?: string;
		bookingUrl?: string;
		activities?: Activity[];
	};

	type CarRental = {
		id: string;
		name: string;
		start: string;
		end: string;
	};

	type CardItem = {
		id: string;
		name: string;
		displayName: string;
		location: string;
		start: string;
		end: string;
		startMs: number;
		endMs: number;
		kind: string;
		address?: string;
		bookingUrl?: string;
		activities: Activity[];
		index: number;
		dateLabel: string | null;
		dateDayKey: number | null;
	};

	type DateRow = {
		type: 'date';
		id: string;
		label: string;
		dayKey: number;
		beforeIndex: number;
	};

	type CardRow = {
		type: 'card';
		item: CardItem;
	};

	type Row = DateRow | CardRow;

	type CarSpan = {
		id: string;
		name: string;
		start: string;
		end: string;
		firstIndex: number;
		lastIndex: number;
	};

	const CARD_GAP = 12;
	const DAY_MS = 1000 * 60 * 60 * 24;

	let tableSection: HTMLElement;
	let isExporting = $state(false);
	let exportError = $state('');

	const items = [...(travelItems.items as TimelineItem[])].sort(
		(a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
	);
	const cars = travelItems.cars as CarRental[];

	const cardItems: CardItem[] = items.map((item, index) => {
		const startMs = new Date(item.start).getTime();
		const endMs = new Date(item.end).getTime();
		const { displayName, location } = splitNameAndLocation(item.name);
		return {
			id: item.id,
			name: item.name,
			displayName,
			location,
			start: item.start,
			end: item.end,
			startMs,
			endMs,
			kind: item.kind,
			address: item.address,
			bookingUrl: item.bookingUrl,
			activities: item.activities ?? [],
			index,
			dateLabel: null,
			dateDayKey: null
		};
	});

	const tripStartMs = toStartOfDay(Math.min(...cardItems.map((item) => item.startMs)));
	const tripEndMs = toStartOfDay(Math.max(...cardItems.map((item) => item.endMs)));
	const tripDayCount = Math.round((tripEndMs - tripStartMs) / DAY_MS) + 1;

	function initialSimDayIndex(): number {
		const realToday = toStartOfDay(Date.now());
		if (realToday >= tripStartMs && realToday <= tripEndMs) {
			return Math.round((realToday - tripStartMs) / DAY_MS);
		}
		return 0;
	}

	let simDayIndex = $state(initialSimDayIndex());
	const todayMs = $derived(tripStartMs + simDayIndex * DAY_MS);

	const rows: Row[] = buildRows(cardItems);

	const carSpans: CarSpan[] = cars
		.map((car) => {
			const startMs = new Date(car.start).getTime();
			const endMs = new Date(car.end).getTime();
			let firstIndex = -1;
			let lastIndex = -1;

			for (const item of cardItems) {
				if (item.startMs < endMs && item.endMs > startMs) {
					if (firstIndex === -1) firstIndex = item.index;
					lastIndex = item.index;
				}
			}

			if (firstIndex === -1) return null;
			return {
				id: car.id,
				name: car.name,
				start: car.start,
				end: car.end,
				firstIndex,
				lastIndex
			};
		})
		.filter((span): span is CarSpan => span !== null);

	function isTransit(kind: string): boolean {
		return kind !== 'accommodation';
	}

	function isOvernight(item: CardItem): boolean {
		return toStartOfDay(item.startMs) !== toStartOfDay(item.endMs);
	}

	/** Same-day flights/trains keep the on-card date; overnight transit is treated like a stay. */
	function isSameDayTransit(item: CardItem): boolean {
		return isTransit(item.kind) && !isOvernight(item);
	}

	function isStayLike(item: CardItem): boolean {
		return item.kind === 'accommodation' || isOvernight(item);
	}

	function formatDateLabel(ms: number): string {
		return new Date(ms).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: '2-digit',
			month: 'short'
		});
	}

	function buildRows(cards: CardItem[]): Row[] {
		const output: Row[] = [];

		if (cards.length) {
			const dayKey = toStartOfDay(cards[0].startMs);
			output.push({
				type: 'date',
				id: `date-start-${cards[0].id}`,
				label: formatDateLabel(dayKey),
				dayKey,
				beforeIndex: 0
			});
		}

		for (let index = 0; index < cards.length; index += 1) {
			const item = cards[index];
			const previous = cards[index - 1];

			if (isSameDayTransit(item)) {
				const dayKey = toStartOfDay(item.startMs);
				item.dateLabel = formatDateLabel(dayKey);
				item.dateDayKey = dayKey;
				output.push({ type: 'card', item });
				continue;
			}

			// Stay-like after stay-like (incl. overnight ferry): date sits between them.
			if (previous && isStayLike(previous) && isStayLike(item)) {
				const changeDay = toStartOfDay(item.startMs);
				output.push({
					type: 'date',
					id: `date-${changeDay}-${item.id}`,
					label: formatDateLabel(changeDay),
					dayKey: changeDay,
					beforeIndex: item.index
				});
			}

			output.push({ type: 'card', item });
		}

		if (cards.length) {
			const last = cards[cards.length - 1];
			const dayKey = toStartOfDay(last.endMs);
			output.push({
				type: 'date',
				id: `date-end-${last.id}`,
				label: formatDateLabel(dayKey),
				dayKey,
				beforeIndex: cards.length
			});
		}

		return output;
	}

	function isCurrentDay(dayKey: number): boolean {
		return dayKey === todayMs;
	}

	function cardCoversToday(item: CardItem): boolean {
		return toStartOfDay(item.startMs) <= todayMs && toStartOfDay(item.endMs) >= todayMs;
	}

	const todayAlreadyLabeled = $derived(
		rows.some(
			(row) =>
				(row.type === 'date' && row.dayKey === todayMs) ||
				(row.type === 'card' && row.item.dateDayKey === todayMs)
		)
	);

	const todayCardId = $derived(
		todayAlreadyLabeled
			? undefined
			: cardItems.find((item) => cardCoversToday(item))?.id
	);

	function formatCompactDateTime(value: string): string {
		return new Date(value).toLocaleString('en-GB', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatBookingDateRange(start: string, end: string, kind?: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);

		if (kind === 'accommodation') {
			const startLabel = startDate.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			});
			const endLabel = endDate.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			});
			return `${startLabel} – ${endLabel}`;
		}

		return `${formatCompactDateTime(start)} → ${formatCompactDateTime(end)}`;
	}

	function splitNameAndLocation(name: string): { displayName: string; location: string } {
		if (/\s*->\s*/.test(name)) {
			return { displayName: name, location: '' };
		}

		const commaIndex = name.lastIndexOf(',');
		if (commaIndex === -1) {
			return { displayName: name, location: '' };
		}

		return {
			displayName: name.slice(0, commaIndex).trim(),
			location: name.slice(commaIndex + 1).trim()
		};
	}

	function toStartOfDay(ms: number): number {
		const date = new Date(ms);
		date.setHours(0, 0, 0, 0);
		return date.getTime();
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

	function formatTimeRange(start: string, end: string): string {
		return `${formatCompactDateTime(start)} -> ${formatCompactDateTime(end)}`;
	}

	function googleMapsUrl(query: string): string {
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
	}

	function bookingLabel(url: string): string {
		const lower = url.toLowerCase();
		if (lower.includes('airbnb.')) return 'Airbnb';
		if (lower.includes('booking.com')) return 'Booking.com';
		return 'Booking';
	}

	function kindLabel(kind?: string): string {
		if (kind === 'accommodation') return 'Stay';
		if (kind === 'ferry') return 'Ferry';
		if (kind === 'plane') return 'Flight';
		return 'Transit';
	}

	function thumbClasses(kind?: string): string {
		if (kind === 'accommodation') return 'text-sky-700';
		if (kind === 'plane') return 'text-violet-700';
		if (kind === 'ferry') return 'text-cyan-700';
		return 'text-amber-800';
	}

	function thumbEmoji(kind?: string): string {
		if (kind === 'accommodation') return '🏨';
		if (kind === 'ferry') return '⛴️';
		if (kind === 'plane') return '✈️';
		return '🚆';
	}

	function carRailForCard(index: number): Array<{
		span: CarSpan;
		isFirst: boolean;
		isLast: boolean;
	}> {
		return carSpans
			.filter((span) => index >= span.firstIndex && index <= span.lastIndex)
			.map((span) => ({
				span,
				isFirst: index === span.firstIndex,
				isLast: index === span.lastIndex
			}));
	}

	function carRailForDateBefore(beforeIndex: number): CarSpan[] {
		return carSpans.filter(
			(span) => beforeIndex > span.firstIndex && beforeIndex <= span.lastIndex
		);
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

	<label
		class="mb-3 flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-4"
	>
		<span class="shrink-0 text-sm font-medium text-zinc-700">Simulate day</span>
		<input
			class="min-w-0 flex-1 accent-sky-600"
			type="range"
			min="0"
			max={tripDayCount - 1}
			step="1"
			value={simDayIndex}
			oninput={(event) => {
				simDayIndex = Number(event.currentTarget.value);
			}}
			aria-valuetext={formatDateLabel(todayMs)}
		/>
		<span class="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-sky-600 tabular-nums">
			<span
				class="h-2 w-2 rounded-full bg-sky-500 ring-2 ring-sky-500/20"
				aria-hidden="true"
			></span>
			{formatDateLabel(todayMs)}
		</span>
	</label>

	<section
		bind:this={tableSection}
		class="relative overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100/80 p-1.5 shadow-sm sm:p-2.5"
		aria-label="Vertical travel timeline"
	>
		<div
			class="grid min-w-0 grid-cols-[76px_minmax(0,1fr)_28px] gap-x-1.5 sm:min-w-[720px] sm:grid-cols-[130px_minmax(0,1fr)_36px] sm:gap-x-3"
			style={`row-gap: ${CARD_GAP}px;`}
		>
			{#each rows as row (row.type === 'date' ? row.id : row.item.id)}
				{#if row.type === 'date'}
					{@const dateRails = carRailForDateBefore(row.beforeIndex)}
					{@const current = isCurrentDay(row.dayKey)}
					<div class="flex items-center justify-end gap-1.5">
						{#if current}
							<span
								class="h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-500/20"
								title="Today"
								aria-hidden="true"
							></span>
						{/if}
						<p
							class={`text-right text-[11px] leading-tight sm:text-sm ${
								current ? 'font-semibold text-sky-600' : 'font-medium text-zinc-500'
							}`}
						>
							{row.label}
						</p>
					</div>
					<div class="flex items-center" aria-hidden="true">
						<div class={`h-px w-full ${current ? 'bg-sky-300' : 'bg-zinc-200/80'}`}></div>
					</div>
					<div
						class="relative flex justify-center"
						style={`margin-bottom: -${CARD_GAP}px; padding-bottom: ${CARD_GAP}px; margin-top: -${CARD_GAP}px; padding-top: ${CARD_GAP}px;`}
					>
						{#each dateRails as span (span.id)}
							<div class="absolute inset-y-0 flex w-5 flex-col items-center" aria-hidden="true">
								<span class="w-0.5 flex-1 rounded-full bg-amber-500"></span>
							</div>
						{/each}
					</div>
				{:else}
					{@const segment = row.item}
					{@const rails = carRailForCard(segment.index)}
					{@const isLastCard = segment.index === cardItems.length - 1}

					<div class="relative flex items-center justify-end gap-1.5">
						{#if segment.dateLabel && segment.dateDayKey !== null}
							{@const current = isCurrentDay(segment.dateDayKey)}
							{#if current}
								<span
									class="h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-500/20"
									title="Today"
									aria-hidden="true"
								></span>
							{/if}
							<p
								class={`text-right text-[11px] leading-tight sm:text-sm ${
									current ? 'font-semibold text-sky-600' : 'font-medium text-zinc-500'
								}`}
							>
								{segment.dateLabel}
							</p>
						{:else if todayCardId === segment.id}
							<span
								class="h-2 w-2 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-500/20"
								title="Today"
								aria-hidden="true"
							></span>
							<p class="text-right text-[11px] font-semibold leading-tight text-sky-600 sm:text-sm">
								{formatDateLabel(todayMs)}
							</p>
						{/if}
					</div>

					<article
						class="rounded-xl border border-zinc-200 bg-white shadow-sm"
						title={`${segment.name} (${formatTimeRange(segment.start, segment.end)})`}
					>
						<div class="flex items-start gap-2.5 px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3">
							<div
								class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl sm:h-14 sm:w-14 sm:text-2xl ${thumbClasses(segment.kind)}`}
								aria-hidden="true"
							>
								{thumbEmoji(segment.kind)}
							</div>

							<div class="min-w-0 flex-1">
								<h3 class="text-sm font-semibold leading-snug text-zinc-900 sm:text-base">
									{segment.displayName}
								</h3>
								<p class="mt-0.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">
									{[
										formatBookingDateRange(segment.start, segment.end, segment.kind),
										segment.location,
										kindLabel(segment.kind)
									]
										.filter(Boolean)
										.join(' · ')}
								</p>
							</div>
						</div>

						{#if segment.kind === 'accommodation' || segment.activities.length}
							<ul class="border-t border-zinc-100">
								{#if segment.kind === 'accommodation'}
									<li class="border-b border-zinc-100 last:border-b-0">
										<a
											href={googleMapsUrl(segment.address ?? segment.name)}
											target="_blank"
											rel="noopener noreferrer external"
											class="flex items-center gap-2.5 px-2.5 py-2.5 text-left transition hover:bg-zinc-50 sm:px-3"
											aria-label={`Open ${segment.name} in Google Maps`}
										>
											<span
											class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500"
											aria-hidden="true"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												class="h-3.5 w-3.5"
											>
												<path
													d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
												/>
											</svg>
										</span>
										<span class="min-w-0 flex-1 text-[12px] text-zinc-700 sm:text-sm"
											>Google Maps</span
										>
											<span class="shrink-0 text-zinc-300" aria-hidden="true">›</span>
										</a>
									</li>
									{#if segment.bookingUrl}
										<li class="border-b border-zinc-100 last:border-b-0">
											<a
												href={segment.bookingUrl}
												target="_blank"
												rel="noopener noreferrer external"
												class="flex items-center gap-2.5 px-2.5 py-2.5 text-left transition hover:bg-zinc-50 sm:px-3"
												aria-label={`Open ${segment.name} on ${bookingLabel(segment.bookingUrl)}`}
											>
												<span
													class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm"
													aria-hidden="true">🔗</span
												>
												<span class="min-w-0 flex-1 text-[12px] text-zinc-700 sm:text-sm"
													>{bookingLabel(segment.bookingUrl)}</span
												>
												<span class="shrink-0 text-zinc-300" aria-hidden="true">›</span>
											</a>
										</li>
									{/if}
								{/if}
								{#each segment.activities as activity (activity.id)}
									<li class="border-b border-zinc-100 last:border-b-0">
										<div class="flex items-center gap-2.5 px-2.5 py-2.5 sm:px-3">
											<span
												class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm"
												aria-hidden="true">★</span
											>
											<span class="min-w-0 flex-1 text-[12px] text-zinc-700 sm:text-sm"
												>{activity.name}</span
											>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</article>

					<div
						class="relative flex justify-center"
						style={`margin-bottom: ${isLastCard ? '0' : `-${CARD_GAP}px`}; padding-bottom: ${isLastCard ? '0' : `${CARD_GAP}px`};`}
					>
						{#each rails as rail (rail.span.id)}
							<div
								class="absolute inset-y-0 flex w-5 flex-col items-center"
								title={`${rail.span.name} (${formatTimeRange(rail.span.start, rail.span.end)})`}
								aria-label={`${rail.span.name}, ${formatTimeRange(rail.span.start, rail.span.end)}`}
							>
								{#if rail.isFirst}
									<span class="rounded-full bg-white text-sm leading-none shadow-sm">🚗</span>
								{:else}
									<span class="h-1.5 w-0.5 rounded-full bg-amber-500" aria-hidden="true"></span>
								{/if}
								<span class="w-0.5 flex-1 rounded-full bg-amber-500" aria-hidden="true"></span>
								{#if rail.isLast}
									<span class="rounded-full bg-white text-sm leading-none shadow-sm">🚗</span>
								{:else}
									<span class="h-1.5 w-0.5 rounded-full bg-amber-500" aria-hidden="true"></span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</section>
</main>
