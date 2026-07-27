import { redirect, type Handle } from '@sveltejs/kit';
import { getUsername, isAuthenticated } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isLogin = path === '/login';
	const authed = isAuthenticated(event.cookies);

	event.locals.username = authed ? getUsername(event.cookies) : null;

	if (!authed && !isLogin) {
		throw redirect(303, '/login');
	}

	if (authed && isLogin) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
