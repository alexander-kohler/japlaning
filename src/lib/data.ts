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
					id: 'yanaka-ginza',
					name: 'Yanaka Ginza shitamachi stroll (hidden gem)'
				},
				{
					id: 'omoide-yokocho',
					name: 'Omoide Yokocho alley yakitori (Shinjuku)'
				},
				{
					id: 'summer-comiket',
					name: 'Summer Comiket 2026 (Tokyo Big Sight)',
					start: '2026-08-15T10:00',
					end: '2026-08-16T17:00'
				},
				{
					id: 'nezu-museum',
					name: 'Nezu Museum garden café (quiet gem)'
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
			activities: [
				{
					id: 'dogo-onsen-honkan',
					name: 'Dogo Onsen Honkan (Japan’s oldest hot spring)'
				},
				{
					id: 'ishiteji-cave',
					name: 'Ishite-ji Temple cave path (Shikoku 88 hidden gem)'
				},
				{
					id: 'matsuyama-castle',
					name: 'Matsuyama Castle + Botchan Train'
				},
				{
					id: 'dogo-arcade-yukata',
					name: 'Dogo shopping arcade evening stroll in yukata'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'fukuinn-takamatsu',
			kind: 'accommodation',
			name: '福宿 Fukuinn 302号室, Takamatsu',
			start: '2026-08-19T16:00',
			end: '2026-08-22T09:00',
			activities: [
				{
					id: 'ritsurin-garden',
					name: 'Ritsurin Garden (one of Japan’s finest stroll gardens)'
				},
				{
					id: 'megijima-day',
					name: 'Megijima “Oni Island” caves (quieter Setouchi gem)'
				},
				{
					id: 'naoshima-art',
					name: 'Naoshima art island day trip (Chichu / pumpkin)'
				},
				{
					id: 'noguchi-museum',
					name: 'Isamu Noguchi Garden Museum (reservation required)'
				},
				{
					id: 'sanuki-udon-crawl',
					name: 'Sanuki udon crawl around Takamatsu Station'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'toyoko-inn-tokushima',
			kind: 'accommodation',
			name: 'Toyoko Inn Tokushima eki Bizan guchi, Tokushima',
			start: '2026-08-22T16:00',
			end: '2026-08-24T09:00',
			activities: [
				{
					id: 'awa-odori-kaikan',
					name: 'Awa Odori Kaikan — try the dance year-round'
				},
				{
					id: 'mt-bizan',
					name: 'Mt Bizan ropeway sunset (steps from the hotel)'
				},
				{
					id: 'naruto-whirlpools',
					name: 'Naruto Whirlpools boat cruise (Uzushio)'
				},
				{
					id: 'tokushima-central-park',
					name: 'Tokushima Central Park & castle ruins stroll'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'meriken-port-kobe',
			kind: 'accommodation',
			name: 'Hotel Meriken Port Kobe Motomachi, Kōbe',
			start: '2026-08-24T16:00',
			end: '2026-08-26T09:00',
			activities: [
				{
					id: 'minatogawa-summer-fest',
					name: 'Minatogawa Shrine Summer Festival (lanterns & stalls)',
					start: '2026-08-24T17:00',
					end: '2026-08-26T21:00'
				},
				{
					id: 'meriken-park',
					name: 'Meriken Park & Harborland waterfront walk'
				},
				{
					id: 'nada-sake',
					name: 'Nada sake brewery district tasting (local gem)'
				},
				{
					id: 'nunobiki-herb',
					name: 'Nunobiki Herb Garden ropeway views'
				},
				{
					id: 'kitano-ijinkan',
					name: 'Kitano Ijinkan foreigner mansions'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'ibis-styles-kyoto',
			kind: 'accommodation',
			name: 'ibis Styles Kyoto Shijo, Kyōto',
			start: '2026-08-26T16:00',
			end: '2026-09-01T09:00',
			activities: [
				{
					id: 'fushimi-inari-dawn',
					name: 'Fushimi Inari at dawn (beat the crowds)'
				},
				{
					id: 'kurama-kibune',
					name: 'Kurama & Kibune mountain escape (cooler gem)'
				},
				{
					id: 'ohara-sanzenin',
					name: 'Ohara Sanzen-in moss gardens (quiet gem)'
				},
				{
					id: 'philosopher-path',
					name: 'Philosopher’s Path early morning walk'
				},
				{
					id: 'nishiki-market',
					name: 'Nishiki Market food stroll'
				},
				{
					id: 'kamogawa-evening',
					name: 'Kamogawa riverbank evening picnic'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'comfort-hotel-tanabe',
			kind: 'accommodation',
			name: 'Comfort Hotel Kii Tanabe, Tanabe',
			start: '2026-09-01T16:00',
			end: '2026-09-02T09:00',
			activities: [
				{
					id: 'tokei-jinja',
					name: 'Tokei-jinja Shrine (Kumano gateway shrine)'
				},
				{
					id: 'ajikoji-alleys',
					name: 'Ajikoji back-alley dining (local gem)'
				},
				{
					id: 'ogigahama-beach',
					name: 'Ogigahama Beach sunset walk'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'guesthouse-yata-tanabe',
			kind: 'accommodation',
			name: 'ゲストハウス八咫, Tanabe',
			start: '2026-09-02T16:00',
			end: '2026-09-03T09:00',
			activities: [
				{
					id: 'takijiri-chikatsuyu',
					name: 'Kumano Kodo: Takijiri-oji → Chikatsuyu hike'
				},
				{
					id: 'takijiri-oji',
					name: 'Takijiri-oji trailhead shrine blessing'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'cottage-kirihata-tanabe',
			kind: 'accommodation',
			name: 'Cottage Kirihata, Tanabe',
			start: '2026-09-03T16:00',
			end: '2026-09-04T09:00',
			activities: [
				{
					id: 'kumano-hongu',
					name: 'Kumano Hongu Taisha Grand Shrine'
				},
				{
					id: 'oyunohara-torii',
					name: 'Oyunohara — Japan’s largest torii gate'
				},
				{
					id: 'yunomine-onsen',
					name: 'Yunomine Onsen public bath (UNESCO gem)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'ikkyu-kobune',
			kind: 'accommodation',
			name: 'ikkyu rental vacation house, Kobune',
			start: '2026-09-04T16:00',
			end: '2026-09-05T09:00',
			activities: [
				{
					id: 'koguchi-nachi-hike',
					name: 'Kumano Kodo: Koguchi → Nachi mountain stage'
				},
				{
					id: 'hyakken-gura',
					name: 'Hyakken-gura viewpoint over the Kii mountains'
				},
				{
					id: 'kumano-river-quiet',
					name: 'Quiet Kumano River riverside evening'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'nachi-no-sato',
			kind: 'accommodation',
			name: '那智の里 Accommodation along the Kumano Kodo trail, Nachikatsuura',
			start: '2026-09-05T16:00',
			end: '2026-09-06T09:00',
			activities: [
				{
					id: 'nachi-falls-pagoda',
					name: 'Nachi Falls + Seiganto-ji pagoda viewpoint'
				},
				{
					id: 'kumano-nachi-taisha',
					name: 'Kumano Nachi Taisha Grand Shrine'
				},
				{
					id: 'daimonzaka',
					name: 'Daimonzaka cedar stone steps (pilgrim path)'
				},
				{
					id: 'katsuura-tuna-auction',
					name: 'Katsuura tuna market morning auction (hidden gem)',
					start: '2026-09-06T07:00',
					end: '2026-09-06T08:30'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'hoshi-no-yado-osaka',
			kind: 'accommodation',
			name: '星之宿今宫, Osaka',
			start: '2026-09-06T16:00',
			end: '2026-09-08T09:00',
			activities: [
				{
					id: 'hozenji-yokocho',
					name: 'Hozenji Yokocho moss-covered alley (hidden gem)'
				},
				{
					id: 'nakazakicho',
					name: 'Nakazakicho indie cafés & thrift streets'
				},
				{
					id: 'sumiyoshi-taisha',
					name: 'Sumiyoshi Taisha (off the usual tourist loop)'
				},
				{
					id: 'shinsekai-kushikatsu',
					name: 'Shinsekai kushikatsu & Tsutenkaku'
				}
			],
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
			activities: [
				{
					id: 'fukuoka-yatai',
					name: 'Hakata yatai street-food stalls at night'
				},
				{
					id: 'yanagawa-punting',
					name: 'Yanagawa river punting day trip (hidden gem)'
				},
				{
					id: 'dazaifu-tenmangu',
					name: 'Dazaifu Tenmangu & Kyushu National Museum'
				},
				{
					id: 'ohori-park',
					name: 'Ohori Park lakeside walk'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'grand-residence-tenjin',
			kind: 'accommodation',
			name: 'Grand Residence Hotel Tenjin, Fukuoka',
			start: '2026-09-11T16:00',
			end: '2026-09-12T09:00',
			activities: [
				{
					id: 'hojoya-opening',
					name: 'Hojoya Festival opening night at Hakozakigu',
					start: '2026-09-12T10:00',
					end: '2026-09-12T21:00'
				},
				{
					id: 'tenjin-evening',
					name: 'Tenjin underground shopping & evening wander'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'simple-stay-beppu',
			kind: 'accommodation',
			name: 'Simple Stay Beppu, Beppu',
			start: '2026-09-12T16:00',
			end: '2026-09-14T09:00',
			activities: [
				{
					id: 'jigoku-meguri',
					name: 'Beppu Jigoku Meguri (Seven Hells tour)'
				},
				{
					id: 'takegawara-sand',
					name: 'Takegawara Onsen sand bath'
				},
				{
					id: 'kannawa-steam',
					name: 'Kannawa steam-cooked jigoku-mushi lunch'
				},
				{
					id: 'yufuin-day',
					name: 'Yufuin village day trip (quieter onsen town)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'shijin-minami-aso',
			kind: 'accommodation',
			name: '阿蘇山麓のヴィラShijin南阿蘇, Minami Aso',
			start: '2026-09-14T16:00',
			end: '2026-09-16T09:00',
			activities: [
				{
					id: 'kusasenri',
					name: 'Kusasenri grasslands & grazing horses'
				},
				{
					id: 'nakadake-crater',
					name: 'Aso Nakadake crater viewpoint'
				},
				{
					id: 'kurokawa-onsen',
					name: 'Kurokawa Onsen village day trip (hidden gem)'
				},
				{
					id: 'minami-aso-railway',
					name: 'Minami-Aso Railway scenic ride'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'fav-kumamoto',
			kind: 'accommodation',
			name: 'fav KUMAMOTO, Kumamoto',
			start: '2026-09-16T16:00',
			end: '2026-09-17T09:00',
			activities: [
				{
					id: 'kumamoto-castle',
					name: 'Kumamoto Castle grounds at dusk'
				},
				{
					id: 'suizenji-jojuen',
					name: 'Suizenji Jojuen landscape garden'
				},
				{
					id: 'kumamoto-ramen',
					name: 'Kumamoto tonkotsu ramen crawl (local gem)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'zee-haven-nagasaki',
			kind: 'accommodation',
			name: 'Zee Haven nagasakiekimae – ZEE HAVEN長崎駅前, Nagasaki',
			start: '2026-09-17T16:00',
			end: '2026-09-19T09:00',
			activities: [
				{
					id: 'gunkanjima',
					name: 'Gunkanjima (Battleship Island) boat tour'
				},
				{
					id: 'mt-inasa-night',
					name: 'Mt Inasa night view (one of Japan’s three best)'
				},
				{
					id: 'sotome-churches',
					name: 'Sotome Hidden Christian sites (UNESCO gem)'
				},
				{
					id: 'dejima-teramachi',
					name: 'Dejima & Teramachi temple walk'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'lotus-village-fukuoka',
			kind: 'accommodation',
			name: 'ロータスヴィレッジ, Fukuoka',
			start: '2026-09-19T16:00',
			end: '2026-09-21T09:00',
			activities: [
				{
					id: 'isla-de-salsa',
					name: 'ISLA DE SALSA 2026 on Nokonoshima Island',
					start: '2026-09-19T12:00',
					end: '2026-09-19T21:00'
				},
				{
					id: 'nokonoshima-park',
					name: 'Nokonoshima Island Park flower fields'
				},
				{
					id: 'itoshima-coast',
					name: 'Itoshima coastline cafés & beaches (hidden gem)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'b-hotel-hiroshima',
			kind: 'accommodation',
			name: 'b hotel Heiwaodori 601, Hiroshima',
			start: '2026-09-21T16:00',
			end: '2026-09-24T09:00',
			activities: [
				{
					id: 'peace-memorial',
					name: 'Peace Memorial Park & Museum'
				},
				{
					id: 'miyajima-day',
					name: 'Miyajima — Itsukushima Shrine & Mt Misen'
				},
				{
					id: 'mitaki-dera',
					name: 'Mitaki-dera waterfall temple (quiet gem)'
				},
				{
					id: 'shukkeien',
					name: 'Shukkeien Garden stroll'
				},
				{
					id: 'okonomimura',
					name: 'Okonomimura okonomiyaki floors'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'grand-base-kurashiki',
			kind: 'accommodation',
			name: 'GRAND BASE Kurashiki Chuo, Kurashiki',
			start: '2026-09-24T16:00',
			end: '2026-09-26T09:00',
			activities: [
				{
					id: 'heartland-kurashiki',
					name: 'Heartland Kurashiki canal light-up',
					start: '2026-09-24T18:00',
					end: '2026-09-26T21:00'
				},
				{
					id: 'bikan-quarter',
					name: 'Bikan Historical Quarter white-wall stroll'
				},
				{
					id: 'ohara-museum',
					name: 'Ohara Museum of Art'
				},
				{
					id: 'kurashiki-canal-boat',
					name: 'Kurashiki canal boat ride'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'wayfarer-matsu-osaka',
			kind: 'accommodation',
			name: 'WAYFARER Matsu, Osaka',
			start: '2026-09-26T16:00',
			end: '2026-10-01T09:00',
			activities: [
				{
					id: 'tsukimi-moon',
					name: 'Tsukimi harvest-moon viewing (Jūgoya was Sep 25)',
					start: '2026-09-26T19:00',
					end: '2026-09-27T21:00'
				},
				{
					id: 'usj-halloween',
					name: 'USJ Halloween Horror Nights (season open)',
					start: '2026-09-26T17:00',
					end: '2026-09-30T22:00'
				},
				{
					id: 'minoo-falls',
					name: 'Minoo Park waterfall hike (autumn gem)'
				},
				{
					id: 'tenjinbashisuji',
					name: 'Tenjinbashisuji shopping street (local life)'
				},
				{
					id: 'osaka-castle-park',
					name: 'Osaka Castle Park morning walk'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'gee-haive-mishima',
			kind: 'accommodation',
			name: 'Hotel Gee Haive, Mishima',
			start: '2026-10-01T16:00',
			end: '2026-10-02T09:00',
			activities: [
				{
					id: 'genbei-river',
					name: 'Genbei River clear-stream walk through town'
				},
				{
					id: 'mishima-taisha',
					name: 'Mishima Taisha Shrine'
				},
				{
					id: 'mishima-skywalk',
					name: 'Mishima Skywalk — longest pedestrian bridge in Japan'
				},
				{
					id: 'rakujuen',
					name: 'Rakujuen Park & small aquarium'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'villa-omodaka-oguchi',
			kind: 'accommodation',
			name: '一棟貸しVilla OMODAKA, Oguchi',
			start: '2026-10-02T16:00',
			end: '2026-10-04T09:00',
			activities: [
				{
					id: 'hakone-loop',
					name: 'Hakone loop — ropeway, Owakudani & Lake Ashi'
				},
				{
					id: 'hakone-open-air',
					name: 'Hakone Open-Air Museum sculpture park'
				},
				{
					id: 'gotemba-fuji-view',
					name: 'Gotemba Fuji viewpoint & Premium Outlets'
				},
				{
					id: 'shuzenji-onsen',
					name: 'Shuzenji Onsen village (Izu hidden gem)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'view-odawara',
			kind: 'accommodation',
			name: 'THE VIEW Odawara shiro-no mieru hotel – Vacation STAY 53335v, Odawara',
			start: '2026-10-04T16:00',
			end: '2026-10-05T09:00',
			activities: [
				{
					id: 'odawara-castle',
					name: 'Odawara Castle & castle-view from the hotel'
				},
				{
					id: 'odawara-kamaboko',
					name: 'Odawara fishing port & kamaboko tasting'
				},
				{
					id: 'soga-plum-park',
					name: 'Soga Plum Forest Park stroll (local gem)'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'skytreehouse-sumida',
			kind: 'accommodation',
			name: 'Airbnb SkytreeHouse 東向島, Sumida City / Tokyo',
			start: '2026-10-05T16:00',
			end: '2026-10-11T09:00',
			activities: [
				{
					id: 'mukojima-hyakkaen',
					name: 'Mukojima Hyakkaen garden (Edo-era flower gem)'
				},
				{
					id: 'shimokitazawa-curry',
					name: 'Shimokitazawa Curry Festival',
					start: '2026-10-09T11:00',
					end: '2026-10-11T20:00'
				},
				{
					id: 'asakusa-dawn',
					name: 'Asakusa Senso-ji at dawn'
				},
				{
					id: 'kappabashi',
					name: 'Kappabashi kitchen-town wander'
				},
				{
					id: 'kyu-yasuda-garden',
					name: 'Kyu-Yasuda Garden (quiet Sumida gem)'
				},
				{
					id: 'sumida-aquarium',
					name: 'Sumida Aquarium under Skytree'
				}
			],
			bookingUrl: ''
		},
		{
			id: 'hedistar-narita',
			kind: 'accommodation',
			name: 'The Hedistar Hotel Narita, Narita',
			start: '2026-10-11T16:00',
			end: '2026-10-13T09:00',
			activities: [
				{
					id: 'naritasan',
					name: 'Naritasan Shinsho-ji temple approach'
				},
				{
					id: 'narita-omotesando',
					name: 'Narita Omotesando unagi & street snacks'
				},
				{
					id: 'sawara-little-edo',
					name: 'Sawara “Little Edo” canal town (hidden gem)'
				}
			],
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
