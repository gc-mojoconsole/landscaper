import React from 'react';
import {withTranslation} from 'react-i18next';

import {Checkbox, Input, Button} from 'antd';


const styles = {
    outer: {padding: '10px'},
    list: {display: 'flex', maxWidth: '250px', flexWrap: 'wrap', maxHeight: '30vh', overflowY: 'auto', padding: '1px 1px'},
    action: {display: 'flex', marginTop:'5px', justifyContent: 'flex-end'},
    title: {fontSize:'18px', fontWeight:'bold'}
}

class Filter extends React.Component {
    state = {
        list: [],
        search: '',
        toggled: {}
    }
    async componentDidMount() {
        const {manager} = this.props;
        this.setState({ list: await manager.getDBDistinct(this.props.collection, this.props.column)});
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
        }  else {
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

    static getDerivedStateFromProps(props, state) {
        const {column, query} = props;
        if (query[column] !== undefined && query[column]['$in'] !== undefined) {
            return { toggled: query[column]['$in'].reduce((acc, key)=> {
                    acc[key.toString()] = true;
                    return acc;
                }, {}) 
            }
        }
    }

    render() {
        const {toggled, search, list} = this.state;
        const {t, formatter} = this.props;
        return (
            <div style={styles.outer}>
                <div style={styles.title}>{t("Filter")}</div>
                <Input value={search} placeholder={`${t("Search")} (${t("Total")}: ${list.length})`} onChange={(e)=> this.setState({search: e.target.value})}></Input>
                <div style={styles.list}>
                    {list.map((u,idx)=> {
                    let item = formatter? formatter(u) :`${u}`;
                    if (search !== '' && item.toLowerCase().indexOf(search.toLowerCase()) === -1) return null;
                    return <Checkbox key={idx} onChange={(e)=> this.toggle(e,u)} checked={toggled[u] === true} style={{marginLeft: 0}}>{item}</Checkbox>})}
                </div>
                <div style={styles.action}>
                    <Button onClick={this.clearFilter}>{t("Clear")}</Button>
                </div>
            </div>
        )
    }
}


export default withTranslation()(Filter);
