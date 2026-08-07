<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import LocationMap from '$lib/components/LocationMap.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import { splitNameAndLocation, type TravelItem } from '$lib/data';
	import {
		formatNextUpCountdown,
		formatNextUpWhen,
		getNextUp,
		getTravelItemsForDay,
		nextUpKindLabel
	} from '$lib/trip-location';
	import {
		fetchWeather,
		resolveCurrentAccommodationLocation,
		type LocationInfo,
		type WeatherCurrent
	} from '$lib/weather';

	let { data } = $props();

	const JAPAN_TZ = 'Asia/Tokyo';

	let location = $state<LocationInfo | null>(null);
	let weather = $state<WeatherCurrent | null>(null);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Finding current accommodation…');
	let now = $state(new Date());

	let clockId: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		clockId = setInterval(() => {
			now = new Date();
		}, 1000);

		void loadLocation();
	});

	onDestroy(() => {
		if (clockId) clearInterval(clockId);
	});

	async function loadLocation(): Promise<void> {
		status = 'loading';
		statusMessage = 'Finding current accommodation…';

		try {
			location = await resolveCurrentAccommodationLocation(new Date());
			weather = await fetchWeather(location.latitude, location.longitude);
			status = 'ready';
			statusMessage = '';
		} catch {
			status = 'error';
			statusMessage = 'Could not load accommodation location or weather.';
		}
	}

	const japanTime = $derived(
		now.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: JAPAN_TZ
		})
	);

	const japanDate = $derived(
		now.toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: JAPAN_TZ
		})
	);

	const todayItems = $derived(data.authenticated ? getTravelItemsForDay(now) : []);
	const nextUp = $derived(data.authenticated ? getNextUp(now) : null);
	const nextUpCountdown = $derived(nextUp ? formatNextUpCountdown(now, nextUp) : '');
	const nextUpWhen = $derived(nextUp ? formatNextUpWhen(nextUp, now) : '');

	function kindLabel(kind: TravelItem['kind']): string {
		if (kind === 'accommodation') return 'Stay';
		if (kind === 'ferry') return 'Ferry';
		return 'Flight';
	}

	function formatItemWhen(item: TravelItem): string {
		const start = new Date(item.start);
		const end = new Date(item.end);

		if (item.kind === 'accommodation') {
			const startLabel = start.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			});
			const endLabel = end.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			});
			return `${startLabel} – ${endLabel}`;
		}

		const startTime = start.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
		const endTime = end.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
		const sameDay = item.start.slice(0, 10) === item.end.slice(0, 10);
		if (sameDay) return `${startTime} – ${endTime}`;

		const endDay = end.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short'
		});
		return `${startTime} – ${endDay} ${endTime}`;
	}

	function itemTitle(item: TravelItem): string {
		return splitNameAndLocation(item.name).displayName;
	}

	function itemSubtitle(item: TravelItem): string {
		const { location: place } = splitNameAndLocation(item.name);
		return place;
	}

	function todaysActivities(item: TravelItem) {
		const day = now.toLocaleDateString('en-CA', { timeZone: JAPAN_TZ });
		return (item.activities ?? []).filter(
			(activity) => activity.start != null && activity.start.slice(0, 10) === day
		);
	}
</script>

