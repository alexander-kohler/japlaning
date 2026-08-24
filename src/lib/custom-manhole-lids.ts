export type CustomManholeLid = {
	id: string;
	name: string;
	description: string | null;
	address: string | null;
	prefecture: string | null;
	lat: number;
	lng: number;
	createdAt: string;
};

export const CUSTOM_LID_ID_PREFIX = 'custom-';

export function isCustomLidId(id: string): boolean {
	return id.startsWith(CUSTOM_LID_ID_PREFIX);
}

export function createCustomLidId(): string {
	return `${CUSTOM_LID_ID_PREFIX}${crypto.randomUUID()}`;
}

export function customLidTitle(lid: CustomManholeLid): string {
	return lid.name.trim() || 'Custom lid';
}

export function customLidPlace(lid: CustomManholeLid): string {
	const parts = [lid.prefecture, lid.address].filter(Boolean);
	return parts.length > 0 ? parts.join(' · ') : 'Custom location';
}
