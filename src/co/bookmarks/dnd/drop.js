import React from 'react'
import t from '~t'
import { connect } from 'react-redux'
import { oneCreate, oneUpload, oneMove, moveSelected } from '~data/actions/bookmarks'
import PickerFileDrop from '~co/picker/file/drop'
import { Confirm } from '~co/overlay/dialog'
import links from '~config/links'

class BookmarksDropArea extends React.Component {
    static defaultProps = {
        spaceId: 0
    }

    onUploadFile = async(file)=>{
        if (/\.(html|csv|json|enex)$/i.test(file.name)){
            const openImport = await Confirm(
                'Hmmm... wait a minute',
                {
                    description: 'Looks like you trying to import bookmarks?',
                    ok: t.s('import')+' '+t.s('bookmarks').toLowerCase()+'…',
                }
            )
            
            if (openImport)
                window.open(links.app.import)
            return
        }

        return new Promise((res, rej)=>{
            this.props.oneUpload({
                collectionId: parseInt(this.props.spaceId),
                file
            }, res, rej)
        })
    }

    onDropLink = (link)=>
        new Promise((res, rej)=>{
            this.props.oneCreate({
                collectionId: parseInt(this.props.spaceId),
                link
            }, res, rej)
        })

    onDropCustom = ([type, data])=>
        new Promise((res, rej)=>{
            const targetId = parseInt(this.props.spaceId)

            switch(type){
                case 'bookmark': {
                    const [bookmarkId, sourceSpaceId] = Array.isArray(data) ? data : [data, null]
                    if (sourceSpaceId != null && parseInt(sourceSpaceId) === targetId)
                        return res()
                    this.props.oneMove(parseInt(bookmarkId), targetId, res, rej)
                    break
                }

                case 'selected_bookmarks':
                    if (parseInt(data) === targetId)
                        return res()
                    this.props.moveSelected(parseInt(data), targetId, res, rej)
                break

                default:
                    res()
                break
            }
        })

    onDragCustom = (type)=>
        type == 'bookmark' || type == 'selected_bookmarks'

    render() {
        return (
            <PickerFileDrop 
                onFile={this.onUploadFile}
                onLink={this.onDropLink}
                onCustom={this.onDropCustom}
                validateCustom={this.onDragCustom}>
                {this.props.children}
            </PickerFileDrop>
        )
    }
}

export default connect(
	undefined,
	{ oneCreate, oneUpload, oneMove, moveSelected }
)(BookmarksDropArea)