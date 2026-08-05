<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import LocationMap from '$lib/components/LocationMap.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import {
		fetchWeather,
		resolveCurrentAccommodationLocation,
		type LocationInfo,
		type WeatherCurrent
	} from '$lib/weather';

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

	/** Itinerary timestamps are Japan-local naive strings — format without TZ conversion. */
	function formatStayRange(start: string, end: string): string {
		const startLabel = new Date(start).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		const endLabel = new Date(end).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		return `${startLabel} – ${endLabel}`;
	}
</script>

<svelte:head>
	<title>Japlaning — Home</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6">
	<header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Where you are</h1>
			<p class="mt-1 text-sm text-zinc-500">
				Map, Japan time, and weather for the current stay on the itinerary.
			</p>
		</div>
		<a
			href={resolve('/calendar')}
			class="inline-flex shrink-0 items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
		>
			Open calendar
		</a>
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
					label={location.accommodationName}
					zoom={13}
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
				{#if location}
					<p class="mt-4 text-sm font-medium text-zinc-800">{location.accommodationName}</p>
					{#if location.city}
						<p class="mt-0.5 text-sm text-zinc-600">{location.city}</p>
					{/if}
					<p class="mt-1 text-xs text-zinc-400">{formatStayRange(location.start, location.end)}</p>
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

			<button
				type="button"
				class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
				onclick={() => void loadLocation()}
			>
				Refresh
			</button>
		</section>
	</div>
</main>
