import { createClient, type Client } from '@libsql/client';
import { env } from '$env/dynamic/private';

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function isRemoteTursoConfigured(): boolean {
	return Boolean(env.TURSO_DATABASE_URL?.trim());
}

export function getDb(): Client {
	if (client) return client;

	const url = env.TURSO_DATABASE_URL?.trim() || 'file:local.db';
	const authToken = env.TURSO_AUTH_TOKEN?.trim();

	client = createClient({
		url,
		...(authToken ? { authToken } : {})
	});

	return client;
}

export async function ensureSchema(): Promise<Client> {
	const db = getDb();

	if (!schemaReady) {
		schemaReady = (async () => {
			await db.execute('PRAGMA foreign_keys = ON');
			await db.batch(
				[
					`CREATE TABLE IF NOT EXISTS people (
						id TEXT PRIMARY KEY,
						name TEXT NOT NULL UNIQUE,
						created_at TEXT NOT NULL
					)`,
					`CREATE TABLE IF NOT EXISTS expenses (
						id TEXT PRIMARY KEY,
						description TEXT NOT NULL,
						amount REAL NOT NULL,
						currency TEXT NOT NULL,
						amount_eur REAL NOT NULL,
						paid_by TEXT NOT NULL REFERENCES people(id),
						created_at TEXT NOT NULL
					)`,
					`CREATE TABLE IF NOT EXISTS expense_splits (
						expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
						person_id TEXT NOT NULL REFERENCES people(id),
						PRIMARY KEY (expense_id, person_id)
					)`
				],
				'write'
			);
		})();
	}

	await schemaReady;
	return db;
}
