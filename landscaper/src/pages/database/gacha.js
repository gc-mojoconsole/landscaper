import React from 'react';
import DatabaseBase from './database_base';
import { withTranslation } from 'react-i18next';

import UidFilter from '../../components/database/uid_filter';
import Filter from '../../components/database/filter_base';


function Gacha(props) {
    const {t, manager} = props;
    const [query, setQuery] = React.useState({});
    const columns = [
        {title: t('Gacha Type'), dataIndex: 'gachaType', width: 10},
        {title: t('Item Id'), dataIndex: 'itemID', filterDropdown: <Filter query={query} collection="gachas" column="itemID" setQuery={setQuery} manager={manager} parser={parseInt} />},
        {title: t('Owner Id'), dataIndex: 'ownerId', filterDropdown: <UidFilter query={query} column='ownerId' setQuery={setQuery} manager={manager} parser={parseInt}/>},
        {title: t('Date'), dataIndex: 'transactionDate', render: (date)=> <div>{date.toLocaleString()}</div>, sorter: true}
    ]
    return (<DatabaseBase 
        {...props}
        collection="gachas"
        columns={columns}
        default_columns={[0,1,2,3]}
        rowKey={(record, idx)=>idx}
        query={query}
        setQuery={setQuery}
    />)
} 

export default withTranslation()(Gacha);