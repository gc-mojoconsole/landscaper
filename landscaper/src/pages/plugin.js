import React from 'react';
import {withTranslation} from 'react-i18next';
import {Card, Divider, Empty, Menu, Tag, Tooltip} from 'antd';
import { CloudUploadOutlined, MinusCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";

import PluginInsepctorPage from './plugin_inspector';

const styles = {
    card: {display: 'flex', flexDirection: 'row', minHeight: "76vh", overflowY: "auto"},
    row: {display: 'flex', flexDirection: 'row', alignItems: 'center', width:"100%"},
    rowWarp: {display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: '-10px'}
}

var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 0xFF;
      colour += ('00' + value.toString(16)).slice(-2);
    }
    return colour + '40';
  }


function getItem(label, key, icon, children, theme) {
    return (
        <Menu.Item key={`${key}`} style={{height: "fit-content"}}>
            <div style={styles.row}>
                <div style={{width: "25px", marginLeft:"-12px"}}>{icon}</div>
                {label}
            </div>
        </Menu.Item>
    );
  }

function getItemEntry(plugin, t) {
    return (
        <div style={{marginLeft: "10px"}}>
            <div style={{fontWeight: "bold", fontSize: "20px"}}>{plugin.getName()}</div>
            <div style={{marginTop: '-14px'}}>{t("Version")}: {plugin.getVersion()}</div>
            <div style={{marginTop: '-20px'}}>{t("Author")}: {plugin.getAuthors()}</div>
            <div style={styles.rowWarp}>{plugin.getTags().map((tag,idx)=> <Tag key={idx} style={{backgroundColor: stringToColour(tag), marginTop:'4px'}}>{t(tag)}</Tag>)}</div>
        </div>
    );
}

class PluginPage extends React.Component {
    state = {
        selected: null,
    }
    inspector = null;
    select(index) {
        const current = this.inspector;
        if (current){
            current.safeExit().then((ready) => {
                if (ready){
                    this.setState({selected: parseInt(index.key)});
                }
            }).catch();
        } else { // not modified, safe to switch
            this.setState({selected: parseInt(index.key)});
        }
    }
    constructor(props) {
        super(props);
        this.props.manager.installed.forEach((installed) => installed.onrefresh = this.setState.bind(this))
    }
    render() {
        const {t, manager} = this.props;
        const {selected} = this.state;
        return (
            <Card title={t("Installed Plugins")}>
                <div style={styles.card}>
                    <Menu
                        onClick={this.select.bind(this)}
                        style={{
                        width: 256,
                        overflowY: 'auto',
                        overflowX: 'auto',
                        flex: 2
                        }}
                        selectedKeys={[`${selected}`]}
                        mode="vertical"
                        theme="light"
                    >
                        <Menu.ItemGroup title={t("Enabled")} style={{marginLeft:"-15px"}}>
                            {manager.installed.map((plugin, index)=> 
                                plugin.enabled?
                                getItem(
                                    getItemEntry(plugin, t), 
                                    index+1, 
                                    plugin.hasUpdate()? <Tooltip title={<span>{t("Update available")}<br/><span style={{color: 'cyan'}}>{t("Remote")}:{plugin.github_releases.tag_name}</span></span> }>
                                        <CloudUploadOutlined style={{fontSize: "30px", color:"orange"}}/>
                                    </Tooltip> :
                                    <CheckCircleOutlined style={{fontSize: "30px", color: "green"}}/>
                                ): null)}
                        </Menu.ItemGroup>
                        <Menu.ItemGroup title={t("Disabled")} style={{marginLeft:"-15px"}}>
                            {manager.installed.map((plugin, index)=> 
                                plugin.enabled?
                                null: getItem(
                                    getItemEntry(plugin, t), 
                                    index+1, 
                                    plugin.hasUpdate()? <Tooltip title={<span>{t("Update available")}<br/><span style={{color: 'cyan'}}>{t("Remote")}:{plugin.github_releases.tag_name}</span></span> }>
                                        <CloudUploadOutlined style={{fontSize: "30px", color:"darkred"}}/>
                                    </Tooltip> :
                                    <MinusCircleOutlined style={{fontSize: "30px", color:"red"}}/>
                                ))}
                        </Menu.ItemGroup>
                    </Menu>
                    <Divider type="vertical" style={{height: ""}}/>
                    <div style={{flex: 4, margin: selected?'':"auto", maxWidth: '60vw'}}>
                        {selected? 
                            <PluginInsepctorPage refp={child => this.inspector = child} style={{marginTop: "30px"}} pi={manager.installed[selected - 1]} refreshParent={this.setState.bind(this)} /> :
                            <Empty style={{}} description={t("Please select plugin first")}/>
                        }
                    </div>
                </div>
            </Card>
        )
    }
};

export default withTranslation()(PluginPage);