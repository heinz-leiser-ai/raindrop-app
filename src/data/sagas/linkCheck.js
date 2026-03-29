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
	LINK_CHECK_JOURNAL_CLEAR_ERROR,
	LINK_CHECK_RUNS_REQ,
	LINK_CHECK_RUNS_SUCCESS,
	LINK_CHECK_RUNS_ERROR,
	LINK_CHECK_CANCEL_REQ,
	LINK_CHECK_CANCEL_SUCCESS,
	LINK_CHECK_CANCEL_ERROR,
	LINK_CHECK_CLEAN_RUNS_REQ,
	LINK_CHECK_CLEAN_RUNS_SUCCESS,
	LINK_CHECK_CLEAN_RUNS_ERROR
} from '../constants/linkCheck'

const LINK_CHECK_BASE = 'link-check/'

export default function* () {
	yield takeEvery(LINK_CHECK_START_REQ, startCheck)
	yield takeEvery(LINK_CHECK_STATUS_REQ, fetchStatus)
	yield takeEvery(LINK_CHECK_JOURNAL_REQ, fetchJournal)
	yield takeEvery(LINK_CHECK_JOURNAL_CLEAR_REQ, clearJournal)
	yield takeEvery(LINK_CHECK_RUNS_REQ, fetchRuns)
	yield takeEvery(LINK_CHECK_CANCEL_REQ, cancelRun)
	yield takeEvery(LINK_CHECK_CLEAN_RUNS_REQ, cleanRuns)
}

function* startCheck({ collectionId }) {
	try {
		const state = yield select()
		const { config: { broken_level, link_check_skip_days } } = state
		const body = { broken_level, skip_days: link_check_skip_days ?? 2 }

		if (collectionId && collectionId > 0) {
			const items = state.collections.items
			const sorted = Object.values(items).sort((a, b) => (a.sort || 0) - (b.sort || 0))
			const collectIds = (parentId) => {
				const ids = [parentId]
				sorted.forEach(c => { if (c.parentId == parentId) ids.push(...collectIds(c._id)) })
				return ids
			}
			body.collection_ids = collectIds(collectionId)
		}

		const res = yield call(Api.post, LINK_CHECK_BASE + 'start', body)

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

			if (res.status === 'completed' || res.status === 'failed' || res.status === 'cancelled') break
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

		if (res.status === 'running' && res.runId)
			yield call(pollStatus, res.runId)
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

function* fetchRuns() {
	try {
		const res = yield call(Api.get, LINK_CHECK_BASE + 'runs')
		yield put({ type: LINK_CHECK_RUNS_SUCCESS, runs: res.runs || [] })
	} catch (error) {
		yield put({ type: LINK_CHECK_RUNS_ERROR, error })
	}
}

function* cancelRun({ runId }) {
	try {
		yield call(Api.post, LINK_CHECK_BASE + 'cancel', { runId })
		yield put({ type: LINK_CHECK_CANCEL_SUCCESS, runId })
	} catch (error) {
		yield put({ type: LINK_CHECK_CANCEL_ERROR, error })
	}
}

function* cleanRuns() {
	try {
		yield call(Api.del, LINK_CHECK_BASE + 'runs')
		yield put({ type: LINK_CHECK_CLEAN_RUNS_SUCCESS })
	} catch (error) {
		yield put({ type: LINK_CHECK_CLEAN_RUNS_ERROR, error })
	}
}
