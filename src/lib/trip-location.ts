import { splitNameAndLocation, travelItems, type TravelItem } from '$lib/data';

export type TripCity = {
	city: string;
	searchQuery: string;
	item: TravelItem;
};

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

/** City name from an accommodation title (never the street address). */
export function cityFromItem(item: TravelItem): string | null {
	const { location } = splitNameAndLocation(item.name);
	const city = location.trim();
	return city || null;
}

/**
 * Current trip city for a given instant.
 * Uses the active stay that day; before the trip → first city; after → last city.
 */
export function getCurrentTripCity(at: Date = new Date()): TripCity | null {
	const stays = accommodations();
	if (!stays.length) return null;

	const day = toStartOfDay(at.getTime());

	const active = stays.find((item) => {
		const start = toStartOfDay(new Date(item.start).getTime());
		const end = toStartOfDay(new Date(item.end).getTime());
		return day >= start && day <= end;
	});

	const chosen =
		active ??
		(day < toStartOfDay(new Date(stays[0].start).getTime()) ? stays[0] : stays[stays.length - 1]);

	const city = cityFromItem(chosen);
	if (!city) return null;

	return {
		city,
		searchQuery: `${city}, Japan`,
		item: chosen
	};
}
