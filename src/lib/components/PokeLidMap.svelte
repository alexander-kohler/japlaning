<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		Map,
		NavigationControl,
		Popup,
		setWorkerUrl,
		type GeoJSONSource,
		type Map as MaplibreMap,
		type MapLayerMouseEvent
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import type { PokeLid } from '$lib/poke-lids';
	import { pokemonLabel } from '$lib/poke-lids';

	setWorkerUrl(maplibreWorkerUrl);

	const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_ID = 'poke-lids';
	const CLUSTER_LAYER = 'poke-lids-clusters';
	const CLUSTER_COUNT = 'poke-lids-cluster-count';
	const UNCLUSTERED = 'poke-lids-unclustered';
	const STAMPED = 'poke-lids-stamped';

	let {
		lids,
		stampedIds,
		selectedId = null,
		onSelect
	}: {
		lids: PokeLid[];
		stampedIds: Set<string>;
		selectedId?: string | null;
		onSelect: (id: string) => void;
	} = $props();

	let mapEl: HTMLDivElement | undefined = $state();
	let map: MaplibreMap | undefined;
	let styleError = $state('');
	let resizeObserver: ResizeObserver | undefined;
	let popup: Popup | undefined;

	function toGeoJson(
		list: PokeLid[],
		stamped: Set<string>
	): {
		type: 'FeatureCollection';
		features: Array<{
			type: 'Feature';
			id?: number;
			properties: {
				id: string;
				stamped: number;
				title: string;
				place: string;
				prefecture: string;
			};
			geometry: { type: 'Point'; coordinates: [number, number] };
		}>;
	} {
		return {
			type: 'FeatureCollection',
			features: list.map((lid) => ({
				type: 'Feature',
				id: Number.isFinite(Number(lid.id)) ? Number(lid.id) : undefined,
				properties: {
					id: lid.id,
					stamped: stamped.has(lid.id) ? 1 : 0,
					title: pokemonLabel(lid),
					place: lid.cityEn || lid.city,
					prefecture: lid.prefecture
				},
				geometry: {
					type: 'Point',
					coordinates: [lid.lng, lid.lat]
				}
			}))
		};
	}

	function syncSource(): void {
		const source = map?.getSource(SOURCE_ID) as GeoJSONSource | undefined;
		source?.setData(toGeoJson(lids, stampedIds));
	}

	function flyToSelected(id: string | null | undefined): void {
		if (!map || !id) return;
		const lid = lids.find((item) => item.id === id);
		if (!lid) return;
		map.easeTo({ center: [lid.lng, lid.lat], zoom: Math.max(map.getZoom(), 10), duration: 500 });
	}

	onMount(() => {
		if (!mapEl) return;

		try {
			const instance = new Map({
				container: mapEl,
				style: OPENFREEMAP_STYLE,
				center: [138.2529, 36.2048],
				zoom: 4.6,
				maxZoom: 18,
				attributionControl: { compact: true }
			});
			map = instance;
			popup = new Popup({
				closeButton: false,
				closeOnClick: false,
				offset: 10,
				className: 'poke-lid-popup'
			});

			instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');

			instance.on('load', () => {
				instance.addSource(SOURCE_ID, {
					type: 'geojson',
					data: toGeoJson(lids, stampedIds),
					cluster: true,
					clusterMaxZoom: 11,
					clusterRadius: 42
				});

				instance.addLayer({
					id: CLUSTER_LAYER,
					type: 'circle',
					source: SOURCE_ID,
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': '#3f3f46',
						'circle-radius': ['step', ['get', 'point_count'], 16, 25, 20, 80, 26],
						'circle-opacity': 0.9,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#fff'
					}
				});

				instance.addLayer({
					id: CLUSTER_COUNT,
					type: 'symbol',
					source: SOURCE_ID,
					filter: ['has', 'point_count'],
					layout: {
						'text-field': ['get', 'point_count_abbreviated'],
						'text-size': 12
					},
					paint: {
						'text-color': '#fafafa'
					}
				});

				instance.addLayer({
					id: UNCLUSTERED,
					type: 'circle',
					source: SOURCE_ID,
					filter: ['!', ['has', 'point_count']],
					paint: {
						'circle-color': [
							'case',
							['==', ['get', 'stamped'], 1],
							'#ca8a04',
							'#ef4444'
						],
						'circle-radius': 7,
						'circle-stroke-width': 2,
						'circle-stroke-color': '#fff'
					}
				});

				instance.addLayer({
					id: STAMPED,
					type: 'circle',
					source: SOURCE_ID,
					filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'stamped'], 1]],
					paint: {
						'circle-radius': 11,
						'circle-color': 'transparent',
						'circle-stroke-width': 2,
						'circle-stroke-color': '#ca8a04'
					}
				});

				instance.resize();
			});

			instance.on('click', CLUSTER_LAYER, (event) => {
				const feature = event.features?.[0];
				if (!feature || feature.geometry.type !== 'Point') return;
				const clusterId = feature.properties?.cluster_id as number | undefined;
				if (clusterId == null) return;
				const source = instance.getSource(SOURCE_ID) as GeoJSONSource;
				const coords = feature.geometry.coordinates as [number, number];
				void source.getClusterExpansionZoom(clusterId).then((zoom) => {
					instance.easeTo({ center: coords, zoom });
				});
			});

			const selectFromEvent = (event: MapLayerMouseEvent) => {
				const feature = event.features?.[0];
				const id = feature?.properties?.id;
				if (typeof id === 'string' || typeof id === 'number') {
					onSelect(String(id));
				}
			};

			instance.on('click', UNCLUSTERED, selectFromEvent);
			instance.on('click', STAMPED, selectFromEvent);

			instance.on('mouseenter', CLUSTER_LAYER, () => {
				instance.getCanvas().style.cursor = 'pointer';
			});
			instance.on('mouseleave', CLUSTER_LAYER, () => {
				instance.getCanvas().style.cursor = '';
			});
			instance.on('mouseenter', UNCLUSTERED, (event) => {
				instance.getCanvas().style.cursor = 'pointer';
				const feature = event.features?.[0];
				if (!feature || feature.geometry.type !== 'Point' || !popup) return;
				const coords = feature.geometry.coordinates.slice() as [number, number];
				const title = String(feature.properties?.title ?? '');
				const place = String(feature.properties?.place ?? '');
				const pref = String(feature.properties?.prefecture ?? '');
				popup
					.setLngLat(coords)
					.setHTML(
						`<strong>${title}</strong><div class="poke-lid-popup-meta">${pref} · ${place}</div>`
					)
					.addTo(instance);
			});
			instance.on('mouseleave', UNCLUSTERED, () => {
				instance.getCanvas().style.cursor = '';
				popup?.remove();
			});

			instance.on('error', (event) => {
				console.error('MapLibre error', event.error);
				styleError = event.error?.message ?? 'Map failed to load tiles';
			});

			resizeObserver = new ResizeObserver(() => {
				instance.resize();
			});
			resizeObserver.observe(mapEl);
		} catch (error) {
			console.error(error);
			styleError = error instanceof Error ? error.message : 'Map failed to load';
		}
	});

	$effect(() => {
		lids;
		stampedIds;
		syncSource();
	});

	$effect(() => {
		flyToSelected(selectedId);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		resizeObserver = undefined;
		popup?.remove();
		popup = undefined;
		map?.remove();
		map = undefined;
	});
</script>

<div class="relative h-full min-h-[320px] w-full">
	<div
		bind:this={mapEl}
		class="h-full min-h-[320px] w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-[#f4f6f8]"
		role="img"
		aria-label="Map of Poké Lids across Japan"
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
	:global(.poke-lid-popup .maplibregl-popup-content) {
		padding: 0.45rem 0.6rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.25;
		color: #18181b;
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
	}

	:global(.poke-lid-popup-meta) {
		margin-top: 0.15rem;
		color: #71717a;
	}
</style>
