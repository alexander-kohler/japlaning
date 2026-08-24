import { ensureSchema } from '$lib/server/db';
import {
	createCustomLidId,
	type CustomManholeLid
} from '$lib/custom-manhole-lids';

function rowToLid(row: Record<string, unknown>): CustomManholeLid {
	return {
		id: String(row.id),
		name: String(row.name),
		description: row.description == null || row.description === '' ? null : String(row.description),
		address: row.address == null || row.address === '' ? null : String(row.address),
		prefecture: row.prefecture == null || row.prefecture === '' ? null : String(row.prefecture),
		lat: Number(row.lat),
		lng: Number(row.lng),
		createdAt: String(row.created_at)
	};
}

export async function listCustomManholeLids(): Promise<CustomManholeLid[]> {
	const db = await ensureSchema();
	const result = await db.execute(
		`SELECT id, name, description, address, prefecture, lat, lng, created_at
		 FROM custom_manhole_lids
		 ORDER BY created_at DESC`
	);
	return result.rows.map((row) => rowToLid(row as Record<string, unknown>));
}

export async function getCustomManholeLid(id: string): Promise<CustomManholeLid | null> {
	const db = await ensureSchema();
	const result = await db.execute({
		sql: `SELECT id, name, description, address, prefecture, lat, lng, created_at
		      FROM custom_manhole_lids WHERE id = ?`,
		args: [id]
	});
	const row = result.rows[0] as Record<string, unknown> | undefined;
	return row ? rowToLid(row) : null;
}

export async function insertCustomManholeLid(input: {
	name: string;
	description?: string | null;
	address?: string | null;
	prefecture?: string | null;
	lat: number;
	lng: number;
}): Promise<CustomManholeLid> {
	const db = await ensureSchema();
	const lid: CustomManholeLid = {
		id: createCustomLidId(),
		name: input.name.trim(),
		description: input.description?.trim() || null,
		address: input.address?.trim() || null,
		prefecture: input.prefecture?.trim() || null,
		lat: input.lat,
		lng: input.lng,
		createdAt: new Date().toISOString()
	};

	await db.execute({
		sql: `INSERT INTO custom_manhole_lids
		      (id, name, description, address, prefecture, lat, lng, created_at)
		      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		args: [
			lid.id,
			lid.name,
			lid.description,
			lid.address,
			lid.prefecture,
			lid.lat,
			lid.lng,
			lid.createdAt
		]
	});

	return lid;
}

export async function updateCustomManholeLid(
	id: string,
	input: {
		name?: string;
		description?: string | null;
		address?: string | null;
		prefecture?: string | null;
		lat?: number;
		lng?: number;
	}
): Promise<CustomManholeLid | null> {
	const existing = await getCustomManholeLid(id);
	if (!existing) return null;

	const next: CustomManholeLid = {
		...existing,
		name: input.name !== undefined ? input.name.trim() : existing.name,
		description:
			input.description === undefined
				? existing.description
				: input.description?.trim() || null,
		address:
			input.address === undefined ? existing.address : input.address?.trim() || null,
		prefecture:
			input.prefecture === undefined
				? existing.prefecture
				: input.prefecture?.trim() || null,
		lat: input.lat ?? existing.lat,
		lng: input.lng ?? existing.lng
	};

	if (!next.name) {
		throw new Error('Name is required');
	}

	const db = await ensureSchema();
	await db.execute({
		sql: `UPDATE custom_manhole_lids
		      SET name = ?, description = ?, address = ?, prefecture = ?, lat = ?, lng = ?
		      WHERE id = ?`,
		args: [
			next.name,
			next.description,
			next.address,
			next.prefecture,
			next.lat,
			next.lng,
			id
		]
	});

	return next;
}

export async function deleteCustomManholeLid(id: string): Promise<boolean> {
	const db = await ensureSchema();
	await db.execute({
		sql: 'DELETE FROM poke_lid_stamps WHERE lid_id = ?',
		args: [id]
	});
	const result = await db.execute({
		sql: 'DELETE FROM custom_manhole_lids WHERE id = ?',
		args: [id]
	});
	return Number(result.rowsAffected ?? 0) > 0;
}
