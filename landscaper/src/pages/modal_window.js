import React from 'react';
import { Modal, Input, Button, notification, Select } from "antd";
import { withTranslation } from 'react-i18next';
import {FileZipOutlined, FileSearchOutlined} from '@ant-design/icons';

const { Option } = Select;
class ModalWindow extends React.Component {
    state = {
      gc_path: null,
      language: 'en'
    }
    manager = null

    constructor(props) {
      super(props);
      this.manager = window.landscaper;
    }

    componentDidMount() {
      this.manager.backend.getData("grasscutter_path").then((data) => {
        this.setState({gc_path: data});
      }).catch(_ => {
        this.manager.backend.setData("grasscutter_path", "").then((_) => {
          this.setState({gc_path: ""});
        });
      });

      this.manager.backend.getData('setting-language').then((data) => {
        this.setState({language: data});
      }).catch((error) => {
          console.log(error);
          this.manager.backend.setData('setting-language','en');
      })
    }

    changeLanguage(value) {
      this.manager.backend.setData('setting-language',value);
      this.props.i18n.changeLanguage(value);
      this.setState({language: value});
    }

    async onNavigate(){
      const {t} = this.props;
      let path = await this.manager.backend.showOpenDialog(t("Select grasscutter installation path"), {filters: [
        {name: 'Grasscutter', extensions: ['jar']}
      ]});
      if (path.length === 0) return;
      try{
        if (await this.checkFile(path[0])){
          await this.manager.backend.setData("grasscutter_path", path[0]);
          window.landscaper.path = path[0];
          window.landscaper.initilize();
          this.setState({gc_path: path[0]});
        }
      } catch (e) {
        notification.info({
          message: t("Invalid grasscutter selected"),
          description:
            t("Please select a valid path for grasscutter installation path first"),
          placement: "top",
        });
      }
    }

    async checkFile(path){
      if (!path.endsWith('.jar')) {
        return Promise.reject();
      }
      let fileStats = await this.manager.backend.getStats(path);
      return Promise.resolve(fileStats.isFile);
    }

    async onclose(){
      const {t, close} = this.props;
      let gc_path = await this.manager.backend.getData('grasscutter_path');
      console.log(gc_path);
      if (await this.checkFile(gc_path)){
        close({select_path_visible: false});
        return Promise.resolve();
      }else{
        notification.info({
          message: t("Please select path first"),
          description:
            t("Please select a valid path for grasscutter installation path first"),
          placement: "top",
        });
        return Promise.reject();
      }
    }

    render() {
        const {t, modal} = this.props;
        const {select_path_visible} = modal;
        const {gc_path} = this.state;
        return (<div>
            <Modal
              title={t("Select grasscutter installation path")}
              centered
              visible={select_path_visible}
              footer={null}
              onCancel={this.onclose.bind(this)}
              maskClosable
              closable
              maskStyle={{backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)"}}
              okText="Close"
              onOk={this.onclose.bind(this)}
            >
              <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>{t('Language')}</div>
                <Select value={this.state.language} style={{width: '200px', marginRight: '41px'}} onChange={this.changeLanguage.bind(this)}>
                    <Option value="en">English</Option>
                    <Option value="zh">中文</Option>
                </Select>
              </div>,
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <Input size="large" placeholder={t("Path to grasscutter jar file")} prefix={<FileZipOutlined />} value={gc_path?gc_path: null} />
              <Button type="primary" shape="circle" style={{marginLeft: '10px'}} onClick={this.onNavigate.bind(this)} icon={<FileSearchOutlined />} />
            </div>
            <Button style={{
              marginTop: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            }} disabled={gc_path === ''} onClick={this.onclose.bind(this)} type="primary" shape="round">{t("Confirm")}</Button>
          </Modal>

        </div>)
    }
}

export default withTranslation()(ModalWindow);