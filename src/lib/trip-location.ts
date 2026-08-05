import { splitNameAndLocation, travelItems, type TravelItem } from '$lib/data';

function toStartOfDay(ms: number): number {
	const date = new Date(ms);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
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
 * Active stay that day; before the trip → first; after → last.
 */
export function getCurrentAccommodation(at: Date = new Date()): TravelItem | null {
	const stays = accommodations();
	if (!stays.length) return null;

	const day = toStartOfDay(at.getTime());

	const active = stays.find((item) => {
		const start = toStartOfDay(new Date(item.start).getTime());
		const end = toStartOfDay(new Date(item.end).getTime());
		return day >= start && day <= end;
	});

	if (active) return active;

	if (day < toStartOfDay(new Date(stays[0].start).getTime())) {
		return stays[0];
	}

	return stays[stays.length - 1];
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
