import DatabaseBase from './database_base';
import { withTranslation } from 'react-i18next';
import {Tag} from 'antd';


function Account(props) {
    const {t} = props;
    const account_columns = [
        {title: t('ID'), dataIndex: '_id'},
        {title: t('User Name'), dataIndex: 'username'},
        {title: t('Permissions'), dataIndex: 'permissions', render: (permissions)=><div>
            {permissions.map((p, idx)=> <Tag key={idx} color={p[0]==='-'? 'red': 'green'}>{p}</Tag>)}
            </div>
        },
        {title: t('Locale'), dataIndex: 'locale'}
    ]
    return (<DatabaseBase 
        {...props}
        collection="accounts"
        columns={account_columns}
        default_columns={[0,1,2]}
        rowKey={(record)=> record._id}
    />)
} 

export default withTranslation()(Account);