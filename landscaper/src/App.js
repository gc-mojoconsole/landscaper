import React from 'react';
import LandscaperLayout from './pages/layout';
import SettingsPage from './pages/settings';
import PluginPage from './pages/plugin';
import InfoPage from './pages/info';
import MarketPage from './pages/market';
import DatabasePage from './pages/database';
import ModalWindow from './pages/modal_window';
import {Spin} from "antd";
import {withTranslation} from "react-i18next";
import './App.css';

const getView = (view, state)=>{
  switch(view){
    case "info": return (<InfoPage parentState={state} manager={state.manager} />);
    case "plugin": return (<PluginPage manager={state.manager}/>);
    case "market": return (<MarketPage manager={state.manager}/>);
    case "setting": return (<SettingsPage manager={state.manager}/>);
    case "database": return (<DatabasePage manager={state.manager}/>);
    default: 
  }
}
class App extends React.Component {
  updateHandler = null;
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
        manager: null
      }
  }
  componentDidMount() {
      this.setState({
        manager: window.landscaper, 
      });
      this.handleUpdate();
      this.updateHandler = this.handleUpdate.bind(this);
      window.landscaper.mountWatcher(this.updateHandler);
      window.landscaper.backend.getData('setting-language').then((lang)=>{
        this.props.i18n.changeLanguage(lang);
      }).catch((err)=>{
        console.log(err);
        this.props.i18n.changeLanguage('en');
      })
  }

  handleUpdate() {
    const manager = window.landscaper;
    if (manager){
      this.setState({
        loading: !manager.ready,
        grasscutter_path: manager.path,
        grasscutter_version: manager.version.tag,
        grasscutter_githash: manager.version.hash,
        modal: {select_path_visible: manager.path === null || manager.path === ''}
      })
    }
  }

  componentWillUnmount() {
    window.landscaper.unmountWatcher(this.updateHandler);
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
      <LandscaperLayout onSelect={this.changeView.bind(this)} content={getView(loading?"":content, this.state)} manager={this.state.manager} />
      <ModalWindow modal={this.state.modal} close={this.control_modal.bind(this)} />
      </Spin>
    );
  }
}

export default withTranslation()(App);
