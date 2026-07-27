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
