import React from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  GithubOutlined,
  AppstoreAddOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import "../styles/layout.css";
import { withTranslation } from 'react-i18next';
const { Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const THEME='dark';

class LandscaperLayout extends React.Component {
  state = {
    collapsed: true,
  };
  onCollapse = (collapsed) => {
    this.setState({
      collapsed,
    });
  };

  render() {
    const {t, onSelect, manager} = this.props;
    const items = [
      getItem(t('Grasscutter'), 'info', <InfoCircleOutlined />),
      manager? getItem(t('Installed Plugins'), 'plugin', manager.installed.some((pi)=> pi.hasUpdate())?
         <Badge dot ><AppstoreAddOutlined className='icon-patch'/></Badge>:
         <AppstoreAddOutlined />) : getItem(t('Installed Plugins'), 'plugin', <AppstoreAddOutlined />),
      getItem(t('Plugin Market'), 'market', <GithubOutlined />),
      getItem(t('Settings'), 'setting', <SettingOutlined />),
    ];
    const { content } = this.props;
    const { collapsed } = this.state;
    return (
      <Layout
        style={{
          minHeight: '100vh',
        }}
      >
        <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse} theme={THEME}>
          <div className="logo" />
          <Menu theme={THEME} defaultSelectedKeys={['info']} mode="inline" items={items} onSelect={onSelect} />
        </Sider>
        <div style={{overflowX: "hidden", overflowY: "overlay", width: "100%", padding:"20px", maxHeight: "100vh"}}>{content? content: "Loading"}</div>
      </Layout>
    );
  }
}

export default withTranslation()(LandscaperLayout);