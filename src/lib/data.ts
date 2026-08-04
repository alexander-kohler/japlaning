export type Activity = {
	id: string;
	name: string;
	start?: string;
	end?: string;
};

export type TravelItem = {
	id: string;
	kind: 'accommodation' | 'plane' | 'ferry';
	name: string;
	start: string;
	end: string;
	address?: string;
	bookingUrl?: string;
	activities?: Activity[];
};

export type CarRental = {
	id: string;
	name: string;
	start: string;
	end: string;
};

export const travelItems: {
	items: TravelItem[];
	cars: CarRental[];
} = {
	items: [
		{
			id: 'kiseki-shinjuku',
			kind: 'accommodation',
			name: 'Kise早i, Shinjuku',
			start: '2026-08-12T16:00',
			end: '2026-08-17T10:00',
			address: '107-5 Wasedatsurumakichō, Shinjuku, Tokyo 162-0041, Japan',
			activities: [
				{
					id: 'tokyo-tower',
					name: 'Visit Tokyo Tower',
					start: '2026-08-12T16:00',
					end: '2026-08-12T17:00'
				},
				{
					id: 'tokyo-skytree',
					name: 'Tokyo Skytree'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'tokyo-matsuyama-flight',
			kind: 'plane',
			name: 'Tokyo -> Matsuyama',
			start: '2026-08-17T10:00',
			end: '2026-08-17T12:00'
		},
		{
			id: 'family-matsuyama',
			kind: 'accommodation',
			name: '４１㎡ファミリー向け、２寝室、５名, Matsuyama',
			start: '2026-08-17T15:00',
			end: '2026-08-19T10:00',
			address: '1-chōme-13-3 Yanaimachi, Matsuyama, Ehime 790-0014, Japan',
			bookingUrl: ''
		},
		{
			id: 'fukuinn-takamatsu',
			kind: 'accommodation',
			name: '福宿 Fukuinn 302号室, Takamatsu',
			start: '2026-08-19T16:00',
			end: '2026-08-22T09:00',
			bookingUrl: ''
		},
		{
			id: 'toyoko-inn-tokushima',
			kind: 'accommodation',
			name: 'Toyoko Inn Tokushima eki Bizan guchi, Tokushima',
			start: '2026-08-22T16:00',
			end: '2026-08-24T09:00',
			bookingUrl: ''
		},
		{
			id: 'meriken-port-kobe',
			kind: 'accommodation',
			name: 'Hotel Meriken Port Kobe Motomachi, Kōbe',
			start: '2026-08-24T16:00',
			end: '2026-08-26T09:00',
			bookingUrl: ''
		},
		{
			id: 'ibis-styles-kyoto',
			kind: 'accommodation',
			name: 'ibis Styles Kyoto Shijo, Kyōto',
			start: '2026-08-26T16:00',
			end: '2026-09-01T09:00',
			bookingUrl: ''
		},
		{
			id: 'comfort-hotel-tanabe',
			kind: 'accommodation',
			name: 'Comfort Hotel Kii Tanabe, Tanabe',
			start: '2026-09-01T16:00',
			end: '2026-09-02T09:00',
			bookingUrl: ''
		},
		{
			id: 'guesthouse-yata-tanabe',
			kind: 'accommodation',
			name: 'ゲストハウス八咫, Tanabe',
			start: '2026-09-02T16:00',
			end: '2026-09-03T09:00',
			bookingUrl: ''
		},
		{
			id: 'cottage-kirihata-tanabe',
			kind: 'accommodation',
			name: 'Cottage Kirihata, Tanabe',
			start: '2026-09-03T16:00',
			end: '2026-09-04T09:00',
			bookingUrl: ''
		},
		{
			id: 'ikkyu-kobune',
			kind: 'accommodation',
			name: 'ikkyu rental vacation house, Kobune',
			start: '2026-09-04T16:00',
			end: '2026-09-05T09:00',
			bookingUrl: ''
		},
		{
			id: 'nachi-no-sato',
			kind: 'accommodation',
			name: '那智の里 Accommodation along the Kumano Kodo trail, Nachikatsuura',
			start: '2026-09-05T16:00',
			end: '2026-09-06T09:00',
			bookingUrl: ''
		},
		{
			id: 'hoshi-no-yado-osaka',
			kind: 'accommodation',
			name: '星之宿今宫, Osaka',
			start: '2026-09-06T16:00',
			end: '2026-09-08T09:00',
			bookingUrl: ''
		},
		{
			id: 'ferry-osaka-fukuoka',
			kind: 'ferry',
			name: 'Ferry Osaka -> Fukuoka',
			start: '2026-09-08T19:30',
			end: '2026-09-09T07:30'
		},
		{
			id: 'rakuten-stay-fukuoka',
			kind: 'accommodation',
			name: 'Rakuten STAY Fukuoka Yakuin, Fukuoka',
			start: '2026-09-09T16:00',
			end: '2026-09-11T09:00',
			bookingUrl: ''
		},
		{
			id: 'grand-residence-tenjin',
			kind: 'accommodation',
			name: 'Grand Residence Hotel Tenjin, Fukuoka',
			start: '2026-09-11T16:00',
			end: '2026-09-12T09:00',
			bookingUrl: ''
		},
		{
			id: 'simple-stay-beppu',
			kind: 'accommodation',
			name: 'Simple Stay Beppu, Beppu',
			start: '2026-09-12T16:00',
			end: '2026-09-14T09:00',
			bookingUrl: ''
		},
		{
			id: 'shijin-minami-aso',
			kind: 'accommodation',
			name: '阿蘇山麓のヴィラShijin南阿蘇, Minami Aso',
			start: '2026-09-14T16:00',
			end: '2026-09-16T09:00',
			bookingUrl: ''
		},
		{
			id: 'fav-kumamoto',
			kind: 'accommodation',
			name: 'fav KUMAMOTO, Kumamoto',
			start: '2026-09-16T16:00',
			end: '2026-09-17T09:00',
			bookingUrl: ''
		},
		{
			id: 'zee-haven-nagasaki',
			kind: 'accommodation',
			name: 'Zee Haven nagasakiekimae – ZEE HAVEN長崎駅前, Nagasaki',
			start: '2026-09-17T16:00',
			end: '2026-09-19T09:00',
			bookingUrl: ''
		},
		{
			id: 'lotus-village-fukuoka',
			kind: 'accommodation',
			name: 'ロータスヴィレッジ, Fukuoka',
			start: '2026-09-19T16:00',
			end: '2026-09-21T09:00',
			bookingUrl: ''
		},
		{
			id: 'b-hotel-hiroshima',
			kind: 'accommodation',
			name: 'b hotel Heiwaodori 601, Hiroshima',
			start: '2026-09-21T16:00',
			end: '2026-09-24T09:00',
			bookingUrl: ''
		},
		{
			id: 'grand-base-kurashiki',
			kind: 'accommodation',
			name: 'GRAND BASE Kurashiki Chuo, Kurashiki',
			start: '2026-09-24T16:00',
			end: '2026-09-26T09:00',
			bookingUrl: ''
		},
		{
			id: 'wayfarer-matsu-osaka',
			kind: 'accommodation',
			name: 'WAYFARER Matsu, Osaka',
			start: '2026-09-26T16:00',
			end: '2026-10-01T09:00',
			bookingUrl: ''
		},
		{
			id: 'gee-haive-mishima',
			kind: 'accommodation',
			name: 'Hotel Gee Haive, Mishima',
			start: '2026-10-01T16:00',
			end: '2026-10-02T09:00',
			bookingUrl: ''
		},
		{
			id: 'villa-omodaka-oguchi',
			kind: 'accommodation',
			name: '一棟貸しVilla OMODAKA, Oguchi',
			start: '2026-10-02T16:00',
			end: '2026-10-04T09:00',
			bookingUrl: ''
		},
		{
			id: 'view-odawara',
			kind: 'accommodation',
			name: 'THE VIEW Odawara shiro-no mieru hotel – Vacation STAY 53335v, Odawara',
			start: '2026-10-04T16:00',
			end: '2026-10-05T09:00',
			bookingUrl: ''
		},
		{
			id: 'skytreehouse-sumida',
			kind: 'accommodation',
			name: 'Airbnb SkytreeHouse 東向島, Sumida City / Tokyo',
			start: '2026-10-05T16:00',
			end: '2026-10-11T09:00',
			bookingUrl: ''
		},
		{
			id: 'hedistar-narita',
			kind: 'accommodation',
			name: 'The Hedistar Hotel Narita, Narita',
			start: '2026-10-11T16:00',
			end: '2026-10-13T09:00',
			bookingUrl: ''
		}
	],
	cars: [
		{
			id: 'nico-nico-fukuoka',
			name: 'Honda N-Box or similar, Nico Nico Rentacar, Fukuoka',
			start: '2026-09-12T10:00',
			end: '2026-09-19T18:00'
		},
		{
			id: 'orix-oshima',
			name: 'Daihatsu Move or similar, Orix, Oshima',
			start: '2026-10-02T09:00',
			end: '2026-10-04T17:00'
		}
	]
};

export function getAccommodationById(id: string): TravelItem | undefined {
	return travelItems.items.find((item) => item.id === id && item.kind === 'accommodation');
}

export function splitNameAndLocation(name: string): { displayName: string; location: string } {
	if (/\s*->\s*/.test(name)) {
		return { displayName: name, location: '' };
	}

	const commaIndex = name.lastIndexOf(',');
	if (commaIndex === -1) {
		return { displayName: name, location: '' };
	}

	return {
		displayName: name.slice(0, commaIndex).trim(),
		location: name.slice(commaIndex + 1).trim()
	};
}
