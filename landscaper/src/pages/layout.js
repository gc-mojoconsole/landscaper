import React from 'react';
import { Layout, Menu } from 'antd';
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
    const {t, onSelect} = this.props;
    const items = [
      getItem(t('Grasscutter'), 'info', <InfoCircleOutlined />),
      getItem(t('Installed Plugins'), 'plugin', <AppstoreAddOutlined />),
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
        <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
          <div className="logo" />
          <Menu theme="dark" defaultSelectedKeys={['info']} mode="inline" items={items} onSelect={onSelect} />
        </Sider>
        <div style={{overflowX: "hidden", overflowY: "overlay", width: "100%", padding:"20px", maxHeight: "100vh"}}>{content? content: "Loading"}</div>
      </Layout>
    );
  }
}

export default withTranslation()(LandscaperLayout);