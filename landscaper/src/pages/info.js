import React from 'react';
import { Card, Descriptions, Badge, Typography, Button, Divider, Tag, Spin, List, Modal, Tooltip, Select } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, GithubOutlined } from '@ant-design/icons';
import { withTranslation } from 'react-i18next';
import GitCommitItem from '../components/commit';
import ConfigEditor from '../components/config_editor';
import Updater from '../components/update_steper';
import config_schema from '../data/config-annotation.json';

const { Text } = Typography;
const { Option } = Select;

const config_item = (t, item, value) => {
    return (<Descriptions.Item>{t(item)}: 
        {typeof(value) === 'object'? 
            value:
            <Text code>{value}</Text>
        }
    </Descriptions.Item>)
}

class InfoPage extends React.Component {
    state = {
        path: "",
        config: null,
        version: "N/A",
        githash: "N/A",
        loaded_path: "",
        visible: false,
        status: "On latest remote branch",
        status_color: "success",
        commits: null,
        edit_modal: false,
        uuid: 0,
        head_branch: 'development',
        head_commit: '',
        branches: [],
        show_refresh: false
    }
    updateHandler = null;

    constructor(props) {
        super(props);
        this.editor = null;
    }
    componentDidMount() {
        if (!this.props.parentState) {return;}
        const {grasscutter_version, grasscutter_githash} = this.props.parentState;
        const path = this.props.parentState.grasscutter_path;
        if (path) {
            this.setState({path: path});
            this.loadConfig(path);
        }
        this.setState({
            version: grasscutter_version? grasscutter_version: "N/A",
            githash: grasscutter_githash? grasscutter_githash: "N/A",
        })
        this.setState({branches: this.props.manager.branches});
        setTimeout(()=>this.setState({show_refresh: true}), 1800*1000);
        this.updateHandler = this.watcher.bind(this);
        this.props.manager.mountWatcher(this.updateHandler);
    }
    
    componentWillUnmount() {
        this.props.manager.unmountWatcher(this.updateHandler);
    }

    watcher() {
        const {manager} = this.props;
        this.setState({config: manager.config});
    }

    async loadConfig(path) {
        const {manager} = this.props;
        this.setState({
            config: await manager.getConfig(),
            loaded_path: path,
            head_branch: await manager.getBranch()
        }, this.checkUpdate.bind(this));
    }


    checkUpdate(){
        let target_release = this.props.manager.workflows[0];
        let head_commit = target_release.head_commit.id;
        this.setState({head_commit: head_commit});
        if (!head_commit.startsWith(this.state.githash)){
            this.setState({status: "Off latest remote branch", status_color:"warning"})
        } else {
            this.setState({status: "On latest remote branch", status_color:"success"})
        }
    }

    toggleVisible(){
        this.setState({visible: !this.state.visible});   
    }

    saveConfig(config){
        this.props.manager.saveConfig(config);
    }

    async safeCloseEditor(){
        if (this.editor){
        //  console.log(this.editor);
            await this.editor.safeExit();
            this.setState({edit_modal: false, uuid: this.state.uuid + 1});
        }
        this.setState({edit_modal: false, uuid: this.state.uuid + 1});
    }

    async doUpdate(commit){
        const {t} = this.props;
        const {path} = this.state;
        let modal = Modal.info({
            title: t('Update') + "...",
            okButtonProps: {style: {display: 'none'}},
            closable: false,
            width: "80vw",
            content: <Updater onClose={(success)=>{modal.destroy()
                if(success) {
                    window.location.reload();
                }
            }} output={path} event='push' branch={this.state.head_branch} commit={commit} manager={this.props.manager} />
        });
    }

    switchBranch(value){
        this.props.manager.setBranch(value);
        this.setState({head_branch: value}, this.checkUpdate.bind(this));
    }

