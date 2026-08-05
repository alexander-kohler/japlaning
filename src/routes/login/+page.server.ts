import { fail, redirect } from '@sveltejs/kit';
import { isValidPassword, setAuthCookies } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!isValidPassword(password)) {
			return fail(401, { error: 'Wrong password.' });
		}

		setAuthCookies(cookies, password);
		throw redirect(303, '/calendar');
	}
};
