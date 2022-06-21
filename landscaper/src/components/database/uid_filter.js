import React from 'react';
import {withTranslation} from 'react-i18next';

import Filter from './filter_base';

function UidFilter(props) {
    const {manager} = props;
    return (
        <Filter {...props} 
            list={async ()=>{
                let {uid, nickname} = await manager.getCachedData('players');
                return uid.map((u, idx)=> [u, nickname[idx]]);
            }}
            formatter={(item)=> {
                return `${item[0]}(${item[1]})`
            }}
        />
    )
}

export default withTranslation()(UidFilter);