<svelte:head>
	<title>Japlaning — Home</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6">
	<header class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Current location</h1>
	</header>

	{#if statusMessage}
		<p
			class={`mb-4 text-sm ${status === 'error' ? 'text-red-600' : 'text-zinc-500'}`}
			role="status"
		>
			{statusMessage}
		</p>
	{/if}

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
		<section class="min-h-[320px] sm:min-h-[420px]" aria-label="Accommodation map">
			{#if location}
				<LocationMap
					latitude={location.latitude}
					longitude={location.longitude}
					zoom={8}
				/>
			{:else}
				<div
					class="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-zinc-200 bg-[#f4f6f8] text-sm text-zinc-500"
				>
					Loading map…
				</div>
			{/if}
		</section>

		<section class="flex flex-col gap-4" aria-label="Time and weather">
			<div class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
				<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">Japan time</p>
				<p
					class="mt-2 font-semibold tabular-nums tracking-tight text-zinc-900 text-4xl sm:text-5xl"
				>
					{japanTime}
				</p>
				<p class="mt-1 text-sm text-zinc-500">{japanDate}</p>
				{#if location?.city}
					<p class="mt-4 text-sm text-zinc-600">{location.city}</p>
				{/if}
			</div>

			<div class="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
				<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">Current weather</p>
				{#if weather}
					<div class="mt-3 flex items-center gap-4">
						<WeatherIcon kind={weather.icon} label={weather.label} class="h-14 w-14 shrink-0" />
						<div class="min-w-0">
							<p
								class="text-4xl font-semibold tracking-tight text-zinc-900 tabular-nums sm:text-5xl"
							>
								{Math.round(weather.temperature)}°C
							</p>
							<p class="mt-1 text-sm text-zinc-600">{weather.label}</p>
						</div>
					</div>
					<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
						<div>
							<dt class="text-zinc-400">Humidity</dt>
							<dd class="font-medium tabular-nums text-zinc-800">{weather.humidity}%</dd>
						</div>
						<div>
							<dt class="text-zinc-400">Wind</dt>
							<dd class="font-medium tabular-nums text-zinc-800">
								{Math.round(weather.windSpeed)} km/h
							</dd>
						</div>
					</dl>
				{:else if status === 'loading'}
					<p class="mt-3 text-sm text-zinc-500">Loading weather…</p>
				{:else}
					<p class="mt-3 text-sm text-zinc-500">Weather unavailable.</p>
				{/if}
			</div>
		</section>
	</div>

	{#if data.authenticated}
		{#if todayItems.length > 0}
			<section class="mt-6" aria-label="Today on the itinerary">
				<div class="mb-3 flex items-baseline justify-between gap-3">
					<h2 class="text-lg font-semibold tracking-tight text-zinc-900">Today</h2>
					<a
						href={resolve('/calendar')}
						class="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
					>
						Full calendar
					</a>
				</div>

				<ul class="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
					{#each todayItems as item (item.id)}
						{@const place = itemSubtitle(item)}
						{@const activities = todaysActivities(item)}
						<li class="px-4 py-4 sm:px-5">
							<div class="flex flex-wrap items-start justify-between gap-2">
								<div class="min-w-0">
									<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">
										{kindLabel(item.kind)}
									</p>
									{#if item.kind === 'accommodation'}
										<a
											href={resolve('/accommodation/[id]', { id: item.id })}
											class="mt-0.5 block text-base font-medium text-zinc-900 hover:underline"
										>
											{itemTitle(item)}
										</a>
									{:else}
										<p class="mt-0.5 text-base font-medium text-zinc-900">{itemTitle(item)}</p>
									{/if}
									{#if place}
										<p class="mt-0.5 text-sm text-zinc-500">{place}</p>
									{/if}
								</div>
								<p class="shrink-0 text-sm tabular-nums text-zinc-500">{formatItemWhen(item)}</p>
							</div>

							{#if activities.length > 0}
								<ul class="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
									{#each activities as activity (activity.id)}
										<li class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
											<span class="text-zinc-700">{activity.name}</span>
											{#if activity.start}
												<span class="tabular-nums text-zinc-400">
													{new Date(activity.start).toLocaleTimeString('en-GB', {
														hour: '2-digit',
														minute: '2-digit'
													})}{#if activity.end}
														–{new Date(activity.end).toLocaleTimeString('en-GB', {
															hour: '2-digit',
															minute: '2-digit'
														})}{/if}
												</span>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="mt-6" aria-label="Next up on the itinerary">
			<div class="mb-3 flex items-baseline justify-between gap-3">
				<h2 class="text-lg font-semibold tracking-tight text-zinc-900">Next up</h2>
				{#if todayItems.length === 0}
					<a
						href={resolve('/calendar')}
						class="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
					>
						Full calendar
					</a>
				{/if}
			</div>
			{#if nextUp}
				<div class="rounded-xl border border-zinc-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">
								{nextUpKindLabel(nextUp.kind)}
							</p>
							{#if nextUp.accommodationId}
								<a
									href={resolve('/accommodation/[id]', { id: nextUp.accommodationId })}
									class="mt-0.5 block text-lg font-medium text-zinc-900 hover:underline sm:text-xl"
								>
									{nextUp.title}
								</a>
							{:else}
								<p class="mt-0.5 text-lg font-medium text-zinc-900 sm:text-xl">{nextUp.title}</p>
							{/if}
							{#if nextUp.subtitle}
								<p class="mt-0.5 text-sm text-zinc-500">{nextUp.subtitle}</p>
							{/if}
						</div>
						<div class="shrink-0 text-right">
							<p class="text-lg font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-xl">
								{nextUpCountdown}
							</p>
							<p class="mt-0.5 text-sm tabular-nums text-zinc-500">{nextUpWhen}</p>
						</div>
					</div>
				</div>
			{:else}
				<p class="rounded-xl border border-zinc-200 bg-white px-4 py-5 text-sm text-zinc-500">
					Nothing left on the itinerary.
				</p>
			{/if}
		</section>
	{/if}
</main>
