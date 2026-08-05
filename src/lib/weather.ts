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

export type WeatherCurrent = {
	temperature: number;
	humidity: number;
	windSpeed: number;
	weatherCode: number;
	label: string;
};

export type LocationInfo = {
	latitude: number;
	longitude: number;
	label: string;
	timezone: string;
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
const SHINJUKU_FALLBACK: Omit<
	LocationInfo,
	'accommodationName' | 'start' | 'end' | 'accommodationId' | 'address'
> = {
	latitude: 35.708,
	longitude: 139.725,
	label: 'Shinjuku, Tokyo, Japan',
	timezone: 'Asia/Tokyo',
	city: 'Shinjuku'
};

async function geocodeQuery(query: string): Promise<{ lat: number; lon: number } | null> {
	const url = new URL('https://photon.komoot.io/api/');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', '3');
	url.searchParams.set('lang', 'en');

	const res = await fetch(url);
	if (!res.ok) return null;

	const data = (await res.json()) as { features?: PhotonFeature[] };
	const features = data.features ?? [];
	const feature =
		features.find((f) => f.properties.countrycode?.toUpperCase() === 'JP') ?? features[0];
	if (!feature) return null;

	const [lon, lat] = feature.geometry.coordinates;
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	return { lat, lon };
}

export async function geocodeAccommodation(
	item: TravelItem
): Promise<{ lat: number; lon: number } | null> {
	for (const query of accommodationGeocodeQueries(item)) {
		const result = await geocodeQuery(query);
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
	url.searchParams.set('timezone', 'auto');

	const res = await fetch(url);
	if (!res.ok) throw new Error('Weather request failed');

	const data = (await res.json()) as {
		timezone?: string;
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
		label: weatherLabel(code)
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
		timezone: 'Asia/Tokyo',
		city,
		accommodationName,
		address: item.address,
		start: item.start,
		end: item.end,
		accommodationId: item.id
	};
}
