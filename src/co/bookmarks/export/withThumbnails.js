import { useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import JSZip from 'jszip'

import { bookmarksIds, makeItems, makeSelectMode } from '~data/selectors/bookmarks'
import thumbnailCache from '~data/modules/thumbnailCache'

const dataUrlToBinary = (dataUrl='')=>{
    const [meta='', body=''] = dataUrl.split(',')
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/jpeg'

    if (!body)
        return null

    const bytes = atob(body)
    const writer = new Uint8Array(new ArrayBuffer(bytes.length))

    for (let i=0; i<bytes.length; i++)
        writer[i] = bytes.charCodeAt(i)

    return { mime, writer }
}

const mimeExt = (mime='')=>{
    if (mime.includes('png'))
        return 'png'
    if (mime.includes('webp'))
        return 'webp'
    if (mime.includes('gif'))
        return 'gif'
    return 'jpg'
}

const toPlainItem = (item={})=>({
    _id: item._id,
    title: item.title || '',
    link: item.link || '',
    excerpt: item.excerpt || '',
    note: item.note || '',
    cover: item.cover || '',
    domain: item.domain || '',
    tags: item.tags || [],
    important: !!item.important,
    broken: !!item.broken,
    created: item.created || null,
    lastUpdate: item.lastUpdate || null
})

const downloadBlob = (blob, filename)=>{
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()

    window.setTimeout(()=>{
        URL.revokeObjectURL(url)
    }, 1000)
}

export default function useExportWithThumbnails(spaceId=0) {
    const getSelectMode = useRef(makeSelectMode()).current
    const getItems = useRef(makeItems()).current

    const selectMode = useSelector(state=>getSelectMode(state, spaceId))
    const spaceIds = useSelector(state=>bookmarksIds(state, spaceId))

    const ids = useMemo(()=>{
        if (selectMode.ids.length)
            return selectMode.ids

        return spaceIds
    }, [selectMode.ids, spaceIds])

    const items = useSelector(state=>getItems(state, ids))

    return useCallback(async ()=>{
        if (!ids.length || !items.length)
            return

        const thumbs = await thumbnailCache.getAllByIds(ids)
        const zip = new JSZip()
        const thumbsDir = zip.folder('thumbnails')
        const plainItems = items.map(toPlainItem)

        zip.file('bookmarks.json', JSON.stringify(plainItems, null, 2))

        let included = 0
        for (const item of items){
            const dataUrl = thumbs[String(item._id)]
            if (!dataUrl)
                continue

            const converted = dataUrlToBinary(dataUrl)
            if (!converted)
                continue

            thumbsDir.file(
                `${item._id}.${mimeExt(converted.mime)}`,
                converted.writer,
                { binary: true }
            )
            included++
        }

        zip.file('manifest.json', JSON.stringify({
            spaceId: parseInt(spaceId),
            exportedAt: new Date().toISOString(),
            bookmarks: items.length,
            thumbnails: included,
            thumbnailsSkipped: items.length - included
        }, null, 2))

        const blob = await zip.generateAsync({ type: 'blob' })
        const postfix = parseInt(spaceId) == 0 ? 'all' : parseInt(spaceId)

        downloadBlob(blob, `raindrop-export-${postfix}-with-thumbnails.zip`)
    }, [ids, items, spaceId])
}
