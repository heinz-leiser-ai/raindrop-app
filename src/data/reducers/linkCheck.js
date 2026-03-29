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
	LINK_CHECK_DISMISS,
	LINK_CHECK_RUNS_REQ,
	LINK_CHECK_RUNS_SUCCESS,
	LINK_CHECK_CANCEL_SUCCESS,
	LINK_CHECK_CLEAN_RUNS_SUCCESS
} from '../constants/linkCheck'

const initialState = Immutable({
	status: 'idle',
	total: 0,
	checked: 0,
	brokenCount: 0,
	runId: null,
	showResult: false,
	journal: [],
	journalLoading: false,
	runs: [],
	runsLoading: false
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

	case LINK_CHECK_RUNS_REQ:
		return state.merge({ runsLoading: true })

	case LINK_CHECK_RUNS_SUCCESS:
		return state.merge({ runs: action.runs, runsLoading: false })

	case LINK_CHECK_CANCEL_SUCCESS:
		return state.merge({
			runs: state.runs.map(r => r.id === action.runId ? { ...r, status: 'cancelled' } : r),
			status: state.runId === action.runId ? 'cancelled' : state.status
		})

	case LINK_CHECK_CLEAN_RUNS_SUCCESS:
		return state.merge({
			runs: state.runs.filter(r => r.status !== 'failed' && r.status !== 'cancelled')
		})

	case 'RESET':
		return initialState

	default:
		return state
}}
