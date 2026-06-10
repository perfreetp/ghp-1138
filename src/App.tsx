import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Space, Button } from 'antd';
import {
  BellOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PhoneOutlined,
  BarChartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PrinterOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from './store/useStore';
import AlarmMonitor from './modules/AlarmMonitor';
import FloorPlan from './modules/FloorPlan';
import DeviceStatus from './modules/DeviceStatus';
import VideoPoints from './modules/VideoPoints';
import DutyLog from './modules/DutyLog';
import Contacts from './modules/Contacts';
import Statistics from './modules/Statistics';
import AlarmModal from './components/AlarmModal';
import PendingTasks from './components/PendingTasks';
import DrillPlayer from './components/DrillPlayer';
import PrintDisposal from './components/PrintDisposal';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    alarms,
    pendingTasks,
    showAlarmModal,
    setShowAlarmModal,
    selectedAlarm,
    setSelectedAlarm,
    currentUser,
  } = useStore();

  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const [showDrillPlayer, setShowDrillPlayer] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [alarmSoundEnabled, setAlarmSoundEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pendingUrgentAlarms = alarms.filter(
      (a) => a.status === 'pending' && a.level === 'urgent'
    );

    if (pendingUrgentAlarms.length > 0 && !showAlarmModal) {
      const firstUrgentAlarm = pendingUrgentAlarms.sort(
        (a, b) => dayjs(a.alarmTime).valueOf() - dayjs(b.alarmTime).valueOf()
      )[0];
      setSelectedAlarm(firstUrgentAlarm);
      setShowAlarmModal(true);

      if (alarmSoundEnabled) {
        playAlarmSound();
      }
    }
  }, [alarms, showAlarmModal, alarmSoundEnabled]);

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.5);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const pendingCount = alarms.filter((a) => a.status === 'pending').length;
  const highPriorityTasks = pendingTasks.filter((t) => t.priority === 'high' && !t.completed).length;

  const menuItems: MenuProps['items'] = [
    {
      key: 'alarm',
      icon: (
        <Badge count={pendingCount} offset={[5, -5]} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '报警监视',
    },
    {
      key: 'floor',
      icon: <EnvironmentOutlined />,
      label: '楼层平面',
    },
    {
      key: 'device',
      icon: <AppstoreOutlined />,
      label: '设备状态',
    },
    {
      key: 'video',
      icon: <VideoCameraOutlined />,
      label: '视频点位',
    },
    {
      key: 'duty',
      icon: <FileTextOutlined />,
      label: '值班日志',
    },
    {
      key: 'contact',
      icon: <PhoneOutlined />,
      label: '联络清单',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '复盘统计',
    },
  ];

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `当前用户：${currentUser}`,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const toolMenu: MenuProps['items'] = [
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: '打印处置单',
      onClick: () => setShowPrintModal(true),
    },
    {
      key: 'drill',
      icon: <PlayCircleOutlined />,
      label: '演练回放',
      onClick: () => setShowDrillPlayer(true),
    },
  ];

  const renderModule = () => {
    switch (currentModule) {
      case 'alarm':
        return <AlarmMonitor />;
      case 'floor':
        return <FloorPlan />;
      case 'device':
        return <DeviceStatus />;
      case 'video':
        return <VideoPoints />;
      case 'duty':
        return <DutyLog />;
      case 'contact':
        return <Contacts />;
      case 'statistics':
        return <Statistics />;
      default:
        return <AlarmMonitor />;
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#0a1628',
          borderBottom: '1px solid #1f2f45',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <WarningOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
            消防控制室值守台
          </div>
          {highPriorityTasks > 0 && (
            <Badge count={highPriorityTasks} offset={[0, 0]} size="small" status="error">
              <Button
                type="primary"
                danger
                icon={<ClockCircleOutlined />}
                onClick={() => {}}
                style={{ marginLeft: 16 }}
              >
                未完成事项 ({highPriorityTasks})
              </Button>
            </Badge>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Dropdown menu={{ items: toolMenu }} placement="bottomRight">
            <Button icon={<AppstoreOutlined />}>工具</Button>
          </Dropdown>
          <div style={{ color: '#91caff', fontSize: 14 }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {currentTime}
          </div>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: '#e6f0ff' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <span>{currentUser}</span>
            </Space>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={180} theme="dark" style={{ background: '#0f1f35' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentModule]}
            onClick={({ key }) => setCurrentModule(key)}
            items={menuItems}
            theme="dark"
            style={{ height: '100%', borderRight: 0, background: '#0f1f35' }}
          />
        </Sider>

        <Layout style={{ padding: 16, overflow: 'hidden' }}>
          <Content
            style={{
              background: '#0a1628',
              padding: 16,
              margin: 0,
              minHeight: 280,
              height: '100%',
              overflow: 'auto',
            }}
          >
            {renderModule()}
          </Content>
        </Layout>
      </Layout>

      <PendingTasks />

      {showAlarmModal && selectedAlarm && (
        <AlarmModal
          open={showAlarmModal}
          alarm={selectedAlarm}
          onClose={() => setShowAlarmModal(false)}
        />
      )}

      {showDrillPlayer && (
        <DrillPlayer open={showDrillPlayer} onClose={() => setShowDrillPlayer(false)} />
      )}

      {showPrintModal && (
        <PrintDisposal open={showPrintModal} onClose={() => setShowPrintModal(false)} />
      )}
    </Layout>
  );
};

export default App;
