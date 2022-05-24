import React from 'react';
import { Steps, Progress, Button } from 'antd';
import {withTranslation} from 'react-i18next';
import { DownloadOutlined, FileZipOutlined, CopyOutlined, SmileOutlined, LoadingOutlined } from '@ant-design/icons';
import * as zip from "@zip.js/zip.js";
const { Step } = Steps;

const neu = window.Neutralino;

class UpdateSteper extends React.Component {
    state = {
        step: 0,
        status: 'process',
        percent: 0
    }

    componentDidMount() {
        this.execute().catch((e)=>{
            console.log(e);this.setState({status:'error'})
            try{
                neu.filesystem.removeFile('./tmp').catch();
            } catch(e){
                console.log(e);
            }
        });
    }

    async execute(){
        let command = `curl -L https://nightly.link/Grasscutters/Grasscutter/workflows/build/${this.props.branch?this.props.branch:'development'}/Grasscutter.zip -o ./tmp`
        let output = await neu.os.execCommand(command);
        window.my = output;
        if (output.exitCode !== 0) {
            this.setState({status: 'error'});
            return;
        }
        let data = new Uint8Array(await neu.filesystem.readBinaryFile('./tmp'));
        this.setState({step: this.state.step + 1}); // step = 1, extracting
        // console.log(data);
        let data_reader = new zip.Uint8ArrayReader(data);
        // console.log(data_reader);
        let zip_entries = await new zip.ZipReader(data_reader, {useWebWorkers: true}).getEntries();
        for (var i = 0; i < zip_entries.length; i++) {
            let entry = zip_entries[i];
            if (entry.filename.match(/grasscutter.*\.jar/)) {
                data = await entry.getData(new zip.Uint8ArrayWriter());
                break;       
            }
        }
        this.setState({step: this.state.step + 1}); // step = 2, copy
        const target_filename = this.props.output? this.props.output: 'tmp.jar';
        const CHUNK_SIZE = 1_000_000;
        try{
            neu.filesystem.removeFile(target_filename).catch();
        } catch(e){
            console.log(e);
        }

        for (var current = 0; current < data.length; current+=CHUNK_SIZE){
            let end = current + CHUNK_SIZE > data.length ? data.length: current + CHUNK_SIZE;
            await neu.filesystem.appendBinaryFile(target_filename, data.slice(current, end));
            this.setState({percent: Math.ceil(current / data.length * 100)});
        }
        // neu.filesystem.writeBinaryFile(target_filename, data);

        this.setState({step: this.state.step + 1, status: "success"}); // step = 3, finish
        try{
            neu.filesystem.removeFile('./tmp').catch();
        } catch(e){
            console.log(e);
        }
    }

    render() {
        const {t, onClose} = this.props;
        const {step, status, percent} = this.state;
        return (
            <div>
                <Steps direction="vertical" current={step} status={status}>
                    <Step title={t("Download")} icon={step===0 && status=== "process"? <LoadingOutlined />:<DownloadOutlined />} description={t("Download the latest build from development branch.")} />
                    <Step title={t("Extract")} icon={step===1 && status=== "process"? <LoadingOutlined />:<FileZipOutlined />} description={t("Extract the zip file")} />
                    <Step title={t("Copy")} icon={step===2 && status=== "process"? <Progress width={26} type="circle" percent={percent} showInfo={false} strokeWidth={18} /> :<CopyOutlined />} description={t("Copy the bundle")} />
                    <Step title={t("Done")} icon={step===3 && status=== "process"? <LoadingOutlined />:<SmileOutlined />} description={t("Update finished")} />
                </Steps>
                {step === 3 || status !== "process" ?<Button onClick={()=>{onClose(status === 'success')}}>{t("Close")}</Button> : null} 
            </div>

        );
    }
}

export default withTranslation()(UpdateSteper);