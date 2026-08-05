<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Map as LeafletMap, Marker } from 'leaflet';
	import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
	import markerIcon from 'leaflet/dist/images/marker-icon.png';
	import markerShadow from 'leaflet/dist/images/marker-shadow.png';

	let {
		latitude,
		longitude,
		label = 'Current location'
	}: {
		latitude: number;
		longitude: number;
		label?: string;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let map: LeafletMap | undefined;
	let marker: Marker | undefined;

	onMount(async () => {
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		if (!mapEl) return;

		L.Icon.Default.mergeOptions({
			iconRetinaUrl: markerIcon2x,
			iconUrl: markerIcon,
			shadowUrl: markerShadow
		});

		map = L.map(mapEl, {
			zoomControl: true,
			attributionControl: true
		}).setView([latitude, longitude], 13);

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
		map.setView([latitude, longitude], map.getZoom());
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
