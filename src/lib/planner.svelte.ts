import type { Accommodation, Activity, Car, PlannerData } from '$lib/types';
import { generateId } from '$lib/utils/dates';
import {
	buildCalendarLayout,
	buildGapRanges,
	buildTransitionDays,
	getActivitiesBetweenStays,
	getActivitiesForAccommodation,
	migratePlannerData
} from '$lib/utils/timeline';

const STORAGE_KEY = 'reiseplaner-data';
const STORAGE_VERSION_KEY = 'reiseplaner-data-version';
const STORAGE_VERSION = 5;

export function createDemoData(): PlannerData {
	const hotelA = generateId();
	const hotelB = generateId();
	const hotelC = generateId();

	return {
		accommodations: [
			{
				id: hotelA,
				name: 'Hotel Alpenblick',
				checkIn: '2026-09-10',
				checkOut: '2026-09-12'
			},
			{
				id: hotelB,
				name: 'Seehotel am See',
				checkIn: '2026-09-12',
				checkOut: '2026-09-14'
			},
			{
				id: hotelC,
				name: 'Berghütte',
				checkIn: '2026-09-17',
				checkOut: '2026-09-19'
			}
		],
		cars: [
			{
				id: generateId(),
				name: 'Rental car',
				pickup: '2026-09-10',
				dropoff: '2026-09-17'
			}
		],
		activities: [
			{ id: generateId(), name: 'Old town walking tour', accommodationId: hotelA, date: '2026-09-11' },
			{
				id: generateId(),
				name: 'Train to lakeside',
				betweenStays: { afterAccommodationId: hotelA, beforeAccommodationId: hotelB },
				date: '2026-09-12'
			},
			{ id: generateId(), name: 'Cable car ride', accommodationId: hotelB, date: '2026-09-13' },
			{
				id: generateId(),
				name: 'Drop bags at new hotel',
				accommodationId: hotelB,
				date: '2026-09-12'
			},
			{
				id: generateId(),
				name: 'Hike to trailhead',
				betweenStays: { afterAccommodationId: hotelB, beforeAccommodationId: hotelC },
				date: '2026-09-15'
			},
			{ id: generateId(), name: 'Buy souvenirs', accommodationId: hotelC }
		]
	};
}

function loadFromStorage(): PlannerData | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const version = localStorage.getItem(STORAGE_VERSION_KEY);
		if (version !== String(STORAGE_VERSION)) {
			localStorage.removeItem(STORAGE_KEY);
			localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
			return null;
		}
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return migratePlannerData(JSON.parse(raw));
	} catch {
		return null;
	}
}

function saveToStorage(data: PlannerData) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
}

export class PlannerStore {
	data = $state<PlannerData>({ accommodations: [], cars: [], activities: [] });

	calendarLayout = $derived(
		buildCalendarLayout(this.data.accommodations, this.data.cars)
	);
	gapRanges = $derived(buildGapRanges(this.data.accommodations, this.calendarLayout));
	transitionDays = $derived(buildTransitionDays(this.data.accommodations, this.calendarLayout));
	totalRows = $derived(this.calendarLayout.totalRows);

	constructor() {
		const stored = loadFromStorage();
		this.data = stored ?? createDemoData();
		if (!stored) saveToStorage(this.data);
	}

	private persist() {
		saveToStorage(this.data);
	}

	activitiesForAccommodation(accommodationId: string) {
		return getActivitiesForAccommodation(
			this.data.activities,
			accommodationId,
			this.data.accommodations
		);
	}

	activitiesBetweenStays(afterAccommodationId: string, beforeAccommodationId: string) {
		return getActivitiesBetweenStays(
			this.data.activities,
			afterAccommodationId,
			beforeAccommodationId,
			this.data.accommodations
		);
	}

	addAccommodation(entry: Omit<Accommodation, 'id'>) {
		this.data.accommodations = [...this.data.accommodations, { ...entry, id: generateId() }];
		this.persist();
	}

	updateAccommodation(id: string, entry: Omit<Accommodation, 'id'>) {
		this.data.accommodations = this.data.accommodations.map((a) =>
			a.id === id ? { ...entry, id } : a
		);
		this.persist();
	}

	removeAccommodation(id: string) {
		this.data.accommodations = this.data.accommodations.filter((a) => a.id !== id);
		this.data.activities = this.data.activities.filter(
			(a) =>
				a.accommodationId !== id &&
				a.betweenStays?.afterAccommodationId !== id &&
				a.betweenStays?.beforeAccommodationId !== id
		);
		this.persist();
	}

	addCar(entry: Omit<Car, 'id'>) {
		this.data.cars = [...this.data.cars, { ...entry, id: generateId() }];
		this.persist();
	}

	updateCar(id: string, entry: Omit<Car, 'id'>) {
		this.data.cars = this.data.cars.map((c) => (c.id === id ? { ...entry, id } : c));
		this.persist();
	}

	removeCar(id: string) {
		this.data.cars = this.data.cars.filter((c) => c.id !== id);
		this.persist();
	}

	addActivity(entry: Omit<Activity, 'id'>) {
		this.data.activities = [...this.data.activities, { ...entry, id: generateId() }];
		this.persist();
	}

	addBetweenActivity(
		afterAccommodationId: string,
		beforeAccommodationId: string,
		entry: { name: string; date?: string }
	) {
		this.addActivity({
			name: entry.name,
			date: entry.date,
			betweenStays: { afterAccommodationId, beforeAccommodationId }
		});
	}

	updateActivity(id: string, entry: Omit<Activity, 'id'>) {
		this.data.activities = this.data.activities.map((a) => (a.id === id ? { ...entry, id } : a));
		this.persist();
	}

	removeActivity(id: string) {
		this.data.activities = this.data.activities.filter((a) => a.id !== id);
		this.persist();
	}
}
