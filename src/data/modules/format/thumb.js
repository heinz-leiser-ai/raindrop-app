import normalizeURL from './url'
import { THUMBNAIL_PROXY_URL, WORKERS_BASE_URL, LEGACY_WORKERS_BASE_URL } from '../../constants/app'

export default function(url='') {
    let finalURL = normalizeURL(url)
    if (!finalURL)
        return ''

    if (finalURL.includes(WORKERS_BASE_URL) ||
        finalURL.includes(LEGACY_WORKERS_BASE_URL))
        return finalURL.replace(/width=\d+/, 'a')

    return THUMBNAIL_PROXY_URL+'/'+encodeURIComponent(finalURL)
}