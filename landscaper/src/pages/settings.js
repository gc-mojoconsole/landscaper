import React from 'react';
import {Card, List, Select, Row, Button} from 'antd';
import { withTranslation } from 'react-i18next';
import PACKAGE from '../../package.json';

const {Option} = Select;
const neu = window.Neutralino;
const styles = {
    row: {width: '100%', justifyContent: 'space-between'},
    adjacent: {color: 'darkgray', fontSize: '12px'}
};
class Settings extends React.Component {
    state = {
        language: 'en'
    }
    componentDidMount() {
        neu.storage.getData('setting-language').then((data) => {
            this.setState({language: data});
        }).catch((error) => {
            console.log(error);
            neu.storage.setData('setting-language','en');
        })
    }
    changeLanguage(value) {
        neu.storage.setData('setting-language',value);
        this.props.i18n.changeLanguage(value);
        this.setState({language: value});
    }
    resetPath() {
        neu.storage.setData('grasscutter_path', null);
        window.location.reload();
    }
    render() {
        const {t} = this.props;
        const path = this.props.manager.path;
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
                <Button danger onClick={this.resetPath}>{t('Select')}</Button>
            </Row>,
            <Row style={styles.row}>
                <div>{t('Version')}</div>
                <div>{PACKAGE.version}</div>
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