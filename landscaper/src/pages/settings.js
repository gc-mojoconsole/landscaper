import React from 'react';
import {Card, List, Select, Row, Button} from 'antd';
import { withTranslation } from 'react-i18next';
import PACKAGE from '../../package.json';
import Link from '../components/link'
import {GithubOutlined} from '@ant-design/icons';

const {Option} = Select;
const styles = {
    row: {width: '100%', justifyContent: 'space-between'},
    adjacent: {color: 'darkgray', fontSize: '12px'}
};
class Settings extends React.Component {
    state = {
        language: 'en',
        version: ''
    }
    manager = null
    constructor(props) {
        super(props);
        this.manager = window.landscaper;
    }
    componentDidMount() {
        this.manager.backend.getData('setting-language').then((data) => {
            this.setState({language: data});
        }).catch((error) => {
            console.log(error);
            this.manager.backend.setData('setting-language','en');
        })
        this.composeVersion();
    }

    async composeVersion() {
        const {t} = this.props;
        let version = `${t("Frontend")}: ${PACKAGE.version}`;
        if (this.props.manager.backend.getVersion) {
            version = version + `, ${t("Backend")}: ${await this.props.manager.backend.getVersion()}`;
        }
        this.setState({ version });
    }

    changeLanguage(value) {
        this.manager.backend.setData('setting-language',value);
        this.props.i18n.changeLanguage(value);
        this.setState({language: value});
    }
    resetPath() {
        this.manager.backend.setData('grasscutter_path', null);
        window.location.reload();
    }
    render() {
        const {t} = this.props;
        const path = this.props.manager.path;
        const {version} = this.state;

        const settings = [
            <Row style={styles.row}><div>{t('Language')}</div>
                <Select value={this.state.language} style={{width: '200px'}} onChange={this.changeLanguage.bind(this)}>
                    <Option value="en">English</Option>
                    <Option value="zh">中文</Option>
                </Select></Row>,
            <Row style={styles.row}>
                <div>{t('Select another grasscutter instance')}
                    <div style={styles.adjacent}>
                        {t('Current')}:  {path}
                    </div></div>
                <Button danger onClick={this.resetPath.bind(this)}>{t('Select')}</Button>
            </Row>,
            <Row style={styles.row}>
                <div>{t('Version')}</div>
                <div>{version}</div>
            </Row>,
            <Row style={styles.row}>
                <div>View on Github <GithubOutlined /></div>
                <div><Link href="https://github.com/gc-mojoconsole/landscaper">{t("Open")}</Link></div>
            </Row>
        ];
        let index = 0;
        return (
            <Card title={t('Settings')}>
                <List dataSource={settings} renderItem={(e) => (<List.Item key={index++}>{e}</List.Item>)} />
            </Card>
        )
    }
}

export default withTranslation()(Settings);