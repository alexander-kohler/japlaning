/** Prefecture metadata matching Geolonia japanese-prefectures data-code values. */
export type Prefecture = {
	code: string;
	ja: string;
	en: string;
	slug: string;
};

export const PREFECTURES: Prefecture[] = [
	{ code: '1', ja: '北海道', en: 'Hokkaido', slug: 'hokkaido' },
	{ code: '2', ja: '青森', en: 'Aomori', slug: 'aomori' },
	{ code: '3', ja: '岩手', en: 'Iwate', slug: 'iwate' },
	{ code: '4', ja: '宮城', en: 'Miyagi', slug: 'miyagi' },
	{ code: '5', ja: '秋田', en: 'Akita', slug: 'akita' },
	{ code: '6', ja: '山形', en: 'Yamagata', slug: 'yamagata' },
	{ code: '7', ja: '福島', en: 'Fukushima', slug: 'fukushima' },
	{ code: '8', ja: '茨城', en: 'Ibaraki', slug: 'ibaraki' },
	{ code: '9', ja: '栃木', en: 'Tochigi', slug: 'tochigi' },
	{ code: '10', ja: '群馬', en: 'Gunma', slug: 'gunma' },
	{ code: '11', ja: '埼玉', en: 'Saitama', slug: 'saitama' },
	{ code: '12', ja: '千葉', en: 'Chiba', slug: 'chiba' },
	{ code: '13', ja: '東京', en: 'Tokyo', slug: 'tokyo' },
	{ code: '14', ja: '神奈川', en: 'Kanagawa', slug: 'kanagawa' },
	{ code: '15', ja: '新潟', en: 'Niigata', slug: 'niigata' },
	{ code: '16', ja: '富山', en: 'Toyama', slug: 'toyama' },
	{ code: '17', ja: '石川', en: 'Ishikawa', slug: 'ishikawa' },
	{ code: '18', ja: '福井', en: 'Fukui', slug: 'fukui' },
	{ code: '19', ja: '山梨', en: 'Yamanashi', slug: 'yamanashi' },
	{ code: '20', ja: '長野', en: 'Nagano', slug: 'nagano' },
	{ code: '21', ja: '岐阜', en: 'Gifu', slug: 'gifu' },
	{ code: '22', ja: '静岡', en: 'Shizuoka', slug: 'shizuoka' },
	{ code: '23', ja: '愛知', en: 'Aichi', slug: 'aichi' },
	{ code: '24', ja: '三重', en: 'Mie', slug: 'mie' },
	{ code: '25', ja: '滋賀', en: 'Shiga', slug: 'shiga' },
	{ code: '26', ja: '京都', en: 'Kyoto', slug: 'kyoto' },
	{ code: '27', ja: '大阪', en: 'Osaka', slug: 'osaka' },
	{ code: '28', ja: '兵庫', en: 'Hyogo', slug: 'hyogo' },
	{ code: '29', ja: '奈良', en: 'Nara', slug: 'nara' },
	{ code: '30', ja: '和歌山', en: 'Wakayama', slug: 'wakayama' },
	{ code: '31', ja: '鳥取', en: 'Tottori', slug: 'tottori' },
	{ code: '32', ja: '島根', en: 'Shimane', slug: 'shimane' },
	{ code: '33', ja: '岡山', en: 'Okayama', slug: 'okayama' },
	{ code: '34', ja: '広島', en: 'Hiroshima', slug: 'hiroshima' },
	{ code: '35', ja: '山口', en: 'Yamaguchi', slug: 'yamaguchi' },
	{ code: '36', ja: '徳島', en: 'Tokushima', slug: 'tokushima' },
	{ code: '37', ja: '香川', en: 'Kagawa', slug: 'kagawa' },
	{ code: '38', ja: '愛媛', en: 'Ehime', slug: 'ehime' },
	{ code: '39', ja: '高知', en: 'Kochi', slug: 'kochi' },
	{ code: '40', ja: '福岡', en: 'Fukuoka', slug: 'fukuoka' },
	{ code: '41', ja: '佐賀', en: 'Saga', slug: 'saga' },
	{ code: '42', ja: '長崎', en: 'Nagasaki', slug: 'nagasaki' },
	{ code: '43', ja: '熊本', en: 'Kumamoto', slug: 'kumamoto' },
	{ code: '44', ja: '大分', en: 'Oita', slug: 'oita' },
	{ code: '45', ja: '宮崎', en: 'Miyazaki', slug: 'miyazaki' },
	{ code: '46', ja: '鹿児島', en: 'Kagoshima', slug: 'kagoshima' },
	{ code: '47', ja: '沖縄', en: 'Okinawa', slug: 'okinawa' }
];

export const PREFECTURE_COUNT = PREFECTURES.length;

const byCode = new Map(PREFECTURES.map((p) => [p.code, p]));

export function getPrefecture(code: string): Prefecture | undefined {
	return byCode.get(code);
}
