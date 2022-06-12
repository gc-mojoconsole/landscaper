import DatabaseBase from './database_base';
import { withTranslation } from 'react-i18next';
// import {Tag} from 'antd';


function Player(props) {
    const {t} = props;
    const player_columns = [
        {title: t('Account ID'), dataIndex: 'accountId'},
        {title: t('UID'), dataIndex: '_id'},
        {title: t('Nickname'), dataIndex: 'nickname'},
        {title: t('Birth day'), dataIndex: 'birthday', render: (birthday)=> <div>
            {birthday.day === 0 ? t("Unset"): `${birthday.month}/${birthday.day}`}
        </div>},
        {title: t("Godmode"), dataIndex: 'godmode', render: (godmode)=> godmode?t("Enabled"): t("Disabled")},
        {title: t("Stamina"), dataIndex: 'stamina', render: (stamina)=> stamina?t("Enabled"): t("Disabled")},
    ]
    return (<DatabaseBase 
        {...props}
        collection="players"
        columns={player_columns}
        default_columns={[0,1,2,3,4]}
        rowKey={(record)=>record._id}
    />)
} 

export default withTranslation()(Player);