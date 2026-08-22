import { isRemoteTursoConfigured } from '$lib/server/db';
import { listVisitedPrefectureCodes } from '$lib/server/visited-prefectures';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const codes = await listVisitedPrefectureCodes();

	return {
		visitedCodes: codes,
		persistence: isRemoteTursoConfigured() ? ('turso' as const) : ('local' as const)
	};
};
