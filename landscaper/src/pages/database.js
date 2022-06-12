import React from 'react';
import {Card, Tabs} from 'antd';
import {withTranslation} from 'react-i18next';
import Accounts from './database/account';
import Players from './database/player';
import Gachas from './database/gacha';

const {TabPane} = Tabs;

class Database extends React.Component {

    render() {
        const {t, manager} = this.props;
        return (
         <Card>
            <Tabs defaultActiveKey="1" type="card">
                <TabPane  key="1" tab={t('Accounts')}>
                    <Accounts manager={manager} />
                </TabPane>
                <TabPane  key="2" tab={t('Players')}>
                    <Players manager={manager} />
                </TabPane>
                <TabPane  key="3" tab={t('Gachas')}>
                    <Gachas manager={manager} />
                </TabPane>
            </Tabs>
        </Card>
        )
    }
}

export default withTranslation()(Database);