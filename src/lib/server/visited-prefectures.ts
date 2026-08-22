import { ensureSchema } from '$lib/server/db';

export async function listVisitedPrefectureCodes(): Promise<string[]> {
	const db = await ensureSchema();
	const result = await db.execute(
		'SELECT code FROM visited_prefectures ORDER BY CAST(code AS INTEGER) ASC'
	);
	return result.rows.map((row) => String(row.code));
}

export async function setPrefectureVisited(code: string, visited: boolean): Promise<void> {
	const db = await ensureSchema();

	if (visited) {
		await db.execute({
			sql: `INSERT INTO visited_prefectures (code, visited_at) VALUES (?, ?)
			      ON CONFLICT(code) DO NOTHING`,
			args: [code, new Date().toISOString()]
		});
		return;
	}

	await db.execute({
		sql: 'DELETE FROM visited_prefectures WHERE code = ?',
		args: [code]
	});
}

export async function replaceVisitedPrefectures(codes: string[]): Promise<string[]> {
	const db = await ensureSchema();
	const unique = [...new Set(codes.map((code) => code.trim()).filter(Boolean))].sort(
		(a, b) => Number(a) - Number(b)
	);
	const now = new Date().toISOString();

	await db.execute('DELETE FROM visited_prefectures');

	for (const code of unique) {
		await db.execute({
			sql: 'INSERT INTO visited_prefectures (code, visited_at) VALUES (?, ?)',
			args: [code, now]
		});
	}

	return unique;
}
