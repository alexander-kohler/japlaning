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

/**
 * Itinerary timestamps are Japan-local wall times without an offset.
 * Japan has no DST, so +09:00 is always correct.
 */
function parseJapanLocalMs(isoLocal: string): number {
	const base = isoLocal.length >= 19 ? isoLocal.slice(0, 19) : `${isoLocal.slice(0, 16)}:00`;
	return new Date(`${base}+09:00`).getTime();
}

export type NextUpKind =
	| 'check-in'
	| 'check-out'
	| 'flight'
	| 'ferry'
	| 'activity'
	| 'car-pickup'
	| 'car-return';

export type NextUpEvent = {
	id: string;
	kind: NextUpKind;
	title: string;
	subtitle: string;
	at: string;
	atMs: number;
	/** Accommodation id when the event links to a stay page. */
	accommodationId?: string;
};

export function nextUpKindLabel(kind: NextUpKind): string {
	if (kind === 'check-in') return 'Check-in';
	if (kind === 'check-out') return 'Check-out';
	if (kind === 'flight') return 'Flight';
	if (kind === 'ferry') return 'Ferry';
	if (kind === 'activity') return 'Activity';
	if (kind === 'car-pickup') return 'Car pickup';
	return 'Car return';
}

/**
 * Soonest upcoming itinerary event after `at` (Japan-local schedule).
 * Considers check-in/out, flights, ferries, timed activities, and car rentals.
 */
export function getNextUp(at: Date = new Date()): NextUpEvent | null {
	const nowMs = at.getTime();
	const candidates: NextUpEvent[] = [];

	const consider = (
		id: string,
		kind: NextUpKind,
		title: string,
		subtitle: string,
		atLocal: string,
		accommodationId?: string
	) => {
		const atMs = parseJapanLocalMs(atLocal);
		if (Number.isNaN(atMs) || atMs <= nowMs) return;
		candidates.push({ id, kind, title, subtitle, at: atLocal, atMs, accommodationId });
	};

	for (const item of travelItems.items) {
		const { displayName, location: place } = splitNameAndLocation(item.name);

		if (item.kind === 'accommodation') {
			consider(
				`${item.id}:check-in`,
				'check-in',
				displayName,
				place,
				item.start,
				item.id
			);
			consider(
				`${item.id}:check-out`,
				'check-out',
				displayName,
				place,
				item.end,
				item.id
			);

			for (const activity of item.activities ?? []) {
				if (!activity.start) continue;
				consider(
					`${item.id}:${activity.id}`,
					'activity',
					activity.name,
					place ? `${displayName} · ${place}` : displayName,
					activity.start,
					item.id
				);
			}
		} else if (item.kind === 'plane' || item.kind === 'ferry') {
			consider(
				`${item.id}:depart`,
				item.kind === 'plane' ? 'flight' : 'ferry',
				displayName,
				place,
				item.start
			);
		}
	}

	for (const car of travelItems.cars) {
		consider(`${car.id}:pickup`, 'car-pickup', car.name, '', car.start);
		consider(`${car.id}:return`, 'car-return', car.name, '', car.end);
	}

	if (candidates.length === 0) return null;

	candidates.sort((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));
	return candidates[0];
}

/** Relative countdown from `at` to a next-up event, in Japan-aware wording. */
export function formatNextUpCountdown(at: Date, event: NextUpEvent): string {
	const deltaMs = event.atMs - at.getTime();
	if (deltaMs <= 0) return 'now';

	const totalMinutes = Math.round(deltaMs / 60_000);
	if (totalMinutes < 1) return 'now';
	if (totalMinutes < 60) return `in ${totalMinutes}m`;

	const totalHours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (totalHours < 24) {
		return minutes > 0 ? `in ${totalHours}h ${minutes}m` : `in ${totalHours}h`;
	}

	const days = Math.floor(totalHours / 24);
	const hours = totalHours % 24;
	if (days < 7) {
		return hours > 0 ? `in ${days}d ${hours}h` : `in ${days}d`;
	}

	return `in ${days}d`;
}

/** Absolute Japan-local time label for a next-up event. */
export function formatNextUpWhen(event: NextUpEvent, at: Date = new Date()): string {
	const eventDate = new Date(event.atMs);
	const eventDay = japanDayKey(event.at);
	const today = japanDayKey(at);
	const tomorrow = japanDayKey(new Date(parseJapanLocalMs(`${today}T12:00`) + 24 * 60 * 60 * 1000));

	const time = eventDate.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: JAPAN_TZ
	});

	if (eventDay === today) return `Today ${time}`;
	if (eventDay === tomorrow) return `Tomorrow ${time}`;

	const day = eventDate.toLocaleDateString('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: JAPAN_TZ
	});
	return `${day} ${time}`;
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
