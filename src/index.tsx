import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            colorInfo: '#1677ff',
            borderRadius: 4,
            fontSize: 14,
          },
          components: {
            Layout: {
              headerBg: '#0a1628',
              siderBg: '#0f1f35',
              bodyBg: '#0a1628',
            },
            Menu: {
              darkItemBg: '#0f1f35',
              darkSubMenuItemBg: '#0a1628',
              darkItemSelectedBg: '#1677ff',
            },
            Table: {
              headerBg: '#0f1f35',
              rowHoverBg: '#1a2a42',
              borderColor: '#1f2f45',
            },
            Card: {
              headerBg: '#0f1f35',
              actionsBg: '#0a1628',
            },
            Modal: {
              headerBg: '#0f1f35',
              contentBg: '#0a1628',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
