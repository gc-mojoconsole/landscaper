import React from 'react';
import {withTranslation} from 'react-i18next';

import {Checkbox, Input, Button} from 'antd';

const aggregate_query = [
    { "$group": { "_id":  null,uid: {$push: "$_id"},nickname: {$push: "$nickname"}}},
    { "$project":{uid:true,nickname:true}}
];

const styles = {
    outer: {padding: '10px'},
    list: {display: 'flex', maxWidth: '250px', flexWrap: 'wrap', maxHeight: '30vh', overflowY: 'auto', padding: '1px 1px'},
    action: {display: 'flex', marginTop:'5px', justifyContent: 'flex-end'},
    title: {fontSize:'18px', fontWeight:'bold'}
}

class UidFilter extends React.Component {
    state = {
        uid: [],
        names: [],
        search: '',
        toggled: {}
    }
    async componentDidMount() {
        const {manager} = this.props;
        const {uid, nickname} = (await manager.getDBAggregate('players', aggregate_query))[0];
        this.setState({uid: uid, names: nickname});
    }

    toggle(e, u) {
        const {column, setQuery, parser, query} = this.props;
        let {toggled} = this.state;
        toggled[u] =  e.target.checked;
        this.setState(toggled);
        if (Object.entries(toggled).some(([_, v])=> v)){
            query[column] = {}
            query[column]['$in'] = Object.entries(toggled).reduce((acc, [uid,v])=> {
                if (v) { acc.push(parser?parser(uid): uid);}
                return acc;
            }, [])
        } else {
            query[column] = undefined;
        }
        setQuery(JSON.parse(JSON.stringify(query)));
    }

    clearFilter = ()=> {
        this.setState({search: "", toggled: {}});
        const {column, setQuery, query} = this.props;
        query[column] = undefined;
        setQuery(JSON.parse(JSON.stringify(query)));
    }

    render() {
        const {uid, names, toggled, search} = this.state;
        const {t} = this.props;
        return (
            <div style={styles.outer}>
                <div style={styles.title}>{t("Filter")}</div>
                <Input placeholder={`${t("Search")} (${t("Total")}: ${uid.length})`} onChange={(e)=> this.setState({search: e.target.value})}></Input>
                <div style={styles.list}>
                    {uid.map((u,idx)=> {
                    let item = `${names[idx]}(${u})`;
                    if (search !== '' && item.toLowerCase().indexOf(search.toLowerCase()) === -1) return null;
                    return <Checkbox key={u} onChange={(e)=> this.toggle(e,u)} checked={toggled[u] === true} style={{marginLeft: 0}}>{item}</Checkbox>})}
                </div>
                <div style={styles.action}>
                    <Button onClick={this.clearFilter}>{t("Clear")}</Button>
                </div>
            </div>
        )
    }
}


export default withTranslation()(UidFilter);
