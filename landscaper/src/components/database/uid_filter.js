import React from 'react';
import {withTranslation} from 'react-i18next';

import {Checkbox, Input, Button} from 'antd';
import Filter from './filter_base';

const aggregate_query = [
    { "$group": { "_id":  null,uid: {$push: "$_id"},nickname: {$push: "$nickname"}}},
    { "$project":{uid:true,nickname:true}}
];


function UidFilter(props) {
    const {manager} = props;
    return (
        <Filter {...props} 
            list={async ()=>{
                let {uid, nickname} = (await manager.getDBAggregate('players', aggregate_query))[0]
                return uid.map((u, idx)=> [u, nickname[idx]]);
            }}
            formatter={(item)=> {
                return `${item[0]}(${item[1]})`
            }}
        />
    )
}

export default withTranslation()(UidFilter);
