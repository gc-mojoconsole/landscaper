import React from 'react';
import {Card, Tag, Avatar, Tooltip} from 'antd';
import { withTranslation } from 'react-i18next';

import {GithubOutlined, DownloadOutlined, EllipsisOutlined} from '@ant-design/icons';

import marketData from '../market.json';
import PluginInsepctor from '../core/plugin_inspector';
import { GITHUB_API } from '../config';

const { Meta } = Card;
const neu = window.Neutralino;

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

class MarketPage extends React.Component {
    state = {
        marketData: [],
        uninstalled: [],
        installed: [],
        column: 1
    }
    divRef = null

    fetchData() {
        this.setState({marketData: marketData});
        
        const {manager} = this.props;
        let installed = [];
        let uninstalled = [];
        marketData.forEach((plugin) => {
            let installed_flag = false;
            manager.installed.forEach((p)=>{
                if (p.getName() === plugin.name) installed_flag = true;
            })
            if (installed_flag){
                installed.push(plugin);
            } else {
                let pi = new PluginInsepctor();
                let folderPath = "";
                try{
                    folderPath = manager.path + manager.config.folderStructure.plugins;
                } catch(e){
                    folderPath = manager.path + './plugins/';
                }
                pi.jarPath = folderPath + `/${plugin.name}.jar`;
                pi.config.name = plugin.name;
                pi.folderPath =  folderPath;
                plugin.pi = pi;
                uninstalled.push(plugin);
            }
        });
        this.setState({installed, uninstalled});
    }
    componentDidMount() {
        this.fetchData();
        window.addEventListener('resize', this.updateColumn);
        this.updateColumn();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateColumn);
    }

    constructor(props) {
        super(props);
        this.divRef = null;
    }

    updateColumn = () => {
        this.setState({ column: Math.floor(this.ref.clientWidth / 330) });
    }

    render() {
        const {t, manager} = this.props;
        const {uninstalled, column} = this.state;
        return (<div ref={(e)=> this.ref = e}>
            <div style={{columnCount: column, margin: "auto", width: column * 330}} >
                {uninstalled.map((plugin, index) =>{
                    return(
                        <div key={index} style={{breakInside: "avouid", WebkitColumnBreakInside: "avoid", padding: "3px"}}>
                        <Card hoverable  title={
                            // <div style={{display:'flex', alignItems: 'center', gap: '10px'}}><GithubOutlined style={{ fontSize: '30px'}}/> {plugin.name}</div>
                                <Meta avatar={
                                    plugin.icon? <Avatar size={30} src={plugin.icon} shape="square" /> :
                                    <GithubOutlined style={{ fontSize: '30px'}}/>
                                } title={plugin.name} />
                            } 
                            bordered={false} style={{ width: 300, padding: "10px",
                            boxSizing: "content-box", margin: "10px"}}
                            actions={[
                                <Tooltip title={t("View on github")} key="info">
                                    <GithubOutlined onClick={()=>neu.os.open(`https://github.com/${plugin.github}`)}/>
                                </Tooltip>,
                                <Tooltip title={t("Install")} key="install">
                                    <DownloadOutlined onClick={async ()=> {
                                        plugin.pi.github_releases = await (await fetch(`${GITHUB_API}/repos/${plugin.github}/${plugin.releases}`)).json();
                                        let ret = await plugin.pi.fetchUpdate();
                                        if (ret === -1) return;
                                        manager.installed.push(plugin.pi);
                                        let index = this.state.uninstalled.indexOf(plugin);
                                        this.state.uninstalled.splice(index, 1);
                                        this.state.installed.push(plugin);
                                        plugin.pi.fetch_upstream();
                                        console.log(this.state.uninstalled);
                                        this.setState({uninstalled: this.state.uninstalled});
                                    }} />
                                </Tooltip>,
                                <Tooltip title={t("More")} key="more"><EllipsisOutlined /></Tooltip>
                            ]}

                        >
                            {t('Tags')}: {plugin.tags?.map?.((tag)=> 
                                <Tag style={{backgroundColor: stringToColour(tag)}} key={tag}>{t(tag)}</Tag>
                            )}
                            <p>{plugin.description}</p>
                        </Card>
                    </div>)}
                )}
            </div>
            {/* installed:
            <div style={{display: 'flex', flexDirection: 'row', gap:"20px 20px", flexWrap: 'wrap'}}>
                {installed.map((plugin, index) =>
                    <Card hoverable key={index} title={plugin.name} bordered={false} style={{ width: 300 }}>
                        {plugin.description}
                    </Card>
                )}
            </div> */}
        </div>)
    }
}

export default withTranslation()(MarketPage);

