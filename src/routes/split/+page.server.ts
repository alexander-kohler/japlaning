import { isRemoteTursoConfigured } from '$lib/server/db';
import { listExpenses, listPeople } from '$lib/server/expenses';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [people, expenses] = await Promise.all([listPeople(), listExpenses()]);

	return {
		people,
		expenses,
		persistence: isRemoteTursoConfigured() ? ('turso' as const) : ('local' as const)
	};
};
