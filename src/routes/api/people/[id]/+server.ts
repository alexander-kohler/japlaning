import { error, json } from '@sveltejs/kit';
import { deletePerson } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deletePerson(params.id);
		return json({ ok: true });
	} catch (err) {
		if (err instanceof Error && err.message === 'PERSON_IN_USE') {
			throw error(409, 'Remove expenses involving this person first');
		}
		throw err;
	}
};
