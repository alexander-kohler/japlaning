<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		Map,
		Marker,
		NavigationControl,
		Popup,
		type Map as MaplibreMap,
		type Marker as MaplibreMarker
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	/** MapTiler Basic look (OpenMapTiles style) served locally with OpenFreeMap tiles. */
	const STYLE_URL = '/map-styles/maptiler-basic.json';

	let {
		latitude,
		longitude,
		label = 'Current accommodation',
		zoom = 14
	}: {
		latitude: number;
		longitude: number;
		label?: string;
		zoom?: number;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let map: MaplibreMap | undefined;
	let marker: MaplibreMarker | undefined;

	onMount(() => {
		if (!mapEl) return;

		const instance = new Map({
			container: mapEl,
			style: STYLE_URL,
			center: [longitude, latitude],
			zoom,
			attributionControl: { compact: true }
		});
		map = instance;

		instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');

		marker = new Marker({ color: '#2563eb' })
			.setLngLat([longitude, latitude])
			.setPopup(new Popup({ offset: 16 }).setText(label))
			.addTo(instance);

		instance.on('load', () => {
			instance.resize();
		});
	});

	$effect(() => {
		if (!map || !marker) return;
		marker.setLngLat([longitude, latitude]);
		marker.setPopup(new Popup({ offset: 16 }).setText(label));
		map.setCenter([longitude, latitude]);
		map.setZoom(zoom);
	});

	onDestroy(() => {
		marker?.remove();
		marker = undefined;
		map?.remove();
		map = undefined;
	});
</script>

<div
	bind:this={mapEl}
	class="h-full min-h-[280px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
	role="img"
	aria-label={`Map centered on ${label}`}
></div>
