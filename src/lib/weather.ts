import {
	accommodationGeocodeQueries,
	cityFromItem,
	displayNameFromItem,
	getCurrentAccommodation
} from '$lib/trip-location';
import { splitNameAndLocation, type TravelItem } from '$lib/data';

/** WMO weather interpretation codes used by Open-Meteo. */
export function weatherLabel(code: number): string {
	if (code === 0) return 'Clear sky';
	if (code === 1) return 'Mainly clear';
	if (code === 2) return 'Partly cloudy';
	if (code === 3) return 'Overcast';
	if (code === 45 || code === 48) return 'Fog';
	if (code === 51 || code === 53 || code === 55) return 'Drizzle';
	if (code === 56 || code === 57) return 'Freezing drizzle';
	if (code === 61 || code === 63 || code === 65) return 'Rain';
	if (code === 66 || code === 67) return 'Freezing rain';
	if (code === 71 || code === 73 || code === 75) return 'Snow';
	if (code === 77) return 'Snow grains';
	if (code === 80 || code === 81 || code === 82) return 'Rain showers';
	if (code === 85 || code === 86) return 'Snow showers';
	if (code === 95) return 'Thunderstorm';
	if (code === 96 || code === 99) return 'Thunderstorm with hail';
	return 'Unknown';
}

/** Coarse icon category for UI weather glyphs. */
export type WeatherIconKind =
	| 'clear'
	| 'mainly-clear'
	| 'partly-cloudy'
	| 'overcast'
	| 'fog'
	| 'drizzle'
	| 'rain'
	| 'snow'
	| 'showers'
	| 'thunderstorm'
	| 'unknown';

export function weatherIconKind(code: number): WeatherIconKind {
	if (code === 0) return 'clear';
	if (code === 1) return 'mainly-clear';
	if (code === 2) return 'partly-cloudy';
	if (code === 3) return 'overcast';
	if (code === 45 || code === 48) return 'fog';
	if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return 'drizzle';
	if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67) return 'rain';
	if (code === 71 || code === 73 || code === 75 || code === 77) return 'snow';
	if (code === 80 || code === 81 || code === 82 || code === 85 || code === 86) return 'showers';
	if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
	return 'unknown';
}

export type WeatherCurrent = {
	temperature: number;
	humidity: number;
	windSpeed: number;
	weatherCode: number;
	label: string;
	icon: WeatherIconKind;
};

export type LocationInfo = {
	latitude: number;
	longitude: number;
	label: string;
	city: string;
	accommodationName: string;
	address?: string;
	start: string;
	end: string;
	accommodationId: string;
};

type PhotonFeature = {
	geometry: { coordinates: [number, number] };
	properties: {
		name?: string;
		street?: string;
		city?: string;
		state?: string;
		country?: string;
		countrycode?: string;
	};
};

/** Fallback near first stay neighbourhood if geocoding fails entirely. */
const SHINJUKU_FALLBACK = {
	latitude: 35.708,
	longitude: 139.725,
	label: 'Shinjuku, Tokyo, Japan',
	city: 'Shinjuku'
};

/** Normalize place names for loose matching (Kōbe → kobe, drop punctuation). */
function normalizePlace(value: string): string {
	return value
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '');
}

/**
 * True when a Photon hit looks like it belongs to the itinerary city.
 * Avoids e.g. "Toyoko Inn Tokushima …" resolving to Toyoko Inn Tokyo.
 */
function featureMatchesCity(feature: PhotonFeature, city: string): boolean {
	const wantedParts = city
		.split(/[/|,]/)
		.map((part) => normalizePlace(part))
		.filter((part) => part.length >= 3);

	if (wantedParts.length === 0) return true;

	const props = feature.properties;
	const haystacks = [props.city, props.state, props.name, props.street]
		.filter((part): part is string => Boolean(part))
		.map(normalizePlace);

	return wantedParts.some((part) =>
		haystacks.some((hay) => hay === part || hay.includes(part))
	);
}

async function geocodeQuery(
	query: string,
	expectedCity?: string
): Promise<{ lat: number; lon: number } | null> {
	const url = new URL('https://photon.komoot.io/api/');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', '5');
	url.searchParams.set('lang', 'en');

	const res = await fetch(url);
	if (!res.ok) return null;

	const data = (await res.json()) as { features?: PhotonFeature[] };
	const features = data.features ?? [];
	const inJapan = features.filter((f) => f.properties.countrycode?.toUpperCase() === 'JP');
	const pool = inJapan.length > 0 ? inJapan : features;

	const feature = expectedCity
		? (pool.find((f) => featureMatchesCity(f, expectedCity)) ?? null)
		: (pool[0] ?? null);
	if (!feature) return null;

	const [lon, lat] = feature.geometry.coordinates;
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	return { lat, lon };
}

export async function geocodeAccommodation(
	item: TravelItem
): Promise<{ lat: number; lon: number } | null> {
	const city = cityFromItem(item);
	for (const query of accommodationGeocodeQueries(item)) {
		const result = await geocodeQuery(query, city || undefined);
		if (result) return result;
	}
	return null;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherCurrent> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(lat));
	url.searchParams.set('longitude', String(lon));
	url.searchParams.set(
		'current',
		'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
	);
	url.searchParams.set('timezone', 'Asia/Tokyo');

	const res = await fetch(url);
	if (!res.ok) throw new Error('Weather request failed');

	const data = (await res.json()) as {
		current: {
			temperature_2m: number;
			relative_humidity_2m: number;
			weather_code: number;
			wind_speed_10m: number;
		};
	};

	const code = data.current.weather_code;
	return {
		temperature: data.current.temperature_2m,
		humidity: data.current.relative_humidity_2m,
		windSpeed: data.current.wind_speed_10m,
		weatherCode: code,
		label: weatherLabel(code),
		icon: weatherIconKind(code)
	};
}

function locationLabel(item: TravelItem): string {
	const { displayName, location } = splitNameAndLocation(item.name);
	if (item.address) return `${displayName} · ${item.address}`;
	if (location) return `${displayName}, ${location}`;
	return displayName;
}

/**
 * Current accommodation location + metadata.
 * Pin is at the stay (address geocode), not the city centroid.
 */
export async function resolveCurrentAccommodationLocation(
	at: Date = new Date()
): Promise<LocationInfo> {
	const item = getCurrentAccommodation(at);
	if (!item) {
		throw new Error('No accommodations on the itinerary');
	}

	const city = cityFromItem(item) || 'Japan';
	const accommodationName = displayNameFromItem(item);
	const coords = await geocodeAccommodation(item);

	return {
		latitude: coords?.lat ?? SHINJUKU_FALLBACK.latitude,
		longitude: coords?.lon ?? SHINJUKU_FALLBACK.longitude,
		label: locationLabel(item),
		city,
		accommodationName,
		address: item.address,
		start: item.start,
		end: item.end,
		accommodationId: item.id
	};
}
