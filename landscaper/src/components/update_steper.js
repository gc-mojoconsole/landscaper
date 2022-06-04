import React from 'react';
import {Segmented, Steps, Progress, Button, Select, Form, Typography, Tooltip, Tag, Spin } from 'antd';
import {withTranslation} from 'react-i18next';
import { DownloadOutlined, FileZipOutlined, CopyOutlined, SmileOutlined, LoadingOutlined } from '@ant-design/icons';
import Link from '../components/link';
import Updater from '../core/updater';

const { Step } = Steps;
const { Option } = Select;
const { Item } = Form;
const { Text } = Typography;

class UpdateSteper extends React.Component {
    state = {
        step: 0,
        status: '',
        percent: 0,
        current: 0,
        page: 1,
        download_url: null
    }

    constructor(props) {
        super(props);
        this.state.event = props.event;
        this.state.branch = props.branch;
        this.state.workflows = props.manager.workflows;
        this.state.commit = props.commit;
        this.state.loading = false;
    }

    componentDidMount() {
        if (this.state.commit !== null) {
            this.getDownloadUrl();
        }
    }

    async execute(){
        this.setState({current: 1, status: "process"});
        let updater = new Updater(this.props.manager.backend, this.state.download_url, this.props.output, this.setState.bind(this));
        window.updater = updater;
        await updater.execute();
    }

    async fetchWorkflows(){
        const {event, branch, page} = this.state;
        let ret = await this.props.manager.fetchCustomWorkflows(event, branch, page);
        this.setState({workflows: ret, loading: false});
    }

    async getDownloadUrl(){
        this.setState({
            download_url: await this.props.manager.getArtifactUrl(this.state.workflows[this.state.commit])}
        );
    }

    componentDidUpdate() {
        const {step, status} = this.state;
        if (step === 3 && status === "process"){
            this.setState({status: "success", current: 2})
        }
    }

    render() {
        const {t, onClose, manager} = this.props;
        const {step, status, percent, current, event, branch, commit, workflows, loading, download_url} = this.state;

        const Commit = ({data}) => <div>
            <Text code><Link href={`https://github.com/Grasscutters/Grasscutter/commit/${data.head_sha}`}>{data.head_commit.id.slice(0,7)}</Link></Text>
            <Tooltip title={<div>
                <Tag>{t("Time")}</Tag> {data.created_at} <br />
                <div  style={{wordWrap: "break-word", whiteSpace: "pre-wrap", marginTop: '5px', maxHeight: '60vh', overflowY: 'auto'}}>
                    <Tag>{t("Message")}</Tag> {data.head_commit.message}
                </div>
                <div style={{marginTop: '5px'}}>
                    <Tag>{t("Committer")}</Tag> {data.actor.login}
                </div>
            </div>} overlayStyle={{minWidth: '60vw'}} mouseEnterDelay={0.5}>
                {data.head_commit.message.slice(0, 80)}
            </Tooltip>
        </div>

        return (
            <div>
                <Steps current={current}>
                    <Step title={t("Select Target")} description={t("Select artifacts to be downloaded.")}/>
                    <Step title={t("Working")} description={t("Working on it.")}/>
                    <Step title={t("Finish")} description={t("Done")}/>
                </Steps>
                <div style={{marginTop: '20px'}}>
                    {current === 0? <Spin spinning={loading}>
                        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
                        <Item label={t("Event")}>
                            <Segmented block options={[
                                {label: "Push", value: "push"},
                                {label: "Pull Request", value: "pull_request"}
                            ]} value={event} onChange={(v)=>this.setState({event: v, commit: null, loading: true, download_url: null}, this.fetchWorkflows.bind(this))} />
                        </Item>
                        <Item label={t("Branch")}>
                            <Select value={branch} onChange={(v)=>this.setState({branch: v, commit: null, loading: true, download_url: null}, this.fetchWorkflows.bind(this))}>
                                {manager.branches.map( (b)=>
                                    <Option value={b} key={b}>{b}</Option>
                                )}
                            </Select>
                        </Item>
                        <Item label={t("Commit")}>
                            <Select value={commit} onChange={(v)=>this.setState({commit: v}, this.getDownloadUrl.bind(this))}>
                                {workflows.map( (b, idx)=>
                                    <Option value={idx} key={idx}>
                                        <Commit data={b}/>
                                    </Option>
                                )}
                            </Select>
                        </Item>
                    </Form>
                    <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
                        <Button onClick={this.execute.bind(this)} disabled={download_url === null} type="primary" shape="round">{t("Execute")}</Button>
                        {status !== 'process' ? <Button type="danger" shape="round" onClick={()=>{onClose(false)}}>{t("Close")}</Button>: null}                
                    </div>
                    </Spin> :null}
                    {current === 1 ?
                    <Steps direction="vertical" current={step} status={status}>
                        <Step title={t("Download")} icon={step===0 && status=== "process"? <LoadingOutlined />:<DownloadOutlined />} description={t("Download the latest build from development branch.")} />
                        <Step title={t("Extract")} icon={step===1 && status=== "process"? <LoadingOutlined />:<FileZipOutlined />} description={t("Extract the zip file")} />
                        <Step title={t("Copy")} icon={step===2 && status=== "process"? <Progress width={26} type="circle" percent={percent} showInfo={false} strokeWidth={18} /> :<CopyOutlined />} description={t("Copy the bundle")} />
                        <Step title={t("Done")} icon={step===3 && status=== "process"? <LoadingOutlined />:<SmileOutlined />} description={t("Update finished")} />
                    </Steps> : null}

                    {step === 3 ?<Button onClick={()=>{onClose(status === 'success')}}>{t("Done")}</Button> : null} 
                </div>
            </div>

        );
    }
}

export default withTranslation()(UpdateSteper);