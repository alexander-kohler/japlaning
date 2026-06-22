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
const STORAGE_VERSION = 6;

export function createDemoData(): PlannerData {
	return {
		accommodations: [
			{
				id: generateId(),
				name: 'ibis Styles Kyoto Shijo, Kyōto',
				checkIn: '2026-08-26',
				checkOut: '2026-09-01'
			},
			{
				id: generateId(),
				name: 'Comfort Hotel Kii Tanabe, Tanabe',
				checkIn: '2026-09-01',
				checkOut: '2026-09-02'
			},
			{
				id: generateId(),
				name: 'ゲストハウス八咫, Tanabe',
				checkIn: '2026-09-02',
				checkOut: '2026-09-03'
			},
			{
				id: generateId(),
				name: 'Cottage Kirihata, Tanabe',
				checkIn: '2026-09-03',
				checkOut: '2026-09-04'
			},
			{
				id: generateId(),
				name: 'ikkyu rental vacation house, Kobune',
				checkIn: '2026-09-04',
				checkOut: '2026-09-05'
			},
			{
				id: generateId(),
				name: '那智の里 Accommodation along the Kumano Kodo trail, Nachikatsuura',
				checkIn: '2026-09-05',
				checkOut: '2026-09-06'
			},
			{
				id: generateId(),
				name: 'Grand Residence Hotel Tenjin, Fukuoka (€98)',
				checkIn: '2026-09-11',
				checkOut: '2026-09-12'
			},
			{
				id: generateId(),
				name: 'Simple Stay Beppu, Beppu (€110)',
				checkIn: '2026-09-12',
				checkOut: '2026-09-14'
			},
			{
				id: generateId(),
				name: '阿蘇山麓のヴィラShijin南阿蘇, Minami Aso (€227)',
				checkIn: '2026-09-14',
				checkOut: '2026-09-16'
			},
			{
				id: generateId(),
				name: 'fav KUMAMOTO, Kumamoto (€83)',
				checkIn: '2026-09-16',
				checkOut: '2026-09-17'
			},
			{
				id: generateId(),
				name: 'Zee Haven nagasakiekimae – ZEE HAVEN長崎駅前, Nagasaki (€131)',
				checkIn: '2026-09-17',
				checkOut: '2026-09-19'
			},
			{
				id: generateId(),
				name: 'ロータスヴィレッジ, Fukuoka (€249)',
				checkIn: '2026-09-19',
				checkOut: '2026-09-21'
			},
			{
				id: generateId(),
				name: 'b hotel Heiwaodori 601, Hiroshima (€375)',
				checkIn: '2026-09-21',
				checkOut: '2026-09-24'
			},
			{
				id: generateId(),
				name: 'GRAND BASE Kurashiki Chuo, Kurashiki (€132)',
				checkIn: '2026-09-24',
				checkOut: '2026-09-26'
			},
			{
				id: generateId(),
				name: 'WAYFARER Matsu, Osaka (€315)',
				checkIn: '2026-09-26',
				checkOut: '2026-10-01'
			},
			{
				id: generateId(),
				name: 'Hotel Gee Haive, Mishima (€100)',
				checkIn: '2026-10-01',
				checkOut: '2026-10-02'
			},
			{
				id: generateId(),
				name: '一棟貸しVilla OMODAKA, Oguchi (€208)',
				checkIn: '2026-10-02',
				checkOut: '2026-10-04'
			},
			{
				id: generateId(),
				name: 'THE VIEW Odawara shiro-no mieru hotel – Vacation STAY 53335v, Odawara (€126)',
				checkIn: '2026-10-04',
				checkOut: '2026-10-05'
			},
			{
				id: generateId(),
				name: 'Airbnb SkytreeHouse 東向島, Sumida City / Tokyo',
				checkIn: '2026-10-05',
				checkOut: '2026-10-11'
			}
		],
		cars: [
			{
				id: generateId(),
				name: 'Honda N-Box or similar, Nico Nico Rentacar, Fukuoka (€321.94)',
				pickup: '2026-09-12',
				dropoff: '2026-09-19'
			},
			{
				id: generateId(),
				name: 'Daihatsu Move or similar, Orix, Oshima (€153.05)',
				pickup: '2026-10-02',
				dropoff: '2026-10-04'
			}
		],
		activities: []
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
