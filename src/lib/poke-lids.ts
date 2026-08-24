import raw from '$lib/data/poke-lids.json';

export type PokeLid = {
	id: string;
	prefecture: string;
	city: string;
	cityEn: string | null;
	address: string;
	lat: number;
	lng: number;
	pokemon: string[];
	imageUrl: string | null;
	detailUrl: string | null;
};

export type PokeLidStamp = {
	lidId: string;
	stampedAt: string;
	note: string | null;
	hasImage: boolean;
};

export const POKE_LIDS = raw as PokeLid[];
export const POKE_LID_COUNT = POKE_LIDS.length;

const byId = new Map(POKE_LIDS.map((lid) => [lid.id, lid]));

export function getPokeLid(id: string): PokeLid | undefined {
	return byId.get(id);
}

export function lidLabel(lid: PokeLid): string {
	const place = lid.cityEn ? `${lid.cityEn} (${lid.city})` : lid.city;
	return `${lid.prefecture} · ${place}`;
}

export function pokemonLabel(lid: PokeLid): string {
	return lid.pokemon.length > 0 ? lid.pokemon.join(' · ') : 'Poké Lid';
}

export const POKE_LID_PREFECTURES = [...new Set(POKE_LIDS.map((lid) => lid.prefecture))];
