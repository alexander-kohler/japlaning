<script lang="ts">
	import type { WeatherIconKind } from '$lib/weather';

	let {
		kind,
		label = 'Weather',
		class: className = 'h-12 w-12'
	}: {
		kind: WeatherIconKind;
		label?: string;
		class?: string;
	} = $props();
</script>

<svg
	class={className}
	viewBox="0 0 64 64"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label={label}
>
	{#if kind === 'clear'}
		<circle cx="32" cy="32" r="12" fill="#F5A524" />
		<g stroke="#F5A524" stroke-width="3" stroke-linecap="round">
			<line x1="32" y1="6" x2="32" y2="14" />
			<line x1="32" y1="50" x2="32" y2="58" />
			<line x1="6" y1="32" x2="14" y2="32" />
			<line x1="50" y1="32" x2="58" y2="32" />
			<line x1="13.5" y1="13.5" x2="19.2" y2="19.2" />
			<line x1="44.8" y1="44.8" x2="50.5" y2="50.5" />
			<line x1="50.5" y1="13.5" x2="44.8" y2="19.2" />
			<line x1="19.2" y1="44.8" x2="13.5" y2="50.5" />
		</g>
	{:else if kind === 'mainly-clear'}
		<circle cx="26" cy="26" r="10" fill="#F5A524" />
		<path d="M24 44h20a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 24 44Z" fill="#9CA3AF" />
	{:else if kind === 'partly-cloudy'}
		<circle cx="22" cy="22" r="9" fill="#F5A524" />
		<path d="M22 46h24a11 11 0 0 0 0-22 13 13 0 0 0-25.1 3.6A9 9 0 0 0 22 46Z" fill="#9CA3AF" />
	{:else if kind === 'overcast'}
		<path d="M18 42h30a12 12 0 0 0 0-24 14 14 0 0 0-27 4.2A10 10 0 0 0 18 42Z" fill="#9CA3AF" />
		<path d="M14 50h28a9 9 0 0 0 0-18 11 11 0 0 0-21.2 3.2A8 8 0 0 0 14 50Z" fill="#6B7280" />
	{:else if kind === 'fog'}
		<path
			d="M18 28h30a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 28Z"
			fill="#9CA3AF"
			opacity="0.7"
		/>
		<g stroke="#9CA3AF" stroke-width="3" stroke-linecap="round">
			<line x1="12" y1="36" x2="52" y2="36" />
			<line x1="16" y1="44" x2="48" y2="44" />
			<line x1="14" y1="52" x2="50" y2="52" />
		</g>
	{:else if kind === 'drizzle'}
		<path d="M18 30h28a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 30Z" fill="#9CA3AF" />
		<g stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round">
			<line x1="22" y1="38" x2="20" y2="46" />
			<line x1="32" y1="38" x2="30" y2="46" />
			<line x1="42" y1="38" x2="40" y2="46" />
			<line x1="27" y1="48" x2="25" y2="56" />
			<line x1="37" y1="48" x2="35" y2="56" />
		</g>
	{:else if kind === 'rain'}
		<path d="M18 28h28a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 28Z" fill="#6B7280" />
		<g stroke="#3B82F6" stroke-width="3" stroke-linecap="round">
			<line x1="22" y1="36" x2="18" y2="48" />
			<line x1="32" y1="36" x2="28" y2="48" />
			<line x1="42" y1="36" x2="38" y2="48" />
			<line x1="27" y1="48" x2="23" y2="60" />
			<line x1="37" y1="48" x2="33" y2="60" />
		</g>
	{:else if kind === 'snow'}
		<path d="M18 28h28a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 28Z" fill="#9CA3AF" />
		<g fill="#93C5FD">
			<circle cx="22" cy="40" r="2.5" />
			<circle cx="32" cy="38" r="2.5" />
			<circle cx="42" cy="40" r="2.5" />
			<circle cx="27" cy="50" r="2.5" />
			<circle cx="37" cy="48" r="2.5" />
			<circle cx="32" cy="56" r="2.5" />
		</g>
	{:else if kind === 'showers'}
		<path d="M18 26h28a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 26Z" fill="#6B7280" />
		<g stroke="#3B82F6" stroke-width="3" stroke-linecap="round">
			<line x1="20" y1="34" x2="16" y2="48" />
			<line x1="30" y1="34" x2="26" y2="48" />
			<line x1="40" y1="34" x2="36" y2="48" />
			<line x1="25" y1="48" x2="21" y2="60" />
			<line x1="35" y1="48" x2="31" y2="60" />
		</g>
	{:else if kind === 'thunderstorm'}
		<path d="M16 28h30a11 11 0 0 0 0-22 13 13 0 0 0-25.1 3.6A9 9 0 0 0 16 28Z" fill="#4B5563" />
		<path d="M30 30 22 44h8l-2 14 14-18h-8l6-10H30Z" fill="#F5A524" />
	{:else}
		<path d="M18 40h28a10 10 0 0 0 0-20 12 12 0 0 0-23.2 3.2A8 8 0 0 0 18 40Z" fill="#9CA3AF" />
		<circle cx="32" cy="48" r="2.5" fill="#6B7280" />
		<path d="M32 28v12" stroke="#6B7280" stroke-width="3" stroke-linecap="round" />
	{/if}
</svg>
