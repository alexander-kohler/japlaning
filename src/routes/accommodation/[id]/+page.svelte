<script lang="ts">
	import { resolve } from '$app/paths';
	import { splitNameAndLocation } from '$lib/data';

	let { data } = $props();

	const accommodation = $derived(data.accommodation);
	const { displayName, location } = $derived(splitNameAndLocation(accommodation.name));
	const activities = $derived(accommodation.activities ?? []);

	function formatStayRange(start: string, end: string): string {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const startLabel = startDate.toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		const endLabel = endDate.toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		return `${startLabel} – ${endLabel}`;
	}

	function formatTime(value: string): string {
		return new Date(value).toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatActivityWhen(start?: string, end?: string): string | null {
		if (!start) return null;
		const startDate = new Date(start);
		const day = startDate.toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		if (!end) return `${day} · ${formatTime(start)}`;
		return `${day} · ${formatTime(start)} – ${formatTime(end)}`;
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
</script>

<svelte:head>
	<title>{displayName} · Japlaning</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-3 py-4 sm:px-4 md:px-6">
	<a
		href={resolve('/calendar')}
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-800"
	>
		<span aria-hidden="true">‹</span>
		Back to calendar
	</a>

	<header class="mb-6">
		<div class="flex items-start gap-3">
			<span
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl text-sky-700"
				aria-hidden="true">🏨</span
			>
			<div class="min-w-0 flex-1">
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
					{displayName}
				</h1>
				<p class="mt-1 text-sm text-zinc-500">
					{formatStayRange(accommodation.start, accommodation.end)}
					{#if location}
						<span class="text-zinc-300"> · </span>{location}
					{/if}
				</p>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap gap-2">
			<a
				href={googleMapsUrl(accommodation.address ?? accommodation.name)}
				target="_blank"
				rel="noopener noreferrer external"
				class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="h-4 w-4"
					aria-hidden="true"
				>
					<path
						d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
					/>
				</svg>
				Google Maps
			</a>
			{#if accommodation.bookingUrl}
				<a
					href={accommodation.bookingUrl}
					target="_blank"
					rel="noopener noreferrer external"
					class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800"
				>
					<span aria-hidden="true">🔗</span>
					{bookingLabel(accommodation.bookingUrl)}
				</a>
			{/if}
		</div>

		{#if accommodation.address}
			<p class="mt-3 text-sm leading-relaxed text-zinc-500">{accommodation.address}</p>
		{/if}
	</header>

	<section aria-labelledby="activities-heading">
		<h2 id="activities-heading" class="text-sm font-semibold uppercase tracking-wide text-zinc-500">
			Activities
		</h2>

		{#if activities.length === 0}
			<p class="mt-3 text-sm text-zinc-400">No activities planned for this stay yet.</p>
		{:else}
			<ul class="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
				{#each activities as activity (activity.id)}
					{@const when = formatActivityWhen(activity.start, activity.end)}
					<li class="border-b border-zinc-100 last:border-b-0">
						<div class="flex items-start gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
							<span
								class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm"
								aria-hidden="true">★</span
							>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-zinc-900 sm:text-base">{activity.name}</p>
								{#if when}
									<p class="mt-0.5 text-xs text-zinc-500 sm:text-sm">{when}</p>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
