import browser from 'webextension-polyfill'

// SPA unter chrome-extension:// — gleicher Ansatz wie Chrome (RAIN-2: Auth per Bearer)
const base = '/index.html#'

export async function open(path, { width = 420, height = 600 } = {}) {
    let origin = { left: 0, top: 0, width: 0, height: 0 }
    try{
        origin = await browser.windows.getCurrent()
    } catch(_) {}

    return await browser.windows.create({
        url: `${base}${path}`,
        type: 'popup',

        //position
        width,
        height,
        left: parseInt(origin.left + (origin.width/2) - (width/2)),
        top: parseInt(origin.top + (origin.height/2) - (height/2))
    })
}

export default function() {
}