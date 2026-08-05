<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		Map,
		Marker,
		NavigationControl,
		setWorkerUrl,
		type Map as MaplibreMap,
		type Marker as MaplibreMarker
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	// Vite must bundle the worker as a self-contained chunk; without this, production
	// builds show a grey map (dev works because import.meta.url resolves differently).
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

	setWorkerUrl(maplibreWorkerUrl);

	/** OpenFreeMap Positron — light, no API key. */
	const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

	let {
		latitude,
		longitude,
		zoom = 10
	}: {
		latitude: number;
		longitude: number;
		zoom?: number;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let map: MaplibreMap | undefined;
	let marker: MaplibreMarker | undefined;
	let styleError = $state('');

	onMount(() => {
		if (!mapEl) return;

		try {
			const instance = new Map({
				container: mapEl,
				style: OPENFREEMAP_STYLE,
				center: [longitude, latitude],
				zoom: Math.min(zoom, 14),
				maxZoom: 18,
				attributionControl: { compact: true }
			});
			map = instance;

			instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');

			const markerEl = document.createElement('div');
			markerEl.className = 'location-marker';
			markerEl.setAttribute('aria-hidden', 'true');

			marker = new Marker({ element: markerEl, anchor: 'center' })
				.setLngLat([longitude, latitude])
				.addTo(instance);

			instance.on('load', () => {
				instance.resize();
			});

			instance.on('error', (event) => {
				console.error('MapLibre error', event.error);
				styleError = event.error?.message ?? 'Map failed to load tiles';
			});
		} catch (error) {
			console.error(error);
			styleError = error instanceof Error ? error.message : 'Map failed to load';
		}
	});

	$effect(() => {
		if (!map || !marker) return;
		marker.setLngLat([longitude, latitude]);
		map.setCenter([longitude, latitude]);
		map.setZoom(Math.min(zoom, map.getMaxZoom()));
	});

	onDestroy(() => {
		marker?.remove();
		marker = undefined;
		map?.remove();
		map = undefined;
	});
</script>

<div class="relative h-full min-h-[280px] w-full">
	<div
		bind:this={mapEl}
		class="h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-[#f4f6f8]"
		role="img"
		aria-label="Map of current accommodation"
	></div>
	{#if styleError}
		<p
			class="pointer-events-none absolute inset-x-3 bottom-3 rounded-md bg-white/90 px-3 py-2 text-xs text-red-700 shadow"
			role="alert"
		>
			{styleError}
		</p>
	{/if}
</div>

<style>
	:global(.location-marker) {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ef4444;
		border: 2px solid #fff;
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
		pointer-events: none;
	}
</style>
