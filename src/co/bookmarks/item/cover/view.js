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
    if (!thumbs[uri])
        switch (mode) {
            case 'screenshot':
                thumbs[uri] = getScreenshotUri(uri)
                break

            case 'favicon':
                thumbs[uri] = domain ? getFaviconUri(domain) : getThumbUri(uri)
                break
        
            default:
                thumbs[uri] = getThumbUri(uri)
                break
        }
    return thumbs[uri]
}

//pixel density
const dpr = {
    grid: (window.devicePixelRatio||1)+1,
    masonry: (window.devicePixelRatio||1)+1,
    default: window.devicePixelRatio||1
}

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
        let { width, ar } = size(view, coverSize)
        let uri

        switch(view){
            case 'simple':
                if (link)
                    uri = getUri(link, 'favicon', domain)
                break

            default:
                if (cover && cover!='<screenshot>')
                    uri = getUri(cover)
                else if (link)
                    uri = getUri(link, 'screenshot')
                break
        }

        if (!uri)
            return ''

        let mode = 'crop'
        if (view == 'grid')
            mode = 'fillmax'

        return `${uri}?mode=${mode}&fill=solid&width=${width||''}&ar=${ar||''}&dpr=${dpr[view]||dpr.default}`
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

            await thumbnailCache.set(proxySrc, dataUrl, { bookmarkId, link })
        }catch(error){}
    }

    onImageLoad = (proxySrc)=>{
        if (this.props.indicator)
            this.onImageLoadSuccess()

        if (proxySrc && !this.state.cachedSrc)
            this.persistInCache(proxySrc)
    }

    renderImage = ()=>{
        const { cover, view, link, domain, coverSize, indicator, ...etc } = this.props
        const { cachedSrc } = this.state
        let { width, height, ar } = size(view, coverSize) //use height only for img element
        let uri

        switch(view){
            //simple always have a favicon
            case 'simple':
                if (link)
                    uri = getUri(link, 'favicon', domain)
                break

            //in other view modes we show a thumbnail or screenshot
            default:
                if (cover && cover!='<screenshot>')
                    uri = getUri(cover)
                else if (link)
                    uri = getUri(link, 'screenshot')
                break
        }

        let mode
        switch(view) {
            case 'grid':
                mode = 'fillmax'
                break

            default:
                mode = 'crop'
                break
        }

        const proxySrc = uri && `${uri}?mode=${mode}&fill=solid&width=${width||''}&ar=${ar||''}&dpr=${dpr[view]||dpr.default}`
        const proxySrcSet = uri && `${uri}?mode=${mode}&fill=solid&format=webp&width=${width||''}&ar=${ar||''}&dpr=${dpr[view]||dpr.default}`
        const finalSrc = cachedSrc || proxySrc

        return (
            <>
                {!cachedSrc ? (
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
                    //type='image/jpeg'
                    onLoadStart={indicator ? this.onImageLoadStart : undefined}
                    onLoad={()=>this.onImageLoad(proxySrc)}
                    onError={indicator && uri ? this.onImageLoadSuccess : undefined} />
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