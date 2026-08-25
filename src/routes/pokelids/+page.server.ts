import { isRemoteTursoConfigured } from '$lib/server/db';
import { listCustomManholeLids } from '$lib/server/custom-manhole-lids';
import { listPokeLidStamps } from '$lib/server/poke-lid-stamps';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stamps, customLids] = await Promise.all([
		listPokeLidStamps(),
		listCustomManholeLids()
	]);

	return {
		stamps,
		customLids,
		persistence: isRemoteTursoConfigured() ? ('turso' as const) : ('local' as const)
	};
};
