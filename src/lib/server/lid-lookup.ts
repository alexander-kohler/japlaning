import { getPokeLid } from '$lib/poke-lids';
import { isCustomLidId } from '$lib/custom-manhole-lids';
import { getCustomManholeLid } from '$lib/server/custom-manhole-lids';

/** True when the id refers to an official Poké Lid or a user-added custom lid. */
export async function lidExists(lidId: string): Promise<boolean> {
	if (getPokeLid(lidId)) return true;
	if (!isCustomLidId(lidId)) return false;
	return Boolean(await getCustomManholeLid(lidId));
}
