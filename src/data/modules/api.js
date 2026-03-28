import { delay, race, call } from 'redux-saga/effects'
import { runSaga } from 'redux-saga'
import { 
	API_ENDPOINT_URL,
	APP_BASE_URL,
	API_RETRIES,
	API_TIMEOUT
} from '../constants/app'
import ApiError from './error'
import { getAuthHeaderObject, runRefreshIfNeeded } from './authSession'

function mergeFetchOptions(options = {}) {
	const authHeaders = getAuthHeaderObject()
	return {
		...options,
		headers: {
			...(options.headers || {}),
			...authHeaders,
		},
	}
}

function shouldTryRefresh401(url) {
	if (url.includes('auth/refresh')) return false
	if (url.includes('auth/email/login')) return false
	if (url.includes('auth/email/signup')) return false
	if (url.includes('auth/jwt')) return false
	if (url.includes('auth/email/lost')) return false
	if (url.includes('auth/email/recover')) return false
	return true
}

function rawFetch(url, options) {
	return fetch(url, options)
}

function* fetchWithOptionalRefresh(finalURL, relativePath, options) {
	const base = mergeFetchOptions({ ...defaultOptions, ...options })
	let res = yield call(rawFetch, finalURL, base)

	if (
		res.status === 401 &&
		!options._authRetried &&
		shouldTryRefresh401(relativePath)
	) {
		const refreshed = yield call(runRefreshIfNeeded)
		if (refreshed) {
			const retryOpts = mergeFetchOptions({
				...defaultOptions,
				...options,
				_authRetried: true,
			})
			res = yield call(rawFetch, finalURL, retryOpts)
		}
	}

	if (res.status < 200 || res.status >= 300) {
		throw new ApiError({ status: res.status, errorMessage: 'fail_fetch_status' })
	}
	return res
}

function* get(url, overrideOptions={}) {
	const res = yield req(url, overrideOptions, API_RETRIES)

	var json = {}
	if (res.headers){
		const contentType = (res.headers.get('Content-Type')||'').toLowerCase()

		if (contentType.includes('application/json')){
			json = yield res.json()
			checkJSON(json)
		}
		else if (contentType.includes('text/plain'))
			return yield res.text()
	}

	return json;
}

function* put(url, data={}, options={}) {
	const res = yield req(url, {
		...options,
		method: 'PUT',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		body: JSON.stringify(data)
	})
	const json = yield res.json()
	checkJSON(json)

	return json;
}

function* post(url, data={}, options={}, retries=0) {
	const res = yield req(url, {
		...options,
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		body: JSON.stringify(data)
	}, retries)
	const json = yield res.json()
	checkJSON(json)

	return json;
}

/*
	url, {
		file: {uri, name, type:'image/jpeg'}
	}
*/
function* upload(url, _body, options={}, retries=0) {
	const body = new FormData()

	for (const key in _body ) {
		const val = _body[key]
		body.append(key, val)
	}

	const res = yield req(url, {
		...options,
		method: 'PUT',
		body
	}, retries)

	const json = yield res.json()
	checkJSON(json)

	return json;
}

function* del(url, data={}, options={}) {
	const res = yield req(url, {
		...options,
		method: 'DELETE',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		...(data ? { body: JSON.stringify(data) } : {})
	})
	const json = yield res.json()
	checkJSON(json)

	return json;
}

function* req(url, options={}, retries=0) {
	var finalURL = API_ENDPOINT_URL + url

	if (url.indexOf('/') == 0)
		finalURL = APP_BASE_URL + url
	else if (url.indexOf('http') == 0)
		finalURL = url

	const relativePath = url.indexOf('http') == 0 ? url : url

	let errorMessage = 'failed to load'

	for(let i = 0; i <= retries; i++){
		try{
			const winner = yield race({
				req: call(fetchWithOptionalRefresh, finalURL, relativePath, options),
				...( options.timeout !== 0 ? { t: delay(API_TIMEOUT) } : {}) //timeout could be turned off if options.timeout=0
			})

			if (!winner.req)
				throw new ApiError({ status: 408 })

			return winner.req;
		}catch(e){
			errorMessage = e.message || ''

			//stop if client error
			if (e && e.status && e.status >= 400 && e.status < 500)
				break;
			//retry
			else if(i < retries-1) {
				yield delay(100 + (retries * 100) ); //stop 100ms and try again
			}
		}
	}

	throw new ApiError({ errorMessage: `${errorMessage} ${finalURL}` })
}

const checkJSON = (json)=>{
	if (typeof json.auth === 'boolean')
		if (json.auth === false)
			throw new ApiError({ status: 401 })

	if (!json.result)
		if (json.error || json.errorMessage || json.status >= 300)
			throw new ApiError(json)
}

const defaultOptions = {
	credentials: 'include',
	mode: 'cors'
}

const convertGeneratorToPromise = (gen)=>function(){
	const a=arguments; 
	return runSaga({onError:()=>{}}, function*(){
		return yield gen(...a)
	}).toPromise()
}

export default {
	get,
	put,
	post,
	del,
	upload,

	_get: convertGeneratorToPromise(get),
	_put: convertGeneratorToPromise(put),
	_post: convertGeneratorToPromise(post),
	_del: convertGeneratorToPromise(del),
	_upload: convertGeneratorToPromise(upload)
}
