import { splitNameAndLocation, travelItems, type TravelItem } from '$lib/data';

const JAPAN_TZ = 'Asia/Tokyo';

/** Calendar day key (YYYY-MM-DD) in Japan for a Date, or for a naive itinerary timestamp. */
function japanDayKey(value: Date | string): string {
	if (typeof value === 'string') {
		// Itinerary values are Japan-local without an offset (e.g. 2026-08-12T16:00).
		return value.slice(0, 10);
	}

	return value.toLocaleDateString('en-CA', { timeZone: JAPAN_TZ });
}

function accommodations(): TravelItem[] {
	return travelItems.items
		.filter((item) => item.kind === 'accommodation')
		.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function cityFromItem(item: TravelItem): string {
	return splitNameAndLocation(item.name).location.trim();
}

export function displayNameFromItem(item: TravelItem): string {
	return splitNameAndLocation(item.name).displayName;
}

/**
 * Current accommodation for a given instant.
 * Active stay that Japan calendar day; before the trip → first; after → last.
 */
export function getCurrentAccommodation(at: Date = new Date()): TravelItem | null {
	const stays = accommodations();
	if (!stays.length) return null;

	const day = japanDayKey(at);

	const active = stays.find((item) => {
		const start = japanDayKey(item.start);
		const end = japanDayKey(item.end);
		return day >= start && day <= end;
	});

	if (active) return active;

	if (day < japanDayKey(stays[0].start)) {
		return stays[0];
	}

	return stays[stays.length - 1];
}

/**
 * Accommodations and travel covering the Japan calendar day for `at`.
 * Inclusive of checkout / arrival days.
 */
export function getTravelItemsForDay(at: Date = new Date()): TravelItem[] {
	const day = japanDayKey(at);

	return travelItems.items
		.filter((item) => {
			const start = japanDayKey(item.start);
			const end = japanDayKey(item.end);
			return day >= start && day <= end;
		})
		.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Search queries to geocode an accommodation to a point on the map. */
export function accommodationGeocodeQueries(item: TravelItem): string[] {
	const city = cityFromItem(item);
	const displayName = displayNameFromItem(item);
	const queries: string[] = [];
	const push = (q: string) => {
		const trimmed = q.trim();
		if (trimmed && !queries.includes(trimmed)) queries.push(trimmed);
	};

	if (item.address) {
		const address = item.address;
		const postcode = address.match(/\b\d{3}-\d{4}\b/);
		if (postcode) {
			push(`${postcode[0]} Japan`);
		}

		// Neighbourhood-oriented query (drop house numbers that confuse geocoders).
		const withoutNumber = address.replace(/^\s*[\d-–]+\s*/, '').trim();
		if (withoutNumber) {
			push(withoutNumber);
		}

		push(address);
	}

	if (displayName && city) {
		push(`${displayName}, ${city}, Japan`);
	} else if (displayName) {
		push(`${displayName}, Japan`);
	}

	if (city) {
		push(`${city}, Japan`);
		push(city);
	}

	return queries;
}
