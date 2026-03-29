import Immutable from 'seamless-immutable'
import {
	MOVE_JOURNAL_LOAD_REQ,
	MOVE_JOURNAL_LOAD_SUCCESS,
	MOVE_JOURNAL_LOAD_ERROR,
	MOVE_JOURNAL_LOAD_MORE_REQ,
	MOVE_JOURNAL_LOAD_MORE_SUCCESS,
	MOVE_JOURNAL_LOAD_MORE_ERROR,
	MOVE_JOURNAL_UNDO_SUCCESS,
	MOVE_JOURNAL_CLEAR_SUCCESS
} from '../constants/moveJournal'

const initialState = Immutable({
	status: 'idle',
	items: [],
	hasMore: false,
	page: 0
})

export default function(state = initialState, action){switch (action.type) {
	case MOVE_JOURNAL_LOAD_REQ:
		return state.merge({ status: 'loading' })

	case MOVE_JOURNAL_LOAD_SUCCESS:
		return state.merge({
			status: 'loaded',
			items: action.items,
			hasMore: action.hasMore,
			page: 0
		})

	case MOVE_JOURNAL_LOAD_ERROR:
		return state.merge({ status: 'error' })

	case MOVE_JOURNAL_LOAD_MORE_REQ:
		return state.merge({ status: 'loading' })

	case MOVE_JOURNAL_LOAD_MORE_SUCCESS:
		return state.merge({
			status: 'loaded',
			items: state.items.concat(action.items),
			hasMore: action.hasMore,
			page: state.page + 1
		})

	case MOVE_JOURNAL_LOAD_MORE_ERROR:
		return state.merge({ status: 'error' })

	case MOVE_JOURNAL_UNDO_SUCCESS:
		return state.merge({
			items: state.items.map(item =>
				item.id === action.id ? { ...item, undone: true } : item
			)
		})

	case MOVE_JOURNAL_CLEAR_SUCCESS:
		return state.merge({ items: [], hasMore: false, page: 0 })

	case 'RESET':
		return initialState

	default:
		return state
}}
