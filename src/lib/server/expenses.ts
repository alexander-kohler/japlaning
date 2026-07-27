import type { Expense, Person } from '$lib/expenses';
import { ensureSchema } from '$lib/server/db';

export async function listPeople(): Promise<Person[]> {
	const db = await ensureSchema();
	const result = await db.execute('SELECT id, name FROM people ORDER BY created_at ASC, name ASC');

	return result.rows.map((row) => ({
		id: String(row.id),
		name: String(row.name)
	}));
}

export async function listExpenses(): Promise<Expense[]> {
	const db = await ensureSchema();
	const expenseResult = await db.execute(
		`SELECT id, description, amount, currency, amount_eur, paid_by, created_at
		 FROM expenses
		 ORDER BY created_at DESC`
	);

	if (!expenseResult.rows.length) return [];

	const splitResult = await db.execute('SELECT expense_id, person_id FROM expense_splits');

	const splitsByExpense = new Map<string, string[]>();
	for (const row of splitResult.rows) {
		const expenseId = String(row.expense_id);
		const list = splitsByExpense.get(expenseId) ?? [];
		list.push(String(row.person_id));
		splitsByExpense.set(expenseId, list);
	}

	return expenseResult.rows.map((row) => {
		const id = String(row.id);
		return {
			id,
			description: String(row.description),
			amount: Number(row.amount),
			currency: String(row.currency),
			amountEur: Number(row.amount_eur),
			paidBy: String(row.paid_by),
			splitAmong: splitsByExpense.get(id) ?? [],
			createdAt: String(row.created_at)
		};
	});
}

export async function insertPerson(person: Person): Promise<Person> {
	const db = await ensureSchema();
	await db.execute({
		sql: 'INSERT INTO people (id, name, created_at) VALUES (?, ?, ?)',
		args: [person.id, person.name, new Date().toISOString()]
	});
	return person;
}

export async function deletePerson(id: string): Promise<void> {
	const db = await ensureSchema();

	const usage = await db.execute({
		sql: `SELECT COUNT(*) AS count FROM expenses
		      WHERE paid_by = ?
		         OR id IN (SELECT expense_id FROM expense_splits WHERE person_id = ?)`,
		args: [id, id]
	});

	const count = Number(usage.rows[0]?.count ?? 0);
	if (count > 0) {
		throw new Error('PERSON_IN_USE');
	}

	await db.execute({
		sql: 'DELETE FROM people WHERE id = ?',
		args: [id]
	});
}

export async function insertExpense(expense: Expense): Promise<Expense> {
	const db = await ensureSchema();

	const statements = [
		{
			sql: `INSERT INTO expenses
				(id, description, amount, currency, amount_eur, paid_by, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
			args: [
				expense.id,
				expense.description,
				expense.amount,
				expense.currency,
				expense.amountEur,
				expense.paidBy,
				expense.createdAt
			]
		},
		...expense.splitAmong.map((personId) => ({
			sql: 'INSERT INTO expense_splits (expense_id, person_id) VALUES (?, ?)',
			args: [expense.id, personId]
		}))
	];

	await db.batch(statements, 'write');
	return expense;
}

export async function updateExpense(expense: Expense): Promise<Expense | null> {
	const db = await ensureSchema();

	const existing = await db.execute({
		sql: 'SELECT id FROM expenses WHERE id = ?',
		args: [expense.id]
	});
	if (!existing.rows.length) return null;

	const statements = [
		{
			sql: `UPDATE expenses
				SET description = ?, amount = ?, currency = ?, amount_eur = ?, paid_by = ?, created_at = ?
				WHERE id = ?`,
			args: [
				expense.description,
				expense.amount,
				expense.currency,
				expense.amountEur,
				expense.paidBy,
				expense.createdAt,
				expense.id
			]
		},
		{
			sql: 'DELETE FROM expense_splits WHERE expense_id = ?',
			args: [expense.id]
		},
		...expense.splitAmong.map((personId) => ({
			sql: 'INSERT INTO expense_splits (expense_id, person_id) VALUES (?, ?)',
			args: [expense.id, personId]
		}))
	];

	await db.batch(statements, 'write');
	return expense;
}

export async function deleteExpense(id: string): Promise<void> {
	const db = await ensureSchema();
	await db.batch(
		[
			{
				sql: 'DELETE FROM expense_splits WHERE expense_id = ?',
				args: [id]
			},
			{
				sql: 'DELETE FROM expenses WHERE id = ?',
				args: [id]
			}
		],
		'write'
	);
}

export async function clearAll(): Promise<void> {
	const db = await ensureSchema();
	await db.batch(
		['DELETE FROM expense_splits', 'DELETE FROM expenses', 'DELETE FROM people'],
		'write'
	);
}
