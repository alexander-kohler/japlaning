import { ensureSchema } from '$lib/server/db';
import type { PokeLidStamp } from '$lib/poke-lids';

export type PokeLidStampRecord = PokeLidStamp & {
	imageMime: string | null;
	imageData: string | null;
};

export async function listPokeLidStamps(): Promise<PokeLidStamp[]> {
	const db = await ensureSchema();
	const result = await db.execute(
		`SELECT lid_id, stamped_at, note, image_mime,
		        CASE WHEN image_data IS NOT NULL AND length(image_data) > 0 THEN 1 ELSE 0 END AS has_image
		 FROM poke_lid_stamps
		 ORDER BY stamped_at DESC`
	);

	return result.rows.map((row) => ({
		lidId: String(row.lid_id),
		stampedAt: String(row.stamped_at),
		note: row.note == null || row.note === '' ? null : String(row.note),
		hasImage: Number(row.has_image) === 1
	}));
}

export async function getPokeLidStamp(
	lidId: string,
	includeImage = false
): Promise<PokeLidStampRecord | null> {
	const db = await ensureSchema();
	const result = await db.execute({
		sql: `SELECT lid_id, stamped_at, note, image_mime, image_data
		      FROM poke_lid_stamps WHERE lid_id = ?`,
		args: [lidId]
	});

	const row = result.rows[0] as Record<string, unknown> | undefined;
	if (!row) return null;

	const imageData = row.image_data == null ? null : String(row.image_data);
	return {
		lidId: String(row.lid_id),
		stampedAt: String(row.stamped_at),
		note: row.note == null || row.note === '' ? null : String(row.note),
		hasImage: Boolean(imageData),
		imageMime: row.image_mime == null ? null : String(row.image_mime),
		imageData: includeImage ? imageData : null
	};
}

export async function upsertPokeLidStamp(input: {
	lidId: string;
	note?: string | null;
	imageMime?: string | null;
	imageData?: string | null;
	clearImage?: boolean;
}): Promise<PokeLidStampRecord> {
	const db = await ensureSchema();
	const existing = await getPokeLidStamp(input.lidId, true);
	const stampedAt = existing?.stampedAt ?? new Date().toISOString();
	const note =
		input.note === undefined ? (existing?.note ?? null) : input.note?.trim() || null;

	let imageMime = existing?.imageMime ?? null;
	let imageData = existing?.imageData ?? null;

	if (input.clearImage) {
		imageMime = null;
		imageData = null;
	} else if (input.imageData != null) {
		imageMime = input.imageMime ?? 'image/jpeg';
		imageData = input.imageData;
	}

	await db.execute({
		sql: `INSERT INTO poke_lid_stamps (lid_id, stamped_at, note, image_mime, image_data)
		      VALUES (?, ?, ?, ?, ?)
		      ON CONFLICT(lid_id) DO UPDATE SET
		        note = excluded.note,
		        image_mime = excluded.image_mime,
		        image_data = excluded.image_data`,
		args: [input.lidId, stampedAt, note, imageMime, imageData]
	});

	return {
		lidId: input.lidId,
		stampedAt,
		note,
		hasImage: Boolean(imageData),
		imageMime,
		imageData: null
	};
}

export async function deletePokeLidStamp(lidId: string): Promise<boolean> {
	const db = await ensureSchema();
	const result = await db.execute({
		sql: 'DELETE FROM poke_lid_stamps WHERE lid_id = ?',
		args: [lidId]
	});
	return Number(result.rowsAffected ?? 0) > 0;
}
