import { call, put, takeEvery, select } from 'redux-saga/effects'
import Api from '../modules/api'

import {
	MOVE_JOURNAL_LOAD_REQ,
	MOVE_JOURNAL_LOAD_SUCCESS,
	MOVE_JOURNAL_LOAD_ERROR,
	MOVE_JOURNAL_LOAD_MORE_REQ,
	MOVE_JOURNAL_LOAD_MORE_SUCCESS,
	MOVE_JOURNAL_LOAD_MORE_ERROR,
	MOVE_JOURNAL_UNDO_REQ,
	MOVE_JOURNAL_UNDO_SUCCESS,
	MOVE_JOURNAL_UNDO_ERROR,
	MOVE_JOURNAL_CLEAR_REQ,
	MOVE_JOURNAL_CLEAR_SUCCESS,
	MOVE_JOURNAL_CLEAR_ERROR
} from '../constants/moveJournal'

const BASE = 'move-journal'
const PER_PAGE = 50

export default function* () {
	yield takeEvery(MOVE_JOURNAL_LOAD_REQ, loadJournal)
	yield takeEvery(MOVE_JOURNAL_LOAD_MORE_REQ, loadMore)
	yield takeEvery(MOVE_JOURNAL_UNDO_REQ, undoEntry)
	yield takeEvery(MOVE_JOURNAL_CLEAR_REQ, clearJournal)
}

function* loadJournal() {
	try {
		const res = yield call(Api.get, `${BASE}?page=0&perpage=${PER_PAGE}`)
		yield put({ type: MOVE_JOURNAL_LOAD_SUCCESS, items: res.items || [], hasMore: res.hasMore || false })
	} catch (error) {
		yield put({ type: MOVE_JOURNAL_LOAD_ERROR, error })
	}
}

function* loadMore() {
	try {
		const { page } = yield select(state => state.moveJournal)
		const nextPage = page + 1
		const res = yield call(Api.get, `${BASE}?page=${nextPage}&perpage=${PER_PAGE}`)
		yield put({ type: MOVE_JOURNAL_LOAD_MORE_SUCCESS, items: res.items || [], hasMore: res.hasMore || false })
	} catch (error) {
		yield put({ type: MOVE_JOURNAL_LOAD_MORE_ERROR, error })
	}
}

function* undoEntry({ id }) {
	try {
		yield call(Api.post, `${BASE}/undo/${id}`)
		yield put({ type: MOVE_JOURNAL_UNDO_SUCCESS, id })
		yield put({ type: MOVE_JOURNAL_LOAD_REQ })
	} catch (error) {
		yield put({ type: MOVE_JOURNAL_UNDO_ERROR, error, id })
	}
}

function* clearJournal() {
	try {
		yield call(Api.del, BASE)
		yield put({ type: MOVE_JOURNAL_CLEAR_SUCCESS })
	} catch (error) {
		yield put({ type: MOVE_JOURNAL_CLEAR_ERROR, error })
	}
}
