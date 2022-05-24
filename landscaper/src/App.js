import React from 'react';
import LandscaperLayout from './pages/layout';
import SettingsPage from './pages/settings';
import PluginPage from './pages/plugin';
import InfoPage from './pages/info';
import MarketPage from './pages/market';
import PluginManager from './core/plugin';
import ModalWindow from './pages/modal_window';
import * as zip from "@zip.js/zip.js";
import {Spin} from "antd";
import {withTranslation} from "react-i18next";
import './App.css';

const neu = window.Neutralino;

const getView = (view, state)=>{
  switch(view){
    case "info": return (<InfoPage parentState={state} manager={state.manager} />);
    case "plugin": return (<PluginPage manager={state.manager}/>);
    case "market": return (<MarketPage manager={state.manager}/>);
    case "setting": return (<SettingsPage path={state.grasscutter_path}/>);
    default: 
  }
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state ={
        content: "info",
        modal: {
          select_path_visible: false,
        },
        grasscutter_path: null,
        grasscutter_version: "",
        grasscutter_githash: "",
        loading: true,
        manager: new PluginManager()
      }
  }
  componentDidMount() {
    neu.storage.getData("grasscutter_path").then(path => {
      if (!path) {
        return Promise.reject();
      }
      this.setState({grasscutter_path: path});
      if (path) {
        this.setState({manager: new PluginManager(path) });
        this.parseJar(path);
      }
    }).catch(() => {
      this.setState({
        modal: {select_path_visible: true},
        loading: false
      });
    })
    window.Neutralino.storage.getData('setting-language').then((lang)=>{
      this.props.i18n.changeLanguage(lang);
    }).catch((err)=>{
      console.log(err);
      this.props.i18n.changeLanguage('en');
    })
  }
  async parseJar(path){
    neu.filesystem.readFile(path.replace(/[^/]+$/,'') + "/config.json").then(data => {
      let config = JSON.parse(data);
      this.manager.config = config;
    }).catch();


    let data = await neu.filesystem.readBinaryFile(path);
    data = new Uint8Array(data);
    let zip_entries = await new zip.ZipReader(new zip.Uint8ArrayReader(data), {useWebWorkers: true}).getEntries();
    const regex = /VERSION[\s\S]*ConstantValue[^0-9\-.a-zA-Z]*([0-9.\-a-zA-Z]+)[\s\S]*GIT_HASH[^0-9a-f]*([0-9a-f]+)[\s\S]*Code/;
    zip_entries.forEach((entry) => {
        if (entry.filename === "emu/grasscutter/BuildConfig.class") {
            entry.getData(new zip.TextWriter()).then((data) => {
                let match = data.match(regex);
                this.setState({
                  grasscutter_version : match[1],
                  grasscutter_githash : match[2],
                  loading: false
                });
            })
        }
    });
}
  changeView(view) {
    if (!window.currentEditor) {
      this.setState({content: view.key});
    } else {
      window.currentEditor.safeExit().then(()=>{
        this.setState({content: view.key});
      })
    }
  }

  control_modal (modal_node) {
    // Object.keys(modal_node).forEach(key => {
    //   this.state.modal[key] = modal_node[key];
    // });
    // this.setState({});
    this.setState({modal: modal_node});
    if (modal_node.select_path_visible === false) {
      this.setState({loading: true});
      this.componentDidMount();
    }
  }

  render() {
    const {content, loading} = this.state;
    return (
      <Spin spinning={loading} size="large">
      <LandscaperLayout onSelect={this.changeView.bind(this)} content={getView(loading?"":content, this.state)} />
      <ModalWindow modal={this.state.modal} close={this.control_modal.bind(this)} />
      </Spin>
    );
  }
}

export default withTranslation()(App);
