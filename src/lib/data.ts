function generateId() {
	return Math.random().toString(36).substring(2, 15);
}

export const travelItems = {
	items: [
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Tokyo',
			start: '2026-08-12T16:00',
			end: '2026-08-16T09:00',
			activities: [
				{
					id: generateId(),
					name: 'Visit Tokyo Tower',
					start: '2026-08-12T16:00',
					end: '2026-08-12T17:00'
				},
				{
					id: generateId(),
					name: 'Tokyo Skytree'
				}
			]
		},
		{
			id: generateId(),
			kind: 'plane',
			name: 'Tokyo -> Matsuyama',
			start: '2026-08-16T10:00',
			end: '2026-08-16T12:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Matsuyama',
			start: '2026-08-16T16:00',
			end: '2026-08-19T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Takamatsu',
			start: '2026-08-19T16:00',
			end: '2026-08-22T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Naruto',
			start: '2026-08-22T16:00',
			end: '2026-08-24T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Kobe',
			start: '2026-08-24T16:00',
			end: '2026-08-26T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'ibis Styles Kyoto Shijo, Kyōto',
			start: '2026-08-26T16:00',
			end: '2026-09-01T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Comfort Hotel Kii Tanabe, Tanabe',
			start: '2026-09-01T16:00',
			end: '2026-09-02T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'ゲストハウス八咫, Tanabe',
			start: '2026-09-02T16:00',
			end: '2026-09-03T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Cottage Kirihata, Tanabe',
			start: '2026-09-03T16:00',
			end: '2026-09-04T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'ikkyu rental vacation house, Kobune',
			start: '2026-09-04T16:00',
			end: '2026-09-05T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: '那智の里 Accommodation along the Kumano Kodo trail, Nachikatsuura',
			start: '2026-09-05T16:00',
			end: '2026-09-06T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Osaka',
			start: '2026-09-06T16:00',
			end: '2026-09-08T09:00'
		},
		{
			id: generateId(),
			kind: 'ferry',
			name: 'Ferry Osaka -> Fukuoka',
			start: '2026-09-08T19:30',
			end: '2026-09-09T07:30'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Fukuoka',
			start: '2026-09-09T16:00',
			end: '2026-09-11T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Grand Residence Hotel Tenjin, Fukuoka',
			start: '2026-09-11T16:00',
			end: '2026-09-12T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Simple Stay Beppu, Beppu',
			start: '2026-09-12T16:00',
			end: '2026-09-14T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: '阿蘇山麓のヴィラShijin南阿蘇, Minami Aso',
			start: '2026-09-14T16:00',
			end: '2026-09-16T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'fav KUMAMOTO, Kumamoto',
			start: '2026-09-16T16:00',
			end: '2026-09-17T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Zee Haven nagasakiekimae – ZEE HAVEN長崎駅前, Nagasaki',
			start: '2026-09-17T16:00',
			end: '2026-09-19T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'ロータスヴィレッジ, Fukuoka',
			start: '2026-09-19T16:00',
			end: '2026-09-21T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'b hotel Heiwaodori 601, Hiroshima',
			start: '2026-09-21T16:00',
			end: '2026-09-24T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'GRAND BASE Kurashiki Chuo, Kurashiki',
			start: '2026-09-24T16:00',
			end: '2026-09-26T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'WAYFARER Matsu, Osaka',
			start: '2026-09-26T16:00',
			end: '2026-10-01T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Hotel Gee Haive, Mishima',
			start: '2026-10-01T16:00',
			end: '2026-10-02T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: '一棟貸しVilla OMODAKA, Oguchi',
			start: '2026-10-02T16:00',
			end: '2026-10-04T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'THE VIEW Odawara shiro-no mieru hotel – Vacation STAY 53335v, Odawara',
			start: '2026-10-04T16:00',
			end: '2026-10-05T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Airbnb SkytreeHouse 東向島, Sumida City / Tokyo',
			start: '2026-10-05T16:00',
			end: '2026-10-11T09:00'
		},
		{
			id: generateId(),
			kind: 'accommodation',
			name: 'Tokyo',
			start: '2026-10-11T16:00',
			end: '2026-10-13T09:00'
		}
	],
	cars: [
		{
			id: generateId(),
			name: 'Honda N-Box or similar, Nico Nico Rentacar, Fukuoka',
			start: '2026-09-12T10:00',
			end: '2026-09-19T18:00'
		},
		{
			id: generateId(),
			name: 'Daihatsu Move or similar, Orix, Oshima',
			start: '2026-10-02T09:00',
			end: '2026-10-04T17:00'
		}
	]
};
