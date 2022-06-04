import React from 'react';
import {Card, Tag, Avatar, Tooltip, Empty, Modal, Typography, Collapse} from 'antd';
import { withTranslation } from 'react-i18next';

import {GithubOutlined, DownloadOutlined, EllipsisOutlined} from '@ant-design/icons';

import PluginInsepctor from '../core/plugin_manager';
import { GITHUB_API, UPSTREAM_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import Link from '../components/link';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const { Meta } = Card;
const neu = window.Neutralino;
const {Text} = Typography;
const textCode = ({children}) => <Text code>{children}</Text>;
const { Panel } = Collapse;

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
        column: 1,
        toggle_more: false,
        more: {},
    }
    divRef = null

    async fetchData() {
        let marketData = await (await fetch(`${UPSTREAM_URL}/market.json`)).json();
        this.setState({marketData});
        
        const {manager} = this.props;
        let installed = [];
        let uninstalled = [];
        marketData.forEach(async (plugin) => {
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
                    folderPath = await manager.getFolder() + manager.config.folderStructure.plugins;
                } catch(e){
                    folderPath = await manager.getFolder() + './plugins/';
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

    showMore = async (plugin) => {
        const {pi} = plugin
        let more = {
            title: pi.config.name,
            version: '',
            time: '',
            release: '',
            readme: ''
        };
        this.setState({more, toggle_more: true});
        let releases = await (await fetch(`${GITHUB_API}/repos/${plugin.github}/${plugin.releases}`)).json();
        more.release = releases.body.replaceAll(/#([0-9]+)/g, `[#$1](https://github.com/${plugin.github}/issues/$1)`);
        more.version = releases.tag_name;
        more.time = new Date(releases.created_at).toLocaleString();
        this.setState({more});
        let res = await (await fetch(`${GITHUB_API}/repos/${plugin.github}`)).json();
        let readme = await (await fetch(`https://raw.githubusercontent.com/${plugin.github}/${res.default_branch}/README.md`)).text();
        more.readme = readme;
        this.setState({more});
    }

    render() {
        const {t, manager} = this.props;
        const {uninstalled, column, toggle_more, more} = this.state;
        return (<div ref={(e)=> this.ref = e}>
            {uninstalled.length === 0? <Empty description={t("No uninstalled plugins")} />:null}
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
                                <Tooltip title={t("More")} key="more"><EllipsisOutlined onClick={()=> this.showMore(plugin)} /></Tooltip>
                            ]}

                        >
                            {t('Tags')}: {plugin.tags?.map?.((tag)=> 
                                <Tag style={{backgroundColor: stringToColour(tag)}} key={tag}>{t(tag)}</Tag>
                            )}
                            <p>{plugin.description}</p>
                        </Card>
                    </div>)}
                )}
                <Modal visible={toggle_more} cancelButtonProps={{style: {display: "none"}}} onOk={()=>this.setState({toggle_more: false})} onCancel={()=>this.setState({toggle_more: false})} maskClosable title={more.title}>
                    <Collapse ghost defaultActiveKey={['rl']}>
                        <Panel header={`${t("Latest Release Version")} : ${more.version}`} >
                            {t("Release Time")} : {more.time}
                        </Panel>
                        <Panel header={t("Release Log")} key='rl'>
                            {more.release? 
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{a: Link, code: textCode}}>{more.release}</ReactMarkdown>
                            :<Empty/>}
                        </Panel>
                        <Panel header={t("Readme")} key='rm'>
                            {more.readme? 
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{a: Link, code: textCode}}>{more.readme}</ReactMarkdown>
                                : <Empty/>}
                        </Panel>
                    </Collapse>
                </Modal>
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

