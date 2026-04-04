import s from './index.module.styl'
import React from 'react'
import t from '~t'
import Modal, { Header, Content } from '~co/overlay/modal'
import Items from '~co/collections/items'
import { Layout, Search } from '~co/common/form'

export default class CollectionsPicker extends React.Component {
    state = {
        options: {
            hideIds: [0],
            search: ''
        }
    }

    static getDerivedStateFromProps(props, state) {
        const extra = props.extraHideIds
        if (!extra || !extra.length) return null
        const merged = [...new Set([0, ...extra])]
        const cur = state.options.hideIds || []
        if (merged.length === cur.length && merged.every((id, i) => id === cur[i]))
            return null
        return { options: { ...state.options, hideIds: merged } }
    }

    onSearchChange = e =>
        this.setState({ options: { ...this.state.options, search: e.target.value } })

    render() {
        const { onClose, ...etc } = this.props

        return (
            <Modal onClose={onClose} stretch>
                <Header 
                    title={t.s('selectCollection')}
                    data-no-shadow />

                <Layout>
                    <Search 
                        autoFocus
                        value={this.state.options.search}
                        placeholder={t.s('findOrCreateCollection')+'…'}
                        onChange={this.onSearchChange} />
                </Layout>

                <Content className={s.content}>
                    <Items 
                        pauseId='picker'
                        {...etc}
                        {...this.state} />
                </Content>
            </Modal>
        )
    }
}