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
};

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

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
	const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
	url.searchParams.set('latitude', String(lat));
	url.searchParams.set('longitude', String(lon));
	url.searchParams.set('localityLanguage', 'en');

	const res = await fetch(url);
	if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

	const data = (await res.json()) as {
		city?: string;
		locality?: string;
		principalSubdivision?: string;
		countryName?: string;
	};

	const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(
		Boolean
	);

	return parts.length ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/** Default fallback: Shinjuku — first stop on the itinerary. */
export const FALLBACK_LOCATION: LocationInfo = {
	latitude: 35.6938,
	longitude: 139.7034,
	label: 'Shinjuku, Tokyo, Japan',
	timezone: 'Asia/Tokyo'
};
