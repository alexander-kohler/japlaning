<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap, Marker } from 'leaflet';

	let {
		latitude,
		longitude,
		label = 'Current location',
		zoom = 12
	}: {
		latitude: number;
		longitude: number;
		label?: string;
		zoom?: number;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let map: LeafletMap | undefined;
	let marker: Marker | undefined;

	onMount(async () => {
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		if (!mapEl) return;

		// Served from /static/leaflet so Vite does not rewrite relative icon URLs.
		// Clear Leaflet's default imagePath so it is not prepended to our absolute paths.
		const DefaultProto = L.Icon.Default.prototype as L.Icon.Default & {
			_getIconUrl?: string;
		};
		delete DefaultProto._getIconUrl;
		L.Icon.Default.imagePath = '';
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: '/leaflet/marker-icon-2x.png',
			iconUrl: '/leaflet/marker-icon.png',
			shadowUrl: '/leaflet/marker-shadow.png'
		});

		map = L.map(mapEl, {
			zoomControl: true,
			attributionControl: true
		}).setView([latitude, longitude], zoom);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		marker = L.marker([latitude, longitude]).addTo(map).bindPopup(label);

		requestAnimationFrame(() => map?.invalidateSize());
	});

	$effect(() => {
		if (!map || !marker) return;
		marker.setLatLng([latitude, longitude]);
		marker.bindPopup(label);
		map.setView([latitude, longitude], zoom);
	});

	onDestroy(() => {
		map?.remove();
		map = undefined;
		marker = undefined;
	});
</script>

<div
	bind:this={mapEl}
	class="h-full min-h-[280px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
	role="img"
	aria-label={`Map centered on ${label}`}
></div>
