const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'short' });

export function toIsoDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function formatDay(iso: string): string {
	return DAY_FORMAT.format(parseIsoDate(iso));
}

/** Day + month on the first date; month only when the month changes; day number in between. */
export function formatTimelineDayLabel(iso: string, previousIso: string | null): string {
	const date = parseIsoDate(iso);

	if (!previousIso) {
		return DAY_FORMAT.format(date);
	}

	const previous = parseIsoDate(previousIso);
	if (
		date.getMonth() !== previous.getMonth() ||
		date.getFullYear() !== previous.getFullYear()
	) {
		return MONTH_FORMAT.format(date);
	}

	return String(date.getDate());
}

export function formatRange(start: string, end: string): string {
	if (start === end) return formatDay(start);
	return `${formatDay(start)} – ${formatDay(end)}`;
}

export function compareDates(a: string, b: string): number {
	return a.localeCompare(b);
}

export function isDateInRange(date: string, start: string, end: string): boolean {
	return date >= start && date <= end;
}

export function addDays(iso: string, days: number): string {
	const date = parseIsoDate(iso);
	date.setDate(date.getDate() + days);
	return toIsoDate(date);
}

export function subDays(iso: string, days: number): string {
	return addDays(iso, -days);
}

export function daysBetween(start: string, end: string): string[] {
	const days: string[] = [];
	const current = parseIsoDate(start);
	const last = parseIsoDate(end);

	while (current <= last) {
		days.push(toIsoDate(current));
		current.setDate(current.getDate() + 1);
	}

	return days;
}

export function generateId(): string {
	return crypto.randomUUID();
}