    render() {
        const {t} = this.props;
        const {edit_modal, path, config, version, githash, visible, status, status_color, uuid, branches, head_branch, show_refresh} = this.state;
        const commits = this.props.manager.commits.slice(0, 10);
        const visible_button = <Button onClick={this.toggleVisible.bind(this)} shape="circle" style={{marginLeft: "10px"}}>{visible? <EyeTwoTone/> : <EyeInvisibleOutlined/>}</Button>;
        return (<div>
            <Card title={t("Grasscutter Info")}>
                <Modal visible={edit_modal}
                    closable={false}
                    okButtonProps={{style: {display: "none"}}}
                    cancelText={t("Close")}
                    centered
                    width="80vw"
                    onCancel = {this.safeCloseEditor.bind(this)}
                    >
                    <ConfigEditor
                        refp={child=> this.editor = child}
                        config={config} 
                        uuid={uuid} 
                        onSave={this.saveConfig.bind(this)}
                        schema={config_schema}
                    ></ConfigEditor>
                </Modal>
                <Descriptions bordered layout='vertical' column={2}>
                    <Descriptions.Item label={
                            <div style={{    display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"}}>
                                <div>{t("Status") }</div>
                                <div style={{float: "right"}}>
                                    {branches.length? <div>
                                        {t("Remote branch")}:
                                        <Select style={{width: "200px"}} value={head_branch}  onChange={(value)=>this.switchBranch(value)}>
                                        {branches.map(branch=><Option value={branch} key={branch}>
                                            {branch}
                                        </Option>)}
                                    </Select></div>: null}
                                </div>
                            </div>
                        } span={2}>
                        <Tooltip title={status_color==="warning" ? <span>{t("Remote version")}: {this.state.head_commit.slice(0, 6)} <br/><br/> {t("In some cases, you may still see this though you did update grasscutter recently, this is because the latest commit don't have a built artifacts to download.")}</span> : null}>
                            <Badge status={status_color} text={<div style={{display: 'inline-block'}}>
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <div style={{fontWeight: 'bold'}}>{t(status)}</div>
                                    <div>
                                       &middot; {t("Local Version")}: {version}[{githash}]
                                    </div>
                                </div>
                                </div>
                            } />
                        </Tooltip>
                        {show_refresh? <Button style={{marginLeft: '5px'}} shape="round" type="primary" onClick={()=>window.location.reload()}>{t("Refresh")}</Button>:null}
                        {status_color === "warning" ? 
                            <Button style={{float:"right"}} onClick={()=>this.doUpdate(0)} shape="round" type="primary" >{t('Update')}</Button>
                        : null}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("Option")} span={2}>
                        <div style={{display: "flex", gap: "20px"}}>
                            <Button shape="round" type="primary" onClick={()=> this.doUpdate(null)}>{t("Change Version")}</Button>
                            <Button shape="round" type="primary" onClick={()=>this.setState({edit_modal: true})}>{t('Edit Config')}</Button>
                        </div>
                    </Descriptions.Item>
                    <Descriptions.Item label={t("Installation path")} span={2}>
                        {path}
                    </Descriptions.Item>
                    {config? 
                    <Descriptions.Item label=
                                        {<div>{t("Config")}
                                        {visible_button}
                                        <div style={{float: "right"}}>
                                            
                                            {<Badge style={{ backgroundColor: '#52c41a'}} count={`${t("Version")}: ${config.version}`}/>}
                                        </div>
                                        </div>} span={2}>
                        <Divider>{t("Basic Info")}</Divider>
                        <Descriptions bordered={false}>
                                {config_item(t, "Language", config.language.language)}
                                {config_item(t, "Server Mode", config.server.runMode)}
                                {config_item(t, "Debug Level", config.server.debugLevel)}
                                {config_item(t, "Plugin Folder", config.folderStructure.plugins)}
                        </Descriptions>
                      
                        <Divider style={{display: ["hybrid", "game"].includes(config.server.runMode.toLowerCase())?"": "none"}}>{t("Game Server")}{visible_button}</Divider>
                        <Descriptions bordered={false} column={1} style={{display: ["hybrid", "game"].includes(config.server.runMode.toLowerCase())?"": "none"}}>
                            <Descriptions.Item bordered={false}>
                                <Descriptions title={t("Connection Info")}>
                                    {config_item(t, "Game Address", `${visible ? config.server.game.accessAddress: "******"}:${config.server.game.accessPort? config.server.game.accessPort:config.server.game.bindPort}` )}
                                    {config_item(t, "Database Uri", visible?config.databaseInfo.game.connectionUri:"******")}
                                </Descriptions>
                            </Descriptions.Item>
                            <Descriptions.Item bordered={false}>
                                <Descriptions title={t("Inventory Limits")}>

                                {config_item(t, "Weapons", config.server.game.gameOptions.inventoryLimits.weapons)}
                                {config_item(t, "Relics", config.server.game.gameOptions.inventoryLimits.relics)}
                                {config_item(t, "Materials", config.server.game.gameOptions.inventoryLimits.materials)}
                                {config_item(t, "Furniture", config.server.game.gameOptions.inventoryLimits.furniture)}
                                {config_item(t, "All", config.server.game.gameOptions.inventoryLimits.all)}
                                </Descriptions>

                            </Descriptions.Item>
                        </Descriptions>

                        <Divider style={{display: ["hybrid", "dispatch"].includes(config.server.runMode.toLowerCase())?"": "none"}}>{t("Http/Dispatch Server")}{visible_button}</Divider>
                        <Descriptions bordered={false} style={{display: ["hybrid", "dispatch"].includes(config.server.runMode.toLowerCase())?"": "none"}} column={1}>
                            <Descriptions.Item bordered={false}>
                                <Descriptions title={t("Connection Info")}>
                                {config_item(t, "Dispatch Address", `http${config.server.http.encryption.useEncryption?"s":""}://${visible ? config.server.http.accessAddress: "******"}:${config.server.http.accessPort? config.server.http.accessPort:config.server.http.bindPort}` )}
                                {config_item(t, "Database Uri", visible?config.databaseInfo.server.connectionUri:"******")}
                                </Descriptions>
                            </Descriptions.Item>
                            <Descriptions.Item bordered={false}>
                                <Descriptions title={t("Security Policy")}>
                                {config_item(t, "CORS", config.server.http.policies.cors.enabled.toString())}
                                {config_item(t, "Allowed Origins", config.server.http.policies.cors.allowedOrigins.map((origin,index) => {
                                    return (<Tag key={index} color='green'>{origin}</Tag>);
                                }))}
                                </Descriptions>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider>{t("Account")}</Divider>
                        <Descriptions bordered={false}>
                        {config_item(t, "Account auto create", config.account.autoCreate.toString())}
                        {config_item(t, "Default permission", config.account.defaultPermissions.map((permission,index) => {
                            return (<Tag key={index} color={permission[0] === '-'? 'red': 'green'}>{permission}</Tag>);
                        }
                        ))}
                        </Descriptions>

                    </Descriptions.Item>
                    : null}
                    <Descriptions.Item label={<div><GithubOutlined /> {t("Latest Commit")} @ Github </div>} span={2}>
                            {commits
                                ?
                                <List
                                bordered
                                dataSource={commits}
                                renderItem={item => <GitCommitItem key={item.sha} data={item} />}
                                />:  <Spin />}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </div>);
    }
}

export default withTranslation()(InfoPage);