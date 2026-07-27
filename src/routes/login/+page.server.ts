import { fail, redirect } from '@sveltejs/kit';
import { isValidPassword, setAuthCookies } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!username) {
			return fail(400, { username, error: 'Enter a username.' });
		}

		if (!isValidPassword(password)) {
			return fail(401, { username, error: 'Wrong password.' });
		}

		setAuthCookies(cookies, username, password);
		throw redirect(303, '/');
	}
};
