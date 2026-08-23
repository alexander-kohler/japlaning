import { isRemoteTursoConfigured } from '$lib/server/db';
import { listPokeLidStamps } from '$lib/server/poke-lid-stamps';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stamps = await listPokeLidStamps();

	return {
		stamps,
		persistence: isRemoteTursoConfigured() ? ('turso' as const) : ('local' as const)
	};
};
