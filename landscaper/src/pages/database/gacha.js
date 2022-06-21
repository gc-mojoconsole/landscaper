import React from 'react';
import DatabaseBase from './database_base';
import { withTranslation } from 'react-i18next';

import UidFilter from '../../components/database/uid_filter';
import Filter from '../../components/database/filter_base';


function Gacha(props) {
    const {t, manager} = props;
    const [query, setQuery] = React.useState({});
    const [players, setPlayers] = React.useState({});
    const [items, setItems] = React.useState({});
    if (Object.keys(players).length === 0) {
        manager.getCachedData('players').then(
            (ret) => {
                const {uid, nickname} = ret;
                let tmp = {};
                uid.map((u, idx)=> tmp[u]= nickname[idx]);
                setPlayers(tmp);
            }
        );
    }
    if (Object.keys(items).length === 0) {
        manager.getCachedData('items').then(
            (ret)=> {
                const {Avatars, Items} = ret;
                let tmp = {};
                Object.entries(Items).map(
                    ([key, value])=> 
                        tmp[key] = `${value}`
                    
                )
                Object.entries(Avatars).map(
                    ([key, value])=> 
                        tmp[key] = `${value}`
                    
                )
                setItems(tmp);
            }
        )
    }
    const columns = [
        {title: t('Gacha Type'), dataIndex: 'gachaType', width: 10},
        {title: t('Item'), dataIndex: 'itemID',
            filterDropdown: <Filter query={query} collection="gachas" column="itemID" setQuery={setQuery} manager={manager} parser={parseInt} formatter={(d)=><div>{items[d]? items[d]: d}</div>}/>,
            render: (data)=> <div>{items[data]? `${items[data]}(${data})`:data}</div>
        },
        {title: t('Owner Id'), dataIndex: 'ownerId',
            filterDropdown: <UidFilter query={query} column='ownerId' setQuery={setQuery} manager={manager} parser={parseInt}/>,
            render: (data)=> <div>{players[data]? `${players[data]}(${data})`:data}</div>
        },
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