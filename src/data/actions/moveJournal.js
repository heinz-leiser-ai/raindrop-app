import {
	MOVE_JOURNAL_LOAD_REQ,
	MOVE_JOURNAL_LOAD_MORE_REQ,
	MOVE_JOURNAL_UNDO_REQ,
	MOVE_JOURNAL_CLEAR_REQ
} from '../constants/moveJournal'

export const load = ()=>({
	type: MOVE_JOURNAL_LOAD_REQ
})

export const loadMore = ()=>({
	type: MOVE_JOURNAL_LOAD_MORE_REQ
})

export const undo = (id)=>({
	type: MOVE_JOURNAL_UNDO_REQ,
	id
})

export const clear = ()=>({
	type: MOVE_JOURNAL_CLEAR_REQ
})
