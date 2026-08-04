import { error } from '@sveltejs/kit';
import { getAccommodationById } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const accommodation = getAccommodationById(params.id);
	if (!accommodation) {
		error(404, 'Accommodation not found');
	}

	return { accommodation };
};
