import { json, error } from '@sveltejs/kit';
import { createId } from '$lib/expenses';
import { insertPerson, listPeople } from '$lib/server/expenses';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const people = await listPeople();
	return json({ people });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { name?: string };
	const name = body.name?.trim() ?? '';

	if (!name) {
		throw error(400, 'Name is required');
	}

	const existing = await listPeople();
	if (existing.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
		throw error(409, 'That person is already in the list');
	}

	const person = await insertPerson({ id: createId(), name });
	return json({ person }, { status: 201 });
};
