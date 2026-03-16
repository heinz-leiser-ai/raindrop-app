const DB_NAME = 'raindrop-thumbnail-cache'
const STORE_NAME = 'thumbnails'
const DB_VERSION = 1

let dbPromise

const hasIndexedDB = ()=>
    typeof window != 'undefined' && typeof window.indexedDB != 'undefined'

const openDB = ()=>{
    if (!hasIndexedDB())
        return Promise.resolve(null)

    if (!dbPromise)
        dbPromise = new Promise((resolve, reject)=>{
            const request = window.indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = ()=>reject(request.error)

            request.onupgradeneeded = ()=>{
                const db = request.result
                if (!db.objectStoreNames.contains(STORE_NAME))
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' })
            }

            request.onsuccess = ()=>resolve(request.result)
        })

    return dbPromise
}

const withStore = async (mode, run)=>{
    const db = await openDB()
    if (!db)
        return null

    return new Promise((resolve, reject)=>{
        const transaction = db.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)

        let result

        transaction.oncomplete = ()=>resolve(result)
        transaction.onerror = ()=>reject(transaction.error)
        transaction.onabort = ()=>reject(transaction.error)

        result = run(store)
    })
}

const safeCall = async (run, fallback)=>{
    try{
        return await run()
    }catch(error){
        return fallback
    }
}

export default {
    async get(key='') {
        if (!key)
            return null

        return safeCall(
            ()=>withStore('readonly', (store)=>
                new Promise((resolve, reject)=>{
                    const request = store.get(key)
                    request.onsuccess = ()=>resolve(request.result ? request.result.dataUrl : null)
                    request.onerror = ()=>reject(request.error)
                })
            ),
            null
        )
    },

    async set(key='', dataUrl='', meta={}) {
        if (!key || !dataUrl)
            return false

        return safeCall(
            ()=>withStore('readwrite', (store)=>{
                store.put({
                    key,
                    dataUrl,
                    bookmarkId: meta.bookmarkId ? String(meta.bookmarkId) : '',
                    link: meta.link || '',
                    updated: Date.now()
                })

                return true
            }),
            false
        )
    },

    async deleteByLink(link='') {
        if (!link)
            return 0

        return safeCall(
            ()=>withStore('readwrite', (store)=>
                new Promise((resolve, reject)=>{
                    let removed = 0
                    const request = store.openCursor()

                    request.onsuccess = (event)=>{
                        const cursor = event.target.result

                        if (!cursor)
                            return resolve(removed)

                        const value = cursor.value || {}
                        if (value.link == link){
                            removed++
                            cursor.delete()
                        }

                        cursor.continue()
                    }

                    request.onerror = ()=>reject(request.error)
                })
            ),
            0
        )
    },

    async getAllByIds(ids=[]) {
        if (!ids.length)
            return {}

        const idsSet = new Set(ids.map(id=>String(id)))

        return safeCall(
            ()=>withStore('readonly', (store)=>
                new Promise((resolve, reject)=>{
                    const request = store.openCursor()
                    const found = {}

                    request.onsuccess = (event)=>{
                        const cursor = event.target.result

                        if (!cursor){
                            const result = {}
                            Object.keys(found).forEach(id=>{
                                result[id] = found[id].dataUrl
                            })
                            return resolve(result)
                        }

                        const value = cursor.value || {}
                        const bookmarkId = value.bookmarkId ? String(value.bookmarkId) : ''
                        if (bookmarkId && idsSet.has(bookmarkId)){
                            const current = found[bookmarkId]
                            if (!current || (value.updated || 0) > (current.updated || 0))
                                found[bookmarkId] = {
                                    dataUrl: value.dataUrl,
                                    updated: value.updated || 0
                                }
                        }

                        cursor.continue()
                    }

                    request.onerror = ()=>reject(request.error)
                })
            ),
            {}
        )
    }
}
