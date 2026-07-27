import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export const AUTH_COOKIE = 'rp_auth';
export const USER_COOKIE = 'rp_user';

const ONE_YEAR_S = 60 * 60 * 24 * 365;

export function getAppPassword(): string {
	return env.APP_PASSWORD?.trim() || 'reiseplaner';
}

export function isValidPassword(password: string): boolean {
	return password === getAppPassword();
}

export function isAuthenticated(cookies: Cookies): boolean {
	const user = cookies.get(USER_COOKIE)?.trim();
	const auth = cookies.get(AUTH_COOKIE);
	return Boolean(user) && auth === getAppPassword();
}

export function getUsername(cookies: Cookies): string | null {
	return cookies.get(USER_COOKIE)?.trim() || null;
}

export function setAuthCookies(cookies: Cookies, username: string, password: string): void {
	const options = {
		path: '/',
		maxAge: ONE_YEAR_S,
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev
	};

	cookies.set(USER_COOKIE, username.trim(), options);
	cookies.set(AUTH_COOKIE, password, options);
}

export function clearAuthCookies(cookies: Cookies): void {
	cookies.delete(USER_COOKIE, { path: '/' });
	cookies.delete(AUTH_COOKIE, { path: '/' });
}
