import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
  Badge,
  Descriptions,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import type { Alarm, AlarmStatus, AlarmLevel, AlarmFlowStatus } from '../types';

const { Search } = Input;
const { Option } = Select;

const AlarmMonitor: React.FC = () => {
  const {
    alarms,
    setSelectedAlarm,
    setShowAlarmModal,
    confirmAlarm,
    markFalseAlarm,
    currentUser,
    addPhoneRecord,
    addDisposalStep,
    getDisposalStepsByAlarm,
    phoneRecords,
    locateAlarmOnFloor,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<AlarmStatus | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<AlarmLevel | 'all'>('all');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);
  const [phoneForm] = Form.useForm();
  const [stepForm] = Form.useForm();
  const [urgentAlarms, setUrgentAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    const urgent = alarms.filter((a) => a.status === 'pending' && a.level === 'urgent');
    setUrgentAlarms(urgent);

    if (urgent.length > 0) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [alarms]);

  const filteredAlarms = alarms.filter((alarm) => {
    if (statusFilter !== 'all' && alarm.status !== statusFilter) return false;
    if (levelFilter !== 'all' && alarm.level !== levelFilter) return false;
    if (floorFilter !== 'all' && alarm.floor !== floorFilter) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        alarm.id.toLowerCase().includes(search) ||
        alarm.location.toLowerCase().includes(search) ||
        alarm.type.toLowerCase().includes(search) ||
        alarm.deviceName.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const pendingCount = alarms.filter((a) => a.status === 'pending').length;
  const confirmedCount = alarms.filter((a) => a.status === 'confirmed').length;
  const falseAlarmCount = alarms.filter((a) => a.status === 'false_alarm').length;
  const handledCount = alarms.filter((a) => a.status === 'handled').length;

  const levelColor = {
    general: 'blue',
    important: 'orange',
    urgent: 'red',
  };

  const statusColor: Record<AlarmStatus, string> = {
    pending: 'red',
    confirmed: 'orange',
    false_alarm: 'default',
    handled: 'green',
    archived: 'default',
  };

  const statusText: Record<AlarmStatus, string> = {
    pending: '待处理',
    confirmed: '已确认',
    false_alarm: '误报',
    handled: '已处理',
    archived: '已归档',
  };

  const levelText = {
    general: '一般',
    important: '重要',
    urgent: '紧急',
  };

  const flowStatusColor: Record<AlarmFlowStatus, string> = {
    pending: 'default',
    confirmed: 'blue',
    notified: 'cyan',
    arrived: 'orange',
    disposed: 'green',
    reviewed: 'teal',
    archived: 'default',
    false_alarm: 'magenta',
  };

  const flowStatusText: Record<AlarmFlowStatus, string> = {
    pending: '待确认',
    confirmed: '已确认',
    notified: '已通知',
    arrived: '已到达',
    disposed: '已处置',
    reviewed: '已复核',
    archived: '已归档',
    false_alarm: '误报',
  };

  const handleViewDetail = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setShowAlarmModal(true);
  };

  const handleQuickConfirm = (alarm: Alarm) => {
    Modal.confirm({
      title: '确认报警',
      content: `确定要确认报警 ${alarm.id} 吗？`,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        confirmAlarm(alarm.id, currentUser);
        message.success('报警已确认');
      },
    });
  };

  const handleQuickFalseAlarm = (alarm: Alarm) => {
    Modal.confirm({
      title: '标记误报',
      content: `确定要将报警 ${alarm.id} 标记为误报吗？`,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        markFalseAlarm(alarm.id, currentUser);
        message.success('已标记为误报');
      },
    });
  };

  const handleAddPhoneRecord = (alarm: Alarm) => {
    setCurrentAlarm(alarm);
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async () => {
    const values = await phoneForm.validateFields();
    if (currentAlarm) {
      addPhoneRecord({
        alarmId: currentAlarm.id,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        caller: currentUser,
        receiver: values.receiver,
        phone: values.phone,
        content: values.content,
        duration: values.duration,
      });
      message.success('通话记录已添加');
      setShowPhoneModal(false);
      phoneForm.resetFields();
    }
  };

  const handleAddStep = (alarm: Alarm) => {
    setCurrentAlarm(alarm);
    setShowStepModal(true);
  };

  const handleStepSubmit = async () => {
    const values = await stepForm.validateFields();
    if (currentAlarm) {
      const steps = getDisposalStepsByAlarm(currentAlarm.id);
      addDisposalStep({
        alarmId: currentAlarm.id,
        order: steps.length + 1,
        action: values.action,
        operator: currentUser,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        completed: false,
        remark: values.remark,
      });
      message.success('处置步骤已添加');
      setShowStepModal(false);
      stepForm.resetFields();
    }
  };

  const columns = [
    {
      title: '报警编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string, record: Alarm) => (
        <Space>
          {record.level === 'urgent' && record.status === 'pending' && (
            <Badge status="processing" color="red" />
          )}
          <span className={record.level === 'urgent' && record.status === 'pending' ? 'alarm-urgent' : ''}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '报警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: AlarmLevel) => <Tag color={levelColor[level]}>{levelText[level]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AlarmStatus) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '流转状态',
      dataIndex: 'flowStatus',
      key: 'flowStatus',
      width: 110,
      render: (flowStatus: AlarmFlowStatus) => (
        <Tag color={flowStatusColor[flowStatus]}>{flowStatusText[flowStatus]}</Tag>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 180,
      render: (text: string) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {text}
        </span>
      ),
    },
    {
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 150,
    },
    {
      title: '报警时间',
      dataIndex: 'alarmTime',
      key: 'alarmTime',
      width: 160,
    },
    {
      title: '持续时间',
      key: 'duration',
      width: 100,
      render: (_: any, record: Alarm) => {
        const start = dayjs(record.alarmTime);
        const end = record.handleTime ? dayjs(record.handleTime) : dayjs();
        const diff = end.diff(start, 'minute');
        return <span style={{ color: diff > 10 ? '#ff4d4f' : '#e6f0ff' }}>{diff} 分钟</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Alarm) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedAlarm(record);
              setShowAlarmModal(true);
            }}
          >
            处置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => locateAlarmOnFloor(record)}
          >
            定位
          </Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleQuickConfirm(record)}
              >
                确认
              </Button>
              <Button
                type="default"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleQuickFalseAlarm(record)}
              >
                误报
              </Button>
            </>
          )}
          <Button size="small" icon={<PhoneOutlined />} onClick={() => handleAddPhoneRecord(record)}>
            通话
          </Button>
          <Button size="small" icon={<VideoCameraOutlined />} onClick={() => handleAddStep(record)}>
            处置
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {urgentAlarms.length > 0 && (
        <Card
          style={{
            border: '2px solid #ff4d4f',
            background: 'linear-gradient(135deg, #1a0a0a 0%, #2a1515 100%)',
          }}
          bodyStyle={{ padding: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div className="pulse-animation">
              <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                紧急报警提醒 ({urgentAlarms.length})
              </div>
              <Space wrap>
                {urgentAlarms.map((alarm) => (
                  <Tag key={alarm.id} color="red" style={{ padding: '4px 12px', fontSize: 14 }}>
                    <BellOutlined spin style={{ marginRight: 4 }} />
                    {alarm.id} - {alarm.location} - {dayjs(alarm.alarmTime).format('HH:mm:ss')}
                  </Tag>
                ))}
              </Space>
            </div>
            <Button type="primary" danger size="large" onClick={() => setStatusFilter('pending')}>
              立即处理
            </Button>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{pendingCount}</div>
            <div className="stat-label">待处理</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#faad14' }}>{confirmedCount}</div>
            <div className="stat-label">处理中</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#8c8c8c' }}>{falseAlarmCount}</div>
            <div className="stat-label">误报</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{handledCount}</div>
            <div className="stat-label">已处理</div>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <BellOutlined />
            报警列表
          </Space>
        }
        extra={
          <Space wrap>
            <Search
              placeholder="搜索报警编号、位置、类型..."
              allowClear
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="confirmed">已确认</Option>
              <Option value="false_alarm">误报</Option>
              <Option value="handled">已处理</Option>
            </Select>
            <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 120 }}>
              <Option value="all">全部级别</Option>
              <Option value="urgent">紧急</Option>
              <Option value="important">重要</Option>
              <Option value="general">一般</Option>
            </Select>
            <Select value={floorFilter} onChange={setFloorFilter} style={{ width: 120 }}>
              <Option value="all">全部楼层</Option>
              {[-2, -1, 1, 2, 3, 4, 5].map((floor) => (
                <Option key={floor} value={floor}>
                  {floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAlarms}
          rowKey="id"
          scroll={{ x: 1200, y: 450 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <PhoneOutlined />
            记录通话
            {currentAlarm && <Tag color="blue">{currentAlarm.id}</Tag>}
          </Space>
        }
        open={showPhoneModal}
        onCancel={() => setShowPhoneModal(false)}
        onOk={handlePhoneSubmit}
        okText="保存"
      >
        <Form form={phoneForm} layout="vertical">
          <Form.Item
            name="receiver"
            label="被叫人员"
            rules={[{ required: true, message: '请输入被叫人员' }]}
          >
            <Input placeholder="请输入被叫人员姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话号码"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>
          <Form.Item
            name="content"
            label="通话内容"
            rules={[{ required: true, message: '请输入通话内容' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入通话内容摘要" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="通话时长(秒)"
            rules={[{ required: true, message: '请输入通话时长' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入通话时长" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <VideoCameraOutlined />
            添加处置步骤
            {currentAlarm && <Tag color="blue">{currentAlarm.id}</Tag>}
          </Space>
        }
        open={showStepModal}
        onCancel={() => setShowStepModal(false)}
        onOk={handleStepSubmit}
        okText="添加"
      >
        <Form form={stepForm} layout="vertical">
          <Form.Item
            name="action"
            label="处置动作"
            rules={[{ required: true, message: '请输入处置动作' }]}
          >
            <Input placeholder="例如：通知保安人员前往现场" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default AlarmMonitor;
