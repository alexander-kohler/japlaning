import { json } from '@sveltejs/kit';
import { deleteExpense } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	await deleteExpense(params.id);
	return json({ ok: true });
};
