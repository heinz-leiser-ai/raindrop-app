import { call, put, takeLatest } from 'redux-saga/effects'
import Api from '../modules/api'
import {
	COVERS_LOAD_REQ, COVERS_LOAD_SUCCESS
} from '../constants/covers'

//Requests
export default function* () {
	yield takeLatest([
		COVERS_LOAD_REQ
	], load)
}

function* load({ ignore=false, query='' }) {
	if (ignore)
		return;

	try {
		const { items=[] } = yield call(Api.get, `collections/covers/${encodeURIComponent(query.trim())}`)
		const safeItems = Array.isArray(items) && items.length ? items : getFallbackCoverItems(query)

		yield put({
			type: COVERS_LOAD_SUCCESS,
			items: safeItems
		});
	} catch (error) {
		yield put({
			type: COVERS_LOAD_SUCCESS,
			items: getFallbackCoverItems(query)
		});
	}
}

function getFallbackCoverItems(query='') {
	const q = String(query || '').trim().toLowerCase()

	const templates = [
		{ title: 'Allgemein', emojis: ['folder', 'open_file_folder', 'bookmark_tabs', 'label', 'card_index_dividers', 'star', 'bulb', 'paperclip'] },
		{ title: 'Arbeit', emojis: ['briefcase', 'calendar', 'memo', 'bar_chart', 'chart_with_upwards_trend', 'moneybag', 'telephone_receiver', 'handshake'] },
		{ title: 'Lernen', emojis: ['books', 'notebook', 'mortar_board', 'microscope', 'test_tube', 'abacus', 'brain', 'keyboard'] },
		{ title: 'Shopping', emojis: ['shopping_bags', 'shopping_cart', 'credit_card', 'receipt', 'gift', 'package', 'truck', 'hammer_and_wrench'] },
		{ title: 'Tech', emojis: ['desktop_computer', 'laptop', 'mobile_phone', 'satellite_antenna', 'electric_plug', 'gear', 'shield', 'robot'] },
		{ title: 'Medien', emojis: ['movie_camera', 'musical_note', 'headphones', 'camera', 'video_camera', 'microphone', 'game_die', 'joystick'] },
		{ title: 'Reisen', emojis: ['world_map', 'airplane', 'train2', 'car', 'compass', 'beach_with_umbrella', 'camping', 'hotel'] },
		{ title: 'Gesundheit', emojis: ['pill', 'stethoscope', 'hospital', 'apple', 'carrot', 'soccer', 'running_shirt_with_sash', 'person_lifting_weights'] }
	]

	const filtered = q ?
		templates.filter(({ title, emojis=[] })=>
			title.toLowerCase().includes(q) ||
			emojis.some(name=>name.includes(q.replace(/\s+/g, '_')))
		) :
		templates

	return filtered.map(({ title, emojis=[] })=>({
		title,
		icons: emojis.map(name=>({
			png: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${emojiNameToCodepoint(name)}.png`
		}))
	}))
}

function emojiNameToCodepoint(name='') {
	const map = {
		folder: '1f4c1',
		open_file_folder: '1f4c2',
		bookmark_tabs: '1f4d1',
		label: '1f3f7',
		card_index_dividers: '1f5c2',
		star: '2b50',
		bulb: '1f4a1',
		paperclip: '1f4ce',
		briefcase: '1f4bc',
		calendar: '1f4c5',
		memo: '1f4dd',
		bar_chart: '1f4ca',
		chart_with_upwards_trend: '1f4c8',
		moneybag: '1f4b0',
		telephone_receiver: '1f4de',
		handshake: '1f91d',
		books: '1f4da',
		notebook: '1f4d3',
		mortar_board: '1f393',
		microscope: '1f52c',
		test_tube: '1f9ea',
		abacus: '1f9ee',
		brain: '1f9e0',
		keyboard: '2328',
		shopping_bags: '1f6cd',
		shopping_cart: '1f6d2',
		credit_card: '1f4b3',
		receipt: '1f9fe',
		gift: '1f381',
		package: '1f4e6',
		truck: '1f69a',
		hammer_and_wrench: '1f6e0',
		desktop_computer: '1f5a5',
		laptop: '1f4bb',
		mobile_phone: '1f4f1',
		satellite_antenna: '1f4e1',
		electric_plug: '1f50c',
		gear: '2699',
		shield: '1f6e1',
		robot: '1f916',
		movie_camera: '1f3a5',
		musical_note: '1f3b5',
		headphones: '1f3a7',
		camera: '1f4f7',
		video_camera: '1f4f9',
		microphone: '1f3a4',
		game_die: '1f3b2',
		joystick: '1f579',
		world_map: '1f5fa',
		airplane: '2708',
		train2: '1f686',
		car: '1f697',
		compass: '1f9ed',
		beach_with_umbrella: '1f3d6',
		camping: '1f3d5',
		hotel: '1f3e8',
		pill: '1f48a',
		stethoscope: '1fa7a',
		hospital: '1f3e5',
		apple: '1f34e',
		carrot: '1f955',
		soccer: '26bd',
		running_shirt_with_sash: '1f3bd',
		person_lifting_weights: '1f3cb'
	}

	return map[name] || '1f4cc'
}