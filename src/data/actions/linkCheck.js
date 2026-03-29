import {
	LINK_CHECK_START_REQ,
	LINK_CHECK_STATUS_REQ,
	LINK_CHECK_JOURNAL_REQ,
	LINK_CHECK_JOURNAL_CLEAR_REQ,
	LINK_CHECK_DISMISS
} from '../constants/linkCheck'

export const start = ()=>({
	type: LINK_CHECK_START_REQ
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
