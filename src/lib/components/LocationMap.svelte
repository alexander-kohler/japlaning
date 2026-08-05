<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import {
		Map,
		Marker,
		NavigationControl,
		Popup,
		type Map as MaplibreMap,
		type Marker as MaplibreMarker,
		type StyleSpecification
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	/** Local OpenMapTiles "MapTiler Basic" style (used when no MapTiler key is set). */
	const LOCAL_BASIC_STYLE = '/map-styles/maptiler-basic.json';
	const OPENFREEMAP_TILEJSON = 'https://tiles.openfreemap.org/planet';

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
	let styleError = $state('');

	async function resolveStyle(): Promise<string | StyleSpecification> {
		const key = browser ? env.PUBLIC_MAPTILER_API_KEY?.trim() : '';
		if (key) {
			// Official MapTiler Basic vector style.
			return `https://api.maptiler.com/maps/basic-v2/style.json?key=${encodeURIComponent(key)}`;
		}

		// Open-source MapTiler Basic style + OpenFreeMap tiles (no API key).
		const [style, tilejson] = await Promise.all([
			fetch(LOCAL_BASIC_STYLE).then((r) => {
				if (!r.ok) throw new Error('Failed to load map style');
				return r.json() as Promise<StyleSpecification>;
			}),
			fetch(OPENFREEMAP_TILEJSON).then((r) => {
				if (!r.ok) throw new Error('Failed to load map tiles');
				return r.json() as Promise<{
					tiles: string[];
					minzoom?: number;
					maxzoom?: number;
					attribution?: string;
				}>;
			})
		]);

		style.sources = {
			openmaptiles: {
				type: 'vector',
				tiles: tilejson.tiles,
				minzoom: tilejson.minzoom ?? 0,
				maxzoom: tilejson.maxzoom ?? 14,
				attribution:
					tilejson.attribution ??
					'© <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}
		};
		style.glyphs = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
		style.sprite = 'https://openmaptiles.github.io/maptiler-basic-gl-style/sprite';

		return style;
	}

	onMount(() => {
		if (!mapEl) return;

		let cancelled = false;

		void (async () => {
			try {
				const style = await resolveStyle();
				if (cancelled || !mapEl) return;

				const instance = new Map({
					container: mapEl,
					style,
					center: [longitude, latitude],
					zoom: Math.min(zoom, 14),
					maxZoom: 18,
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

				instance.on('error', (event) => {
					console.error('MapLibre error', event.error);
					styleError = event.error?.message ?? 'Map failed to load tiles';
				});
			} catch (error) {
				console.error(error);
				styleError = error instanceof Error ? error.message : 'Map failed to load';
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!map || !marker) return;
		marker.setLngLat([longitude, latitude]);
		marker.setPopup(new Popup({ offset: 16 }).setText(label));
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
		class="h-full min-h-[280px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-[#e8e0d0]"
		role="img"
		aria-label={`Map centered on ${label}`}
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
