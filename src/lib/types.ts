export type Accommodation = {
	id: string;
	name: string;
	checkIn: string;
	checkOut: string;
};

export type Activity = {
	id: string;
	name: string;
	date?: string;
	accommodationId?: string;
	betweenStays?: {
		afterAccommodationId: string;
		beforeAccommodationId: string;
	};
};

export type PlannerData = {
	accommodations: Accommodation[];
	activities: Activity[];
};

/** One calendar day mapped to two half-day grid rows (check-in/out at midday). */
export type CalendarDay = {
	date: string;
	gridRowTop: number;
	gridRowBottom: number;
};

export type CalendarLayout = {
	days: CalendarDay[];
	totalRows: number;
};

export type AccommodationGridSpan = {
	startRow: number;
	rowSpan: number;
};

export type GapRange = {
	startDate: string;
	endDate: string;
	afterAccommodationId: string;
	beforeAccommodationId: string;
	startRow: number;
	rowSpan: number;
};

export type TransitionDay = {
	date: string;
	fromAccommodationId: string;
	toAccommodationId: string;
	gridRowTop: number;
	gridRowBottom: number;
};

/** @deprecated Legacy segment model */
export type AccommodationBlock = {
	accommodation: Accommodation;
	startRow: number;
	rowSpan: number;
};

/** @deprecated Legacy segment model */
export type TimelineSegment =
	| {
			kind: 'accommodation';
			accommodation: Accommodation;
			displayCheckIn: string;
			displayCheckOut: string;
			startRow: number;
			rowSpan: number;
	  }
	| {
			kind: 'gap';
			afterAccommodationId: string;
			beforeAccommodationId: string;
			startDate: string;
			endDate: string;
			startRow: number;
			rowSpan: number;
	  }
	| {
			kind: 'transition';
			fromAccommodationId: string;
			toAccommodationId: string;
			date: string;
			startRow: number;
			rowSpan: 1;
	  };

export type DateMarker = {
	date: string;
	gridRow: number;
	position: 'start' | 'boundary' | 'end';
};

export type DateConnector = {
	gridRow: number;
	rowSpan: number;
};
