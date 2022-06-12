import React from 'react';
import {withTranslation} from 'react-i18next';
import {Table, Popconfirm, Button, Checkbox} from 'antd';
import {EyeOutlined, ClearOutlined} from '@ant-design/icons';

class DbTable extends React.Component {
    state = {
        pagenation: {
            current: 1,
            total: 0,
            pageSize: 20,
        },
        columns: [],
        active_columns: [],
        data: [],
        options: {},
        query: {},
        refresh: false
    }
    constructor(props) {
        super(props);
        const {per_page, columns, default_columns} = props;
        this.state.pagenation.pageSize = per_page? per_page: 10;
        this.columns = columns?columns: null;
        this.state.active_columns = default_columns? default_columns : [1] * columns.length;
    }

    componentDidMount() {
        const {manager, collection} = this.props;
        const {query} = this.state;
        (async () => {
            this.state.pagenation.total = await manager.getRecordCount(collection, query);
            this.setState({});
            await this.fetchData();
        })();
    }

    async fetchData() {
        const {manager, collection} = this.props;
        let data = await manager.getRecord(collection, {query: this.state.query, pagenation: {per_page: this.state.pagenation.pageSize, page_no: this.state.pagenation.current - 1}, options: this.state.options});
        this.setState({data: data, refresh: false});
    }

    checkColumn(i) {
        let idx = this.state.active_columns.indexOf(i);
        if (idx !== -1 ) {
            this.state.active_columns.splice(idx, 1);
            this.setState({});
        } else {
            let cols = [...this.state.active_columns, i];
            cols.sort();
            this.setState({active_columns: cols})
        }
    }

    handleTableChange(newPagination, filters, sorter) {
        let options = this.state.options;
        if (sorter.order) {
            options.sort = {};
            options.sort[sorter.field] = sorter.order === 'ascend' ? 1: -1
        } else {
            sorter.sort = undefined;
        }
        this.setState({pagenation: newPagination, options}, this.fetchData.bind(this));
    }

    static getDerivedStateFromProps(props, state) {
        if (props.query) {
            if (JSON.stringify(props.query) !== JSON.stringify(state.query)){
                return {query: JSON.parse(JSON.stringify(props.query)), refresh: true};
            }
        }
    }

    componentDidUpdate() {
        const {manager, collection} = this.props;
        const {query, refresh} = this.state
        if (refresh) {
            // eslint-disable-next-line
            manager.getRecordCount(collection, query).then((count)=> this.state.pagenation.total = count);
            this.fetchData();
        }
    }

    render() {
        const {rowKey, t, columns, setQuery} = this.props;
        const {active_columns, pagenation, data, query} = this.state;
        const show_columns = active_columns.reduce((acc, column) =>{
            acc.push(columns[column]);
            return acc;
        }, [])
        return (
            <div>
                <Popconfirm placement='bottomRight' icon={null} cancelButtonProps={{style: {display: 'none'}}} okButtonProps={{style: {display: 'none'}}}
                    title={<div>{columns.map((column, i) =>
                        <Checkbox key={i} checked={active_columns.indexOf(i) !== -1} onChange={()=> {this.checkColumn(i)}}>{t(column.title)}</Checkbox>
                    )}</div>}
                >
                    <Button style={{marginBottom: '10px', float: 'right'}} shape="round">
                        <EyeOutlined /> {t("View")}
                    </Button>
                </Popconfirm>
                <Button disabled={JSON.stringify(query) === '{}'} type="danger" onClick={()=>setQuery({})} style={{marginBottom: '10px', marginRight: '5px', float: 'right'}} shape="round">
                    <ClearOutlined /> {t("Clear Filter")}
                </Button>
                <Table columns={show_columns} pagination={pagenation} dataSource={data} rowKey={rowKey} onChange={this.handleTableChange.bind(this)}/>
            </div>
        )
    }
}

export default withTranslation()(DbTable);