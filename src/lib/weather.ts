import { getCurrentTripCity } from '$lib/trip-location';

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
};

type GeocodeResult = {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
	country_code?: string;
	admin1?: string;
	country?: string;
	timezone?: string;
};

/** Overrides for itinerary labels that the geocoder mishandles. */
const CITY_GEOCODE_ALIASES: Record<string, string> = {
	'minami aso': 'Aso, Kumamoto',
	nachikatsuura: 'Katsuura, Wakayama',
	'sumida city / tokyo': 'Sumida, Tokyo'
};

/** Hardcoded city-center fallback (Shinjuku district center — not the stay address). */
const SHINJUKU_CENTER: LocationInfo = {
	latitude: 35.69115,
	longitude: 139.70854,
	label: 'Shinjuku, Tokyo, Japan',
	timezone: 'Asia/Tokyo',
	city: 'Shinjuku'
};

function formatCityLabel(result: GeocodeResult, fallbackCity: string): string {
	const parts = [result.name || fallbackCity, result.admin1, result.country].filter(Boolean);
	return parts.join(', ');
}

function geocodeQueriesForCity(city: string): string[] {
	const alias = CITY_GEOCODE_ALIASES[city.trim().toLowerCase()];
	const base = alias ?? city.trim();
	const parts = base
		.split('/')
		.map((part) => part.trim())
		.filter(Boolean);

	const queries: string[] = [];
	const push = (q: string) => {
		if (q && !queries.includes(q)) queries.push(q);
	};

	push(`${base}, Japan`);
	push(base);
	for (const part of parts) {
		push(`${part}, Japan`);
		push(part);
	}

	return queries;
}

async function searchGeocode(name: string): Promise<GeocodeResult | null> {
	const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
	url.searchParams.set('name', name);
	url.searchParams.set('count', '5');
	url.searchParams.set('language', 'en');
	url.searchParams.set('format', 'json');

	const res = await fetch(url);
	if (!res.ok) throw new Error('Geocoding request failed');

	const data = (await res.json()) as { results?: GeocodeResult[] };
	const results = data.results ?? [];
	if (!results.length) return null;

	return results.find((r) => r.country_code === 'JP') ?? results[0];
}

/** Resolve a city name to its geographic center (never a street address). */
export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
	for (const query of geocodeQueriesForCity(city)) {
		const result = await searchGeocode(query);
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

/**
 * Current trip city, pinned at the city center from Open-Meteo geocoding.
 * Uses the itinerary city name only — never accommodation street addresses.
 */
export async function resolveCurrentCityLocation(at: Date = new Date()): Promise<LocationInfo> {
	const tripCity = getCurrentTripCity(at);
	const city = tripCity?.city ?? 'Shinjuku';

	const result = await geocodeCity(city);
	if (!result) {
		if (city === 'Shinjuku') return { ...SHINJUKU_CENTER };
		throw new Error(`Could not geocode city: ${city}`);
	}

	return {
		latitude: result.latitude,
		longitude: result.longitude,
		label: formatCityLabel(result, city),
		timezone: result.timezone || 'Asia/Tokyo',
		city
	};
}
