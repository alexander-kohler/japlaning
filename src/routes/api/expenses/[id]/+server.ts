import { error, json } from '@sveltejs/kit';
import { ALLOWED_CURRENCIES } from '$lib/currency';
import type { Expense } from '$lib/expenses';
import { deleteExpense, listPeople, updateExpense } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = (await request.json()) as {
		description?: string;
		amount?: number;
		currency?: string;
		amountEur?: number;
		paidBy?: string;
		splitAmong?: string[];
		createdAt?: string;
	};

	const description = body.description?.trim() ?? '';
	const amount = Number(body.amount);
	const amountEur = Number(body.amountEur);
	const currency = body.currency?.trim().toUpperCase() ?? '';
	const paidBy = body.paidBy?.trim() ?? '';
	const splitAmong = Array.isArray(body.splitAmong)
		? [...new Set(body.splitAmong.map(String))]
		: [];
	const createdAtRaw = body.createdAt?.trim() ?? '';
	const createdAtDate = createdAtRaw ? new Date(createdAtRaw) : new Date();

	if (!description) throw error(400, 'Description is required');
	if (!Number.isFinite(amount) || amount <= 0) throw error(400, 'Invalid amount');
	if (!Number.isFinite(amountEur) || amountEur < 0) throw error(400, 'Invalid EUR amount');
	if (!currency) throw error(400, 'Currency is required');
	if (!ALLOWED_CURRENCIES.has(currency)) {
		throw error(400, 'Currency must be EUR or JPY');
	}
	if (!paidBy) throw error(400, 'paidBy is required');
	if (!splitAmong.length) throw error(400, 'splitAmong is required');
	if (Number.isNaN(createdAtDate.getTime())) throw error(400, 'Invalid date and time');

	const people = await listPeople();
	const personIds = new Set(people.map((person) => person.id));
	if (!personIds.has(paidBy)) throw error(400, 'Payer not found');
	if (splitAmong.some((id) => !personIds.has(id))) {
		throw error(400, 'One or more split participants were not found');
	}

	const expense: Expense = {
		id: params.id,
		description,
		amount,
		currency,
		amountEur,
		paidBy,
		splitAmong,
		createdAt: createdAtDate.toISOString()
	};

	const updated = await updateExpense(expense);
	if (!updated) throw error(404, 'Expense not found');

	return json({ expense: updated });
};

export const DELETE: RequestHandler = async ({ params }) => {
	await deleteExpense(params.id);
	return json({ ok: true });
};
