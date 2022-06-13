import React from 'react';
import {Card, Tabs, Modal, Spin, Checkbox, Input, message} from 'antd';
import {withTranslation} from 'react-i18next';
import Accounts from './database/account';
import Players from './database/player';
import Gachas from './database/gacha';

const {TabPane} = Tabs;

class Database extends React.Component {
    state ={
        loading: true,
        modal: false,
        remember: false,
        uris: {}
    }

    async componentDidMount() {
        const {manager} = this.props;
        let uris = await manager.backend.getData('saved_db_uri', null);
        if (uris) {
            Object.entries(JSON.parse(uris)).forEach(async ([replace, uri]) => {
                await manager.setDBUri(replace, uri);
            })
        }
        if (await manager.checkDBconnection() === true) {
            this.setState({loading: false});
        } else {
            let uris = {};
            uris[manager.config.databaseInfo.game.connectionUri] = manager.config.databaseInfo.game.connectionUri;
            uris[manager.config.databaseInfo.server.connectionUri] = manager.config.databaseInfo.server.connectionUri;
            this.setState({modal: true, uris});
        }
    }

    async replaceUri() {
        const {manager, t} = this.props;
        const {uris, remember} = this.state;
        let connected = await new Promise(async (resolve, reject) => {
            for (let entry of Object.entries(uris)) {
                let [replace, uri] = entry;
                try{
                    await manager.setDBUri(replace, uri);
                    let ret = await manager.checkDBconnection({uri: replace});
                    if (ret === false) { resolve(false);}
                } catch(e) {
                    resolve(false)
                }
            }
            resolve(true);
        })
        if (await connected)
        {
            this.setState({loading: false, modal: false});
            if (remember) {
                manager.backend.setData('saved_db_uri', JSON.stringify(uris));
            }
        } else {
            message.error(t("Failed when connecting database using the provided uri"));
        }
    }

    render() {
        const {t, manager} = this.props;
        const {loading, modal, remember, uris} = this.state;
        return (
         <Card>
            <Modal title={t("Connet to database stored in the parsed config file failed, please specify a connection uri manually")} visible={modal} cancelButtonProps={{style: {display: 'none'}}} onOk={this.replaceUri.bind(this)} closable={false}>
                
                <div style={{marginTop: '10px'}}>
                    {Object.entries(uris).map(([uri, value], idx)=> <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                        <div style={{whiteSpace: 'nowrap'}}>{`${uri} =>`}</div> 
                        <Input value={value} onChange={
                            (e)=> {
                                let t = uris;
                                t[uri] = e.target.value;
                                this.setState({uris: t})
                            }} >
                        </Input> 
                    </div>)}
                    <Checkbox checked={remember} onChange={(e)=>this.setState({remember: e.target.checked})}> {t('Remember')} </Checkbox>
                </div>
            </Modal>
            {loading? <Spin loading='true'> </Spin> :
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
            }

        </Card>
        )
    }
}

export default withTranslation()(Database);