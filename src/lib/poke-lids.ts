import raw from '$lib/data/poke-lids.json';
import type { CustomManholeLid } from '$lib/custom-manhole-lids';
import { customLidPlace, customLidTitle } from '$lib/custom-manhole-lids';

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

/** Unified lid shown on the map / list (official or user-added). */
export type DisplayLid = {
	id: string;
	kind: 'pokemon' | 'custom';
	title: string;
	subtitle: string;
	prefecture: string;
	address: string;
	lat: number;
	lng: number;
	imageUrl: string | null;
	detailUrl: string | null;
	description: string | null;
	pokemon: string[];
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

export function pokeLidToDisplay(lid: PokeLid): DisplayLid {
	return {
		id: lid.id,
		kind: 'pokemon',
		title: pokemonLabel(lid),
		subtitle: lid.cityEn ? `${lid.cityEn} · ${lid.city}` : lid.city,
		prefecture: lid.prefecture,
		address: lid.address,
		lat: lid.lat,
		lng: lid.lng,
		imageUrl: lid.imageUrl,
		detailUrl: lid.detailUrl,
		description: null,
		pokemon: lid.pokemon
	};
}

export function customLidToDisplay(lid: CustomManholeLid): DisplayLid {
	return {
		id: lid.id,
		kind: 'custom',
		title: customLidTitle(lid),
		subtitle: customLidPlace(lid),
		prefecture: lid.prefecture?.trim() || 'Custom',
		address: lid.address ?? '',
		lat: lid.lat,
		lng: lid.lng,
		imageUrl: null,
		detailUrl: null,
		description: lid.description,
		pokemon: []
	};
}

export const DISPLAY_POKE_LIDS: DisplayLid[] = POKE_LIDS.map(pokeLidToDisplay);
