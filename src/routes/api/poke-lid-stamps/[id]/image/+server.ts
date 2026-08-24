import { error } from '@sveltejs/kit';
import { getPokeLidStamp } from '$lib/server/poke-lid-stamps';
import { lidExists } from '$lib/server/lid-lookup';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const lidId = params.id?.trim() ?? '';
	if (!lidId || !(await lidExists(lidId))) {
		throw error(404, 'Manhole lid not found');
	}

	const stamp = await getPokeLidStamp(lidId, true);
	if (!stamp?.imageData || !stamp.imageMime) {
		throw error(404, 'No photo for this stamp');
	}

	const binary = Buffer.from(stamp.imageData, 'base64');
	return new Response(binary, {
		headers: {
			'content-type': stamp.imageMime,
			'cache-control': 'private, max-age=3600'
		}
	});
};
