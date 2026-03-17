import s from './view.module.styl'
import React from 'react'
import getThumbUri from '~data/modules/format/thumb'
import getScreenshotUri from '~data/modules/format/screenshot'
import getFaviconUri from '~data/modules/format/favicon'
import thumbnailCache from '~data/modules/thumbnailCache'
import size from './size'
import Preloader from '~co/common/preloader'

//cache thumb/screenshot uri
const thumbs = {}
const getUri = (uri, mode='', domain)=>{
    const cacheKey = uri + '|' + mode
    if (!thumbs[cacheKey])
        switch (mode) {
            case 'screenshot':
                thumbs[cacheKey] = getScreenshotUri(uri)
                break

            case 'favicon':
                thumbs[cacheKey] = domain ? getFaviconUri(domain) : getThumbUri(uri)
                break
        
            default:
                thumbs[cacheKey] = getThumbUri(uri)
                break
        }
    return thumbs[cacheKey]
}

//pixel density
const dpr = {
    grid: (window.devicePixelRatio||1)+1,
    masonry: (window.devicePixelRatio||1)+1,
    default: window.devicePixelRatio||1
}


const isFaviconView = (view)=>
    view == 'simple' || view == 'list'

//main component
export default class BookmarkItemCover extends React.PureComponent {
    static defaultProps = {
        bookmarkId: 0,
        cover:  '',
        link:   '', //required
        view:   'list',
        indicator:false
    }

    state = {
        loaded: this.props.indicator ? false : true,
        cachedSrc: null
    }

    _isUnmounted = false

    componentDidMount() {
        this.syncCachedSrc()
    }

    componentDidUpdate(prevProps) {
        if (this.getProxySrc(prevProps) != this.getProxySrc(this.props))
            this.syncCachedSrc()
    }

    componentWillUnmount() {
        this._isUnmounted = true
    }

    onImageLoadStart = ()=>
        this.setState({ loaded: false })

    onImageLoadSuccess = ()=>
        this.setState({ loaded: true })

    getProxySrc = (props=this.props)=>{
        const { cover, view, link, domain, coverSize } = props

        if (isFaviconView(view))
            return domain ? getFaviconUri(domain) : ''

        let { width, ar } = size(view, coverSize)
        let uri

        if (cover && cover!='<screenshot>')
            uri = getUri(cover)
        else if (link)
            uri = getUri(link, 'screenshot')

        if (!uri)
            return ''

        const mode = view == 'grid' ? 'fillmax' : 'crop'
        const fullUrl = `${uri}?mode=${mode}&fill=solid&width=${width||''}&ar=${ar||''}&dpr=${dpr[view]||dpr.default}`

        return fullUrl
    }

    syncCachedSrc = async ()=>{
        const proxySrc = this.getProxySrc()

        if (!proxySrc){
            if (this.state.cachedSrc)
                this.setState({ cachedSrc: null })
            return
        }

        const cachedSrc = await thumbnailCache.get(proxySrc)

        if (this._isUnmounted)
            return

        this.setState({ cachedSrc: cachedSrc || null })
    }

    persistInCache = async (proxySrc)=>{
        if (!proxySrc)
            return

        const { bookmarkId, link } = this.props

        try{
            const response = await fetch(proxySrc)
            if (!response.ok)
                return

            const blob = await response.blob()
            const dataUrl = await new Promise((resolve, reject)=>{
                const reader = new FileReader()
                reader.onload = ()=>resolve(reader.result)
                reader.onerror = ()=>reject(reader.error)
                reader.readAsDataURL(blob)
            })

            if (this._isUnmounted)
                return

            await thumbnailCache.set(proxySrc, dataUrl, { bookmarkId, link })
            this.setState({ cachedSrc: dataUrl })
        }catch(e){}
    }

    onImageLoad = (proxySrc)=>{
        if (this.props.indicator)
            this.onImageLoadSuccess()

        if (proxySrc && !this.state.cachedSrc && !isFaviconView(this.props.view))
            this.persistInCache(proxySrc)
    }

    renderImage = ()=>{
        const { view, coverSize, indicator, bookmarkId, cover, link, domain, ...etc } = this.props
        const { cachedSrc } = this.state
        let { width, height, ar } = size(view, coverSize)

        const proxySrc = this.getProxySrc()
        const finalSrc = cachedSrc || proxySrc
        const isFav = isFaviconView(view)

        const proxySrcSet = (!isFav && !cachedSrc && proxySrc)
            ? proxySrc + '&format=webp'
            : null

        return (
            <>
                {proxySrcSet ? (
                    <source
                        srcSet={proxySrcSet}
                        type='image/webp' />
                ) : null}

                <img 
                    tabIndex='-1'
                    className={s.image}
                    data-ar={ar}
                    width={width}
                    height={height}
                    alt=' '
                    {...etc}
                    src={finalSrc}
                    onLoadStart={indicator ? this.onImageLoadStart : undefined}
                    onLoad={()=>this.onImageLoad(proxySrc)}
                    onError={indicator && proxySrc ? this.onImageLoadSuccess : undefined} />
            </>
        )
    }

    render() {
        const { className='', view, indicator } = this.props
        const { loaded } = this.state

        return (
            <picture 
                role='img'
                className={s.wrap+' '+s[view]+' '+className}>
                {this.renderImage()}
                {!loaded && indicator && <div className={s.preloader}><Preloader /></div>}
            </picture>
        )
    }
}
