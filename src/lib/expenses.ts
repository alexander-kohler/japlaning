export type Person = {
	id: string;
	name: string;
};

export type Expense = {
	id: string;
	description: string;
	amount: number;
	currency: string;
	amountEur: number;
	paidBy: string;
	/** Person ids who share this expense equally. */
	splitAmong: string[];
	createdAt: string;
};

export type Balance = {
	personId: string;
	name: string;
	/** Positive = others owe them; negative = they owe others. */
	netEur: number;
};

export type Settlement = {
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
	amountEur: number;
};

export function createId(): string {
	return crypto.randomUUID();
}

/** Local calendar day (YYYY-MM-DD) for an expense timestamp. */
export function expenseDateKey(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return 'unknown';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Newest `createdAt` first. Invalid timestamps sink to the end. */
export function compareExpensesNewestFirst(a: Expense, b: Expense): number {
	const aMs = new Date(a.createdAt).getTime();
	const bMs = new Date(b.createdAt).getTime();
	const aValid = Number.isFinite(aMs);
	const bValid = Number.isFinite(bMs);
	if (aValid && bValid && aMs !== bMs) return bMs - aMs;
	if (aValid !== bValid) return aValid ? -1 : 1;
	return b.id.localeCompare(a.id);
}

/**
 * Group expenses by local calendar day, newest day first.
 * Within each day, the newest entry is first.
 */
export function groupExpensesByDate(list: Expense[]): { key: string; expenses: Expense[] }[] {
	const groups = new Map<string, Expense[]>();

	for (const expense of [...list].sort(compareExpensesNewestFirst)) {
		const key = expenseDateKey(expense.createdAt);
		const existing = groups.get(key);
		if (existing) {
			existing.push(expense);
		} else {
			groups.set(key, [expense]);
		}
	}

	return [...groups.entries()].map(([key, expenses]) => ({ key, expenses }));
}

/**
 * Net balance per person in EUR.
 * For each expense, payer is credited the full EUR amount;
 * each participant is debited their equal share.
 */
export function computeBalances(people: Person[], expenses: Expense[]): Balance[] {
	const nets = new Map<string, number>();
	for (const person of people) {
		nets.set(person.id, 0);
	}

	for (const expense of expenses) {
		if (!expense.splitAmong.length || !Number.isFinite(expense.amountEur)) continue;

		const share = expense.amountEur / expense.splitAmong.length;
		const payerBalance = nets.get(expense.paidBy);
		if (payerBalance !== undefined) {
			nets.set(expense.paidBy, payerBalance + expense.amountEur);
		}

		for (const personId of expense.splitAmong) {
			const current = nets.get(personId);
			if (current !== undefined) {
				nets.set(personId, current - share);
			}
		}
	}

	return people.map((person) => ({
		personId: person.id,
		name: person.name,
		netEur: roundCents(nets.get(person.id) ?? 0)
	}));
}

/**
 * Greedy settlement: match largest debtors to largest creditors
 * until all balances are cleared (within 1 cent).
 */
export function computeSettlements(balances: Balance[]): Settlement[] {
	const debtors = balances
		.filter((b) => b.netEur < -0.005)
		.map((b) => ({ ...b, remaining: -b.netEur }))
		.sort((a, b) => b.remaining - a.remaining);

	const creditors = balances
		.filter((b) => b.netEur > 0.005)
		.map((b) => ({ ...b, remaining: b.netEur }))
		.sort((a, b) => b.remaining - a.remaining);

	const settlements: Settlement[] = [];
	let i = 0;
	let j = 0;

	while (i < debtors.length && j < creditors.length) {
		const debtor = debtors[i];
		const creditor = creditors[j];
		const amount = roundCents(Math.min(debtor.remaining, creditor.remaining));

		if (amount > 0) {
			settlements.push({
				fromId: debtor.personId,
				fromName: debtor.name,
				toId: creditor.personId,
				toName: creditor.name,
				amountEur: amount
			});
		}

		debtor.remaining = roundCents(debtor.remaining - amount);
		creditor.remaining = roundCents(creditor.remaining - amount);

		if (debtor.remaining <= 0.005) i += 1;
		if (creditor.remaining <= 0.005) j += 1;
	}

	return settlements;
}

function roundCents(value: number): number {
	return Math.round(value * 100) / 100;
}
