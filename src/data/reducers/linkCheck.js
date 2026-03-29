import Immutable from 'seamless-immutable'
import {
	LINK_CHECK_START_REQ,
	LINK_CHECK_START_SUCCESS,
	LINK_CHECK_START_ERROR,
	LINK_CHECK_STATUS_SUCCESS,
	LINK_CHECK_STATUS_ERROR,
	LINK_CHECK_JOURNAL_REQ,
	LINK_CHECK_JOURNAL_SUCCESS,
	LINK_CHECK_JOURNAL_CLEAR_SUCCESS,
	LINK_CHECK_DISMISS
} from '../constants/linkCheck'

const initialState = Immutable({
	status: 'idle',
	total: 0,
	checked: 0,
	brokenCount: 0,
	runId: null,
	showResult: false,
	journal: [],
	journalLoading: false
})

export default function(state = initialState, action){switch (action.type) {
	case LINK_CHECK_START_REQ:
		return state.merge({ status: 'running', total: 0, checked: 0, brokenCount: 0, showResult: false })

	case LINK_CHECK_START_SUCCESS:
		return state.merge({ status: 'running', runId: action.runId, total: action.total || 0 })

	case LINK_CHECK_START_ERROR:
	case LINK_CHECK_STATUS_ERROR:
		return state.merge({ status: 'failed', showResult: true })

	case LINK_CHECK_STATUS_SUCCESS:
		return state.merge({
			status: action.status,
			total: action.total,
			checked: action.checked,
			brokenCount: action.brokenCount,
			showResult: action.status === 'completed' || action.status === 'failed'
		})

	case LINK_CHECK_JOURNAL_REQ:
		return state.merge({ journalLoading: true })

	case LINK_CHECK_JOURNAL_SUCCESS:
		return state.merge({ journal: action.items, journalLoading: false })

	case LINK_CHECK_JOURNAL_CLEAR_SUCCESS:
		return state.merge({ journal: [] })

	case LINK_CHECK_DISMISS:
		return state.merge({ showResult: false, status: 'idle' })

	case 'RESET':
		return initialState

	default:
		return state
}}
