import { call, put, takeEvery, delay, select } from 'redux-saga/effects'
import Api from '../modules/api'

import {
	LINK_CHECK_START_REQ,
	LINK_CHECK_START_SUCCESS,
	LINK_CHECK_START_ERROR,
	LINK_CHECK_STATUS_REQ,
	LINK_CHECK_STATUS_SUCCESS,
	LINK_CHECK_STATUS_ERROR,
	LINK_CHECK_JOURNAL_REQ,
	LINK_CHECK_JOURNAL_SUCCESS,
	LINK_CHECK_JOURNAL_ERROR,
	LINK_CHECK_JOURNAL_CLEAR_REQ,
	LINK_CHECK_JOURNAL_CLEAR_SUCCESS,
	LINK_CHECK_JOURNAL_CLEAR_ERROR
} from '../constants/linkCheck'

const LINK_CHECK_BASE = 'link-check/'

export default function* () {
	yield takeEvery(LINK_CHECK_START_REQ, startCheck)
	yield takeEvery(LINK_CHECK_STATUS_REQ, fetchStatus)
	yield takeEvery(LINK_CHECK_JOURNAL_REQ, fetchJournal)
	yield takeEvery(LINK_CHECK_JOURNAL_CLEAR_REQ, clearJournal)
}

function* startCheck() {
	try {
		const { config: { broken_level } } = yield select()
		const res = yield call(Api.post, LINK_CHECK_BASE + 'start', { broken_level })

		yield put({ type: LINK_CHECK_START_SUCCESS, runId: res.runId, total: res.total })

		yield call(pollStatus, res.runId)
	} catch (error) {
		yield put({ type: LINK_CHECK_START_ERROR, error })
	}
}

function* pollStatus(runId) {
	while (true) {
		yield delay(3000)

		try {
			const res = yield call(Api.get, LINK_CHECK_BASE + 'status?runId=' + runId)

			yield put({
				type: LINK_CHECK_STATUS_SUCCESS,
				status: res.status,
				total: res.total,
				checked: res.checked,
				brokenCount: res.brokenCount
			})

			if (res.status === 'completed' || res.status === 'failed') break
		} catch (error) {
			yield put({ type: LINK_CHECK_STATUS_ERROR, error })
			break
		}
	}
}

function* fetchStatus() {
	try {
		const res = yield call(Api.get, LINK_CHECK_BASE + 'status')
		yield put({
			type: LINK_CHECK_STATUS_SUCCESS,
			status: res.status,
			total: res.total,
			checked: res.checked,
			brokenCount: res.brokenCount
		})
	} catch (error) {
		yield put({ type: LINK_CHECK_STATUS_ERROR, error })
	}
}

function* fetchJournal() {
	try {
		const res = yield call(Api.get, LINK_CHECK_BASE + 'journal')
		yield put({ type: LINK_CHECK_JOURNAL_SUCCESS, items: res.items || [] })
	} catch (error) {
		yield put({ type: LINK_CHECK_JOURNAL_ERROR, error })
	}
}

function* clearJournal() {
	try {
		yield call(Api.del, LINK_CHECK_BASE + 'journal')
		yield put({ type: LINK_CHECK_JOURNAL_CLEAR_SUCCESS })
	} catch (error) {
		yield put({ type: LINK_CHECK_JOURNAL_CLEAR_ERROR, error })
	}
}
