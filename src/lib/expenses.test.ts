import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	compareExpensesNewestFirst,
	expenseDateKey,
	groupExpensesByDate,
	personWhoOwesMost,
	type Balance,
	type Expense
} from './expenses.ts';

function expense(partial: Partial<Expense> & Pick<Expense, 'id' | 'createdAt'>): Expense {
	return {
		description: partial.description ?? partial.id,
		amount: 1,
		currency: 'EUR',
		amountEur: 1,
		paidBy: 'alex',
		splitAmong: ['alex'],
		...partial
	};
}

describe('groupExpensesByDate', () => {
	it('shows the newest day first and the newest entry first within each day', () => {
		const grouped = groupExpensesByDate([
			expense({ id: 'old-morning', createdAt: '2026-09-18T08:00:00.000Z' }),
			expense({ id: 'new-evening', createdAt: '2026-09-19T20:00:00.000Z' }),
			expense({ id: 'new-morning', createdAt: '2026-09-19T09:00:00.000Z' }),
			expense({ id: 'old-night', createdAt: '2026-09-18T22:00:00.000Z' })
		]);

		assert.deepEqual(
			grouped.map((group) => group.expenses.map((item) => item.id)),
			[
				['new-evening', 'new-morning'],
				['old-night', 'old-morning']
			]
		);
		assert.equal(grouped[0].key, expenseDateKey('2026-09-19T20:00:00.000Z'));
		assert.equal(grouped[1].key, expenseDateKey('2026-09-18T22:00:00.000Z'));
	});

	it('selects the person who owes the most', () => {
		const balances: Balance[] = [
			{ personId: 'aya', name: 'Aya', netEur: 40 },
			{ personId: 'ben', name: 'Ben', netEur: -10 },
			{ personId: 'chris', name: 'Chris', netEur: -25 }
		];

		assert.equal(personWhoOwesMost(balances), 'chris');
	});

	it('keeps the earlier person when two people owe the same amount', () => {
		const balances: Balance[] = [
			{ personId: 'aya', name: 'Aya', netEur: -10 },
			{ personId: 'ben', name: 'Ben', netEur: -10 }
		];

		assert.equal(personWhoOwesMost(balances), 'aya');
	});

	it('returns null when nobody owes money', () => {
		assert.equal(
			personWhoOwesMost([
				{ personId: 'aya', name: 'Aya', netEur: 0 },
				{ personId: 'ben', name: 'Ben', netEur: 12 }
			]),
			null
		);
		assert.equal(personWhoOwesMost([{ personId: 'aya', name: 'Aya', netEur: -0.004 }]), null);
	});

	it('keeps a later timestamp first even when the source list is oldest-first', () => {
		const a = expense({ id: 'a', createdAt: '2026-09-19T10:00:00.000Z' });
		const b = expense({ id: 'b', createdAt: '2026-09-19T18:30:00.000Z' });
		assert.ok(compareExpensesNewestFirst(b, a) < 0);
		assert.deepEqual(
			groupExpensesByDate([a, b])[0].expenses.map((item) => item.id),
			['b', 'a']
		);
	});
});
