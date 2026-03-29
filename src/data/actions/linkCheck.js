import {
	LINK_CHECK_START_REQ,
	LINK_CHECK_STATUS_REQ,
	LINK_CHECK_JOURNAL_REQ,
	LINK_CHECK_JOURNAL_CLEAR_REQ,
	LINK_CHECK_DISMISS,
	LINK_CHECK_RUNS_REQ,
	LINK_CHECK_CANCEL_REQ,
	LINK_CHECK_CLEAN_RUNS_REQ
} from '../constants/linkCheck'

export const start = (collectionId)=>({
	type: LINK_CHECK_START_REQ,
	collectionId
})

export const getStatus = ()=>({
	type: LINK_CHECK_STATUS_REQ
})

export const getJournal = ()=>({
	type: LINK_CHECK_JOURNAL_REQ
})

export const clearJournal = ()=>({
	type: LINK_CHECK_JOURNAL_CLEAR_REQ
})

export const dismiss = ()=>({
	type: LINK_CHECK_DISMISS
})

export const getRuns = ()=>({
	type: LINK_CHECK_RUNS_REQ
})

export const cancelRun = (runId)=>({
	type: LINK_CHECK_CANCEL_REQ,
	runId
})

export const cleanRuns = ()=>({
	type: LINK_CHECK_CLEAN_RUNS_REQ
})
