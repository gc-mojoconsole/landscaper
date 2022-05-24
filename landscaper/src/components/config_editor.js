import React from 'react';

import {Tree, Tag, Button, Modal, Tooltip} from 'antd';
import {withTranslation} from 'react-i18next';
import { DownOutlined, FieldStringOutlined, BoldOutlined, NumberOutlined,ExclamationCircleOutlined  } from '@ant-design/icons';
import RichInput from './input';
const {TreeNode} = Tree;

const {confirm} = Modal;

const getIcon = (node) => {
    switch (typeof node){
        case 'string': return <FieldStringOutlined />;
        case 'boolean': return <BoldOutlined />;
        case 'number': return <NumberOutlined />;
        default: return <br/>;
    }
}

const wrapTooltip = (t, node, schema)=>{
    if (schema && schema.title) {
        return <Tooltip title={t(schema.title)}>{node}</Tooltip>
    }
    return node;
}

const genNode = (node, stack, onchange, schema, t) => {
    if (typeof node === 'object') {
        return (<TreeNode title={wrapTooltip(t,stack.slice(-1)[0], schema)}>
            {Object.keys(node).map(
                        (key)=> {
                            let child_schema = schema;
                            if (schema && schema.properties && schema.properties[key]) {
                                child_schema = schema.properties[key];
                            }
                            return genNode(node[key], stack.concat(key), onchange, child_schema, t)
                        })
                    }
        </TreeNode>)
    }
    return (<TreeNode className="tree-node-for-span" title={
        wrapTooltip(t, 
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>{stack.slice(-1)[0]}</div>
                <div style={{display: 'flex', alignItems: 'center', maxWidth: '30vw', width:"100%"}}>
                    <Tag>{getIcon(node)}</Tag>
                    <RichInput value={node} style={{float: 'right'}} type={typeof node} onChange={onchange} route={stack} options={schema? schema.enum : null}/>
                {/* <input value={node} style={{float:'right'}}></input> */}
                </div>
            </div>, schema
        )}/>);
}

const set = (obj = {}, paths = [], value) => {
    let code = `obj${paths.map((e)=>`["${e.replaceAll('"','\\"')}"]`).join("")} = value`;
    // eslint-disable-next-line
    eval(code);
    return obj;
};

class ConfigEditor extends React.Component {
    state = {
        cxpandedKeys: [],
        autoExpandParent: true,
        edited: false,
        config: {}, 
        bindID: '',
    }
    onExpand = (expandedKeys) =>{
        this.setState({expandedKeys: expandedKeys, autoExpandParent: false});
    }

    onChange = (event, route) => {
        let value;
        if (event.target){
            value = event.target.value;
        } else {
            value = event;
        }
        this.setState({config: set(this.state.config, route.slice(1), value), edited: true});
        window.currentEditor = this;
    }

    static getDerivedStateFromProps(props, state) {
        if (props.uuid !== state.bindID){
            return {bindID: props.uuid, config: JSON.parse(JSON.stringify(props.config)), expandedKeys: [], edited: false};
        }
        return null;
    }

    constructor(props){
        super(props);
        if (this.props.refp) this.props.refp(this); 
    }

    async saveChange(){
        await this.props.onSave(this.state.config);
        this.setState({edited: false });
    }

    async safeExit() {
        if (!this.state.edited) return true;
        const saveChange = this.saveChange.bind(this);
        const {t} = this.props;
        let exit = false;
        const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))
        confirm({
            title: t('Do you want to save changes?'),
            icon: <ExclamationCircleOutlined />,
            content: "",
            async onOk() {
                await saveChange();
                exit = true;
            },
            onCancel() {exit = true},
            cancelButtonProps: {danger: true},
            okText: t('Save'),
            cancelText: t('Discard'),
        });
        while (!exit) {
            await delay(100);
        }
        this.setState({edited: false});
        return true;
    }

    componentWillUnmount(){
        if (window.currentEditor === this) {
            window.currentEditor = null;
        }
    }    
    discardChanges(){
        this.setState({
            config: this.props.config,
            edited: false,
            expandedKeys:[]
        });
    }
    selectToExpand(e){
        const key = e[0];
        let index = this.state.expandedKeys.indexOf(key);
        if (index > -1) {
            let expandedKeys = this.state.expandedKeys;
            expandedKeys.splice(index, 1);
            this.setState({expandedKeys: expandedKeys});
        } else {
            this.setState({expandedKeys: this.state.expandedKeys.concat(key)})
        }
    }
    render() {
        const {t, style, iconSize, schema} = this.props;
        const {expandedKeys, autoExpandParent, edited, config} = this.state;
        return (
            <div style={style}>
                        {edited?
                            <div style={{position: 'absolute', zIndex: 99, right: '33px', display:'flex', justifyContent:'space-between'}}>
                                <Button type="primary" danger onClick={this.discardChanges.bind(this)}>{t('Discard')}</Button>
                                <Button type="primary" style={{marginLeft: "5px"}} onClick={this.saveChange.bind(this)}>{t('Save')}</Button> 
                            </div>:
                            null }
                    <div style={{paddingTop: '10px'}}>
                        <Tree 
                            switcherIcon={<DownOutlined style={{fontSize: iconSize}}/>}
                            autoExpandParent={autoExpandParent}
                            expandedKeys={expandedKeys}
                            onExpand={this.onExpand}
                            onSelect={this.selectToExpand.bind(this)}
                        >
                        { [config].map((e)=>genNode(e, [t('Config')], this.onChange, schema, t)) }
                        </Tree>
                    </div>
            </div>
        );
    }
}

export default withTranslation()(ConfigEditor);