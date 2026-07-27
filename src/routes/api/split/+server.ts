import { json } from '@sveltejs/kit';
import { clearAll } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async () => {
	await clearAll();
	return json({ ok: true });
};
