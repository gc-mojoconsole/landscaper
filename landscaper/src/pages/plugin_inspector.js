import React from 'react';
import {Descriptions, Collapse, Typography, Button} from 'antd';
import {withTranslation} from 'react-i18next';
import ConfigEditor from '../components/config_editor';
import ReactMarkdown from 'react-markdown'
import Link from '../components/link';

const { Panel } = Collapse;
const { Text } = Typography;

const textCode = ({children}) => {
    return <Text code>{children}</Text>
}

const simplify_path = (main_path) =>{
    const parts = main_path.split('/');
    const new_path = [];
    let length = 0;
    for (var i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '.' || part === '' || part === '..') {
        if (part === '..' && length > 0) {
          length--;
        }
        continue;
      }
      new_path[length++] = part;
    }
  
    if (length === 0) {
      return '/';
    }
  
    let result = '';
    for (i = 0; i < length; i++) {
      result +=  `/${new_path[i]}` ;
    }
  
    return result;
  }

class PluginInsepctorPage extends React.Component {
    state = {
        config: {},
        pi: null,
    }

    editor = null;

    constructor(props) {
        super(props);
        this.state.pi = props.pi;
    }

    async safeExit() {
        if (this.editor)
            return await this.editor.safeExit();
        else
            return true;
    }

    componentDidMount() {
        this.props.refp(this);
        this.refreshConfig(this.state.pi);
    }

    refreshConfig(pi){
        if(pi.isConfigable()){
            if (!pi.configContent) {
                pi.getConfigContent().then(config => 
                    this.setState({config, pi}));
            } else {
                this.setState({config: pi.configContent, pi: pi});
            }
        } else {
            this.setState({pi});
        }
    }

    componentDidUpdate() {
        // if(pi.getID() !== this.state.pi.getID()){
        //     this.refreshConfig(pi);
        // }
    }

    doEnable = async ()=>{
        const {pi, refreshParent} = this.props;
        await pi.doEnable()
        refreshParent({});
    }

    doDisable = async ()=>{
        const {pi, refreshParent} = this.props;
        await pi.doDisable()
        refreshParent({});
    }

    render (){
        const {t, pi} = this.props;
        return (
            <div>
                <Descriptions title={pi.getName()} bordered column={2}>
                    <Descriptions.Item label={t('Local Version')}>{pi.getVersion()}</Descriptions.Item>
                    <Descriptions.Item label={t('Remote Version')}>{pi.getRemoteVersion()}</Descriptions.Item>
                    {pi.getGithub()? <Descriptions.Item label="Github" span={2}>
                        {/* eslint-disable-next-line */}
                        <Link href={pi.getGithub()}>{t('Repo')}</Link>
                        &nbsp;&middot;&nbsp;
                        <Link href={pi.getGithub() + '/issues'}>{t('Issues')}</Link>
                        &nbsp;&middot;&nbsp;
                        <Link href={pi.getGithub() + '/releases'}>{t('Releases')}</Link>

                    </Descriptions.Item>: null}
                    <Descriptions.Item label={t("Installation path")} span={2}>
                        {simplify_path(pi.jarPath)}
                    </Descriptions.Item>
                </Descriptions>
                <Collapse defaultActiveKey={[]} ghost>
                    <Panel header={t("Option")} key="tool">
                        <div style={{display: 'flex', flexWrap:'wrap', flexDirection:'row', gap: '10px 20px'}}>
                            {pi.hasUpdate()? <Button onClick={()=> pi.fetchUpdate.bind(pi)()}>{t("Update")}</Button>: null }
                            {pi.enabled?
                                <Button onClick={this.doDisable} type="danger">{t("Disable")}</Button>
                                : 
                                <Button onClick={this.doEnable} type="primary">{t("Enable")}</Button>
                            }
                        </div>
                        {/* {total_tools === 0 ? <Empty description={t("No tools available")}></Empty> : null} */}
                    </Panel>

                    {pi.configContent?
                        <ConfigEditor 
                            style={{padding: "16px 11px 16px 11px"}}
                            iconSize={12}
                            refp={child => this.editor=child} 
                            config={pi.configContent} 
                            uuid={pi.toString()} 
                            onSave={pi.saveConfig.bind(pi)} 
                            schema={pi.getSchema()}
                            /> 
                        :
                        null
                    }

                    {pi.getRemoteVersion() !== 'N/A' ? 
                        <Panel header={t("Remote Latest Release Note") + " - " + pi.getRemoteVersion()} key="release-note">
                        {pi.github_releases? <ReactMarkdown components={{a: Link, code: textCode}}>{pi.github_releases.body}</ReactMarkdown>: null}
                        </Panel>
                    : null}
                </Collapse>
            </div>
        )
    }
}

export default withTranslation('translation')(PluginInsepctorPage);