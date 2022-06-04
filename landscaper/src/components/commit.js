import React from 'react';
import {List, Typography, Row, Button} from 'antd';
import Link from "../components/link";

const {Text} = Typography;


class GitCommitItem extends React.Component {
    state = {
        toggleVisible: false,
        toggled: false,
        desc: "",
        detail: []
    }
    componentDidMount() {
        const {commit} = this.props.data;
        const MAX_FIRST_LINE = 60
        let {message} = commit;
        let grouped = message.replaceAll(/[\n\r]{2}/gm, "\n").split('\n');
        let desc = ""
        let toggleVisible = false;
        let detail = [];
        if (grouped[0].length > MAX_FIRST_LINE){
            desc = grouped[0].slice(0, MAX_FIRST_LINE - 3) + '...';
            grouped.splice(1,0, grouped[0].slice(MAX_FIRST_LINE - 3));
            toggleVisible = true;
        } else {
            desc = grouped[0];
        }
        if (grouped.length > 1) {
            toggleVisible = true;
        }
        
        if (toggleVisible) {
            grouped.slice(1).forEach((line, index) => {
                detail.push(<br key={index}/>);
                detail.push(line);
            });
        }
        this.setState({
            desc, toggleVisible, detail
        })
    }
    showDetail(){
        this.setState({toggled: !this.state.toggled});
    }
    render() {
        const {sha} = this.props.data;
        const {toggleVisible, toggled, desc, detail} = this.state;

        return (
                <List.Item key={sha}>
                    <Row style={{flexWrap: "nowrap"}}>
                    {/* eslint-disable-next-line */}
                        <Text code style={{minWidth: "70px"}}><Link href={`https://github.com/Grasscutters/Grasscutter/commit/`}>{sha.slice(0,6)}</Link></Text>
                        <div>
                            {desc}
                            {toggleVisible? <Button shape="circle" size="small" onClick={this.showDetail.bind(this)}>&middot;&middot;&middot;</Button>: null}
                            {toggled? 
                                <Text>{detail}</Text> 
                                :null}
                        </div>
                    </Row>
                </List.Item>
        )
    }
}

export default GitCommitItem;