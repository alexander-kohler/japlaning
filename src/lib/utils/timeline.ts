import type {
	Accommodation,
	Activity,
	CalendarDay,
	CalendarLayout,
	AccommodationGridSpan,
	GapRange,
	PlannerData,
	TransitionDay
} from '$lib/types';
import { compareDates, daysBetween } from './dates';

export function buildCalendarLayout(accommodations: Accommodation[]): CalendarLayout {
	const sorted = [...accommodations].sort((a, b) => compareDates(a.checkIn, b.checkIn));
	if (sorted.length === 0) {
		return { days: [], totalRows: 0 };
	}

	const calendarStart = sorted[0].checkIn;
	const calendarEnd = sorted[sorted.length - 1].checkOut;
	const dates = daysBetween(calendarStart, calendarEnd);

	const days: CalendarDay[] = dates.map((date, index) => ({
		date,
		gridRowTop: index * 2 + 1,
		gridRowBottom: index * 2 + 2
	}));

	return { days, totalRows: dates.length * 2 };
}

export function dayForDate(layout: CalendarLayout, date: string): CalendarDay | undefined {
	return layout.days.find((d) => d.date === date);
}

export function accommodationGridSpan(
	accommodation: Accommodation,
	layout: CalendarLayout
): AccommodationGridSpan | null {
	const checkInDay = dayForDate(layout, accommodation.checkIn);
	const checkOutDay = dayForDate(layout, accommodation.checkOut);
	if (!checkInDay || !checkOutDay) return null;

	return {
		startRow: checkInDay.gridRowBottom,
		rowSpan: checkOutDay.gridRowTop - checkInDay.gridRowBottom + 1
	};
}

export function buildGapRanges(
	accommodations: Accommodation[],
	layout: CalendarLayout
): GapRange[] {
	const sorted = [...accommodations].sort((a, b) => compareDates(a.checkIn, b.checkIn));
	const gaps: GapRange[] = [];

	for (let i = 0; i < sorted.length - 1; i++) {
		const prev = sorted[i];
		const next = sorted[i + 1];

		if (prev.checkOut >= next.checkIn) continue;

		const startDate = prev.checkOut;
		const endDate = next.checkIn;
		const startDay = dayForDate(layout, startDate);
		const endDay = dayForDate(layout, endDate);
		if (!startDay || !endDay) continue;

		gaps.push({
			startDate,
			endDate,
			afterAccommodationId: prev.id,
			beforeAccommodationId: next.id,
			startRow: startDay.gridRowBottom,
			rowSpan: endDay.gridRowTop - startDay.gridRowBottom + 1
		});
	}

	return gaps;
}

export function buildTransitionDays(
	accommodations: Accommodation[],
	layout: CalendarLayout
): TransitionDay[] {
	const sorted = [...accommodations].sort((a, b) => compareDates(a.checkIn, b.checkIn));
	const transitions: TransitionDay[] = [];

	for (let i = 0; i < sorted.length - 1; i++) {
		const prev = sorted[i];
		const next = sorted[i + 1];
		if (prev.checkOut !== next.checkIn) continue;

		const day = dayForDate(layout, prev.checkOut);
		if (!day) continue;

		transitions.push({
			date: prev.checkOut,
			fromAccommodationId: prev.id,
			toAccommodationId: next.id,
			gridRowTop: day.gridRowTop,
			gridRowBottom: day.gridRowBottom
		});
	}

	return transitions;
}

export function activityFallsInBetweenSegment(
	activity: Activity,
	afterAccommodationId: string,
	beforeAccommodationId: string,
	accommodations: Accommodation[]
): boolean {
	if (activity.betweenStays) {
		return (
			activity.betweenStays.afterAccommodationId === afterAccommodationId &&
			activity.betweenStays.beforeAccommodationId === beforeAccommodationId
		);
	}

	if (!activity.date) return false;

	const sorted = [...accommodations].sort((a, b) => compareDates(a.checkIn, b.checkIn));
	const afterIdx = sorted.findIndex((a) => a.id === afterAccommodationId);
	const beforeIdx = sorted.findIndex((a) => a.id === beforeAccommodationId);
	if (afterIdx === -1 || beforeIdx !== afterIdx + 1) return false;

	const after = sorted[afterIdx];
	const before = sorted[beforeIdx];

	if (after.checkOut === before.checkIn) {
		return activity.date === after.checkOut;
	}

	if (after.checkOut < before.checkIn) {
		return activity.date >= after.checkOut && activity.date <= before.checkIn;
	}

	return false;
}

export function getActivitiesForAccommodation(
	activities: Activity[],
	accommodationId: string,
	accommodations: Accommodation[]
): Activity[] {
	const sorted = [...accommodations].sort((a, b) => compareDates(a.checkIn, b.checkIn));
	const idx = sorted.findIndex((a) => a.id === accommodationId);

	return activities.filter((activity) => {
		if (activity.accommodationId !== accommodationId) return false;
		if (!activity.date || idx === -1) return true;

		const prev = sorted[idx - 1];
		const next = sorted[idx + 1];

		if (prev && activityFallsInBetweenSegment(activity, prev.id, accommodationId, accommodations)) {
			return false;
		}
		if (next && activityFallsInBetweenSegment(activity, accommodationId, next.id, accommodations)) {
			return false;
		}

		return true;
	});
}

