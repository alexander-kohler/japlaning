<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import LocationMap from '$lib/components/LocationMap.svelte';
	import {
		FALLBACK_LOCATION,
		fetchWeather,
		reverseGeocode,
		type LocationInfo,
		type WeatherCurrent
	} from '$lib/weather';

	let location = $state<LocationInfo | null>(null);
	let weather = $state<WeatherCurrent | null>(null);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Finding your location…');
	let usedFallback = $state(false);
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
		statusMessage = 'Finding your location…';

		try {
			const coords = await getBrowserPosition();
			const label = await reverseGeocode(coords.latitude, coords.longitude);
			location = {
				latitude: coords.latitude,
				longitude: coords.longitude,
				label,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
			};
			usedFallback = false;
		} catch {
			location = { ...FALLBACK_LOCATION };
			usedFallback = true;
			statusMessage = 'Location permission unavailable — showing Shinjuku.';
		}

		try {
			weather = await fetchWeather(location.latitude, location.longitude);
			status = 'ready';
			if (!usedFallback) statusMessage = '';
		} catch {
			status = 'error';
			statusMessage = 'Could not load weather for this location.';
		}
	}

	function getBrowserPosition(): Promise<GeolocationCoordinates> {
		return new Promise((resolvePos, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'));
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(pos) => resolvePos(pos.coords),
				(err) => reject(err),
				{ enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
			);
		});
	}

	const localTime = $derived(
		now.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZone: location?.timezone
		})
	);

	const localDate = $derived(
		now.toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: location?.timezone
		})
	);
</script>

<svelte:head>
	<title>Japlaning — Home</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6">
	<header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Where you are</h1>
			<p class="mt-1 text-sm text-zinc-500">
				Live map, local time, and weather for your current location.
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
		<section class="min-h-[320px] sm:min-h-[420px]" aria-label="Location map">
			{#if location}
				<LocationMap
					latitude={location.latitude}
					longitude={location.longitude}
					label={location.label}
				/>
			{:else}
				<div
					class="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500"
				>
					Loading map…
				</div>
			{/if}
		</section>

		<section class="flex flex-col gap-4" aria-label="Time and weather">
			<div class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
				<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">Local time</p>
				<p
					class="mt-2 font-semibold tabular-nums tracking-tight text-zinc-900 text-4xl sm:text-5xl"
				>
					{localTime}
				</p>
				<p class="mt-1 text-sm text-zinc-500">{localDate}</p>
				{#if location}
					<p class="mt-3 text-sm text-zinc-600">{location.label}</p>
					<p class="mt-0.5 text-xs text-zinc-400">
						{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
						{#if location.timezone}
							· {location.timezone}
						{/if}
					</p>
				{/if}
			</div>

			<div class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
				<p class="text-xs font-medium uppercase tracking-wide text-zinc-400">Current weather</p>
				{#if weather}
					<p
						class="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 tabular-nums sm:text-5xl"
					>
						{Math.round(weather.temperature)}°C
					</p>
					<p class="mt-1 text-sm text-zinc-600">{weather.label}</p>
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
				class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
				onclick={() => void loadLocation()}
			>
				Refresh location
			</button>
		</section>
	</div>
</main>
