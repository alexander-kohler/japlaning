import { error, json } from '@sveltejs/kit';
import { createId, type Expense } from '$lib/expenses';
import { insertExpense, listExpenses, listPeople } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const expenses = await listExpenses();
	return json({ expenses });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		description?: string;
		amount?: number;
		currency?: string;
		amountEur?: number;
		paidBy?: string;
		splitAmong?: string[];
	};

	const description = body.description?.trim() ?? '';
	const amount = Number(body.amount);
	const amountEur = Number(body.amountEur);
	const currency = body.currency?.trim().toUpperCase() ?? '';
	const paidBy = body.paidBy?.trim() ?? '';
	const splitAmong = Array.isArray(body.splitAmong)
		? [...new Set(body.splitAmong.map(String))]
		: [];

	if (!description) throw error(400, 'Description is required');
	if (!Number.isFinite(amount) || amount <= 0) throw error(400, 'Invalid amount');
	if (!Number.isFinite(amountEur) || amountEur < 0) throw error(400, 'Invalid EUR amount');
	if (!currency) throw error(400, 'Currency is required');
	if (!paidBy) throw error(400, 'paidBy is required');
	if (!splitAmong.length) throw error(400, 'splitAmong is required');

	const people = await listPeople();
	const personIds = new Set(people.map((person) => person.id));
	if (!personIds.has(paidBy)) throw error(400, 'Payer not found');
	if (splitAmong.some((id) => !personIds.has(id))) {
		throw error(400, 'One or more split participants were not found');
	}

	const expense: Expense = {
		id: createId(),
		description,
		amount,
		currency,
		amountEur,
		paidBy,
		splitAmong,
		createdAt: new Date().toISOString()
	};

	await insertExpense(expense);
	return json({ expense }, { status: 201 });
};