export function getActivitiesBetweenStays(
	activities: Activity[],
	afterAccommodationId: string,
	beforeAccommodationId: string,
	accommodations: Accommodation[]
): Activity[] {
	return activities.filter((activity) =>
		activityFallsInBetweenSegment(
			activity,
			afterAccommodationId,
			beforeAccommodationId,
			accommodations
		)
	);
}

export function findAccommodationForDate(
	accommodations: Accommodation[],
	date: string
): Accommodation | undefined {
	return accommodations.find((acc) => date >= acc.checkIn && date <= acc.checkOut);
}

export type DayActivityEntry = {
	activity: Activity;
	tone: 'stay' | 'transit' | 'gap';
};

export type DayAddContext =
	| { kind: 'stay'; accommodationId: string }
	| { kind: 'between'; afterId: string; beforeId: string; min: string; max: string };

export function getActivitiesForCalendarDay(
	date: string,
	activities: Activity[],
	accommodations: Accommodation[],
	gaps: GapRange[],
	transitions: TransitionDay[]
): DayActivityEntry[] {
	const entries: DayActivityEntry[] = [];

	const transition = transitions.find((t) => t.date === date);
	if (transition) {
		for (const activity of getActivitiesBetweenStays(
			activities,
			transition.fromAccommodationId,
			transition.toAccommodationId,
			accommodations
		)) {
			if (!activity.date || activity.date === date) {
				entries.push({ activity, tone: 'transit' });
			}
		}
		return entries;
	}

	const gap = gaps.find((g) => date >= g.startDate && date <= g.endDate);
	if (gap) {
		for (const activity of getActivitiesBetweenStays(
			activities,
			gap.afterAccommodationId,
			gap.beforeAccommodationId,
			accommodations
		)) {
			if (!activity.date || activity.date === date) {
				entries.push({ activity, tone: 'gap' });
			}
		}
	}

	const stayAcc = findAccommodationForDate(accommodations, date);
	if (stayAcc && (!gap || date === gap.endDate)) {
		for (const activity of getActivitiesForAccommodation(
			activities,
			stayAcc.id,
			accommodations
		)) {
			if (activity.date && activity.date !== date) continue;
			if (!activity.date && date !== stayAcc.checkIn) continue;
			entries.push({ activity, tone: 'stay' });
		}
	}

	return entries;
}

export function getAddContextForCalendarDay(
	date: string,
	accommodations: Accommodation[],
	gaps: GapRange[],
	transitions: TransitionDay[]
): DayAddContext | null {
	const transition = transitions.find((t) => t.date === date);
	if (transition) {
		return {
			kind: 'between',
			afterId: transition.fromAccommodationId,
			beforeId: transition.toAccommodationId,
			min: date,
			max: date
		};
	}

	const gap = gaps.find((g) => date >= g.startDate && date <= g.endDate);
	const stayAcc = findAccommodationForDate(accommodations, date);

	if (gap && stayAcc && date === gap.endDate && stayAcc.checkIn === date) {
		return { kind: 'stay', accommodationId: stayAcc.id };
	}

	if (gap) {
		return {
			kind: 'between',
			afterId: gap.afterAccommodationId,
			beforeId: gap.beforeAccommodationId,
			min: gap.startDate,
			max: gap.endDate
		};
	}

	const stayAccOnly = findAccommodationForDate(accommodations, date);
	if (stayAccOnly) {
		return { kind: 'stay', accommodationId: stayAccOnly.id };
	}

	return null;
}

export function migratePlannerData(raw: unknown): PlannerData {
	const data = raw as Record<string, unknown>;

	if (data && Array.isArray(data.accommodations) && Array.isArray(data.activities)) {
		const accommodations = data.accommodations as Accommodation[];
		const activities = data.activities as Activity[];

		if (activities.every((a) => a.accommodationId || a.betweenStays)) {
			return { accommodations, activities };
		}
	}

	const legacy = data as {
		accommodations?: Accommodation[];
		activities?: { id: string; name: string; date?: string; accommodationId?: string }[];
	};

	const accommodations = legacy.accommodations ?? [];
	const activities: Activity[] = (legacy.activities ?? []).map((activity) => {
		if (activity.accommodationId) {
			return {
				id: activity.id,
				name: activity.name,
				accommodationId: activity.accommodationId,
				date: activity.date
			};
		}

		const accommodationId =
			(activity.date && findAccommodationForDate(accommodations, activity.date)?.id) ||
			accommodations[0]?.id ||
			'';

		return {
			id: activity.id,
			name: activity.name,
			accommodationId,
			date: activity.date
		};
	});

	return { accommodations, activities };
}
