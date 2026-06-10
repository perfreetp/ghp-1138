import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tabs,
  List,
  Timeline,
  Divider,
  Drawer,
  Popconfirm,
} from 'antd';
import {
  FileTextOutlined,
  PhoneOutlined,
  UserSwitchOutlined,
  EditOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  PhoneFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import type { PhoneRecord, DisposalStep, DutyLog } from '../types';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const DutyLogModule: React.FC = () => {
  const {
    phoneRecords,
    addPhoneRecord,
    updatePhoneRecord,
    deletePhoneRecord,
    disposalSteps,
    addDisposalStep,
    updateDisposalStep,
    deleteDisposalStep,
    completeDisposalStep,
    dutyLogs,
    addDutyLog,
    updateDutyLog,
    deleteDutyLog,
    handoverDuty,
    currentUser,
    alarms,
  } = useStore();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DutyLog | null>(null);
  const [editingPhone, setEditingPhone] = useState<PhoneRecord | null>(null);
  const [editingStep, setEditingStep] = useState<DisposalStep | null>(null);
  const [editingLog, setEditingLog] = useState<DutyLog | null>(null);
  const [phoneForm] = Form.useForm();
  const [stepForm] = Form.useForm();
  const [handoverForm] = Form.useForm();
  const [logForm] = Form.useForm();

  useEffect(() => {
    if (editingPhone) {
      phoneForm.setFieldsValue({
        ...editingPhone,
        time: dayjs(editingPhone.time),
      });
    }
  }, [editingPhone, phoneForm]);

  useEffect(() => {
    if (editingStep) {
      stepForm.setFieldsValue(editingStep);
    }
  }, [editingStep, stepForm]);

  useEffect(() => {
    if (editingLog) {
      logForm.setFieldsValue({
        ...editingLog,
        events: editingLog.events?.join('\n'),
      });
    }
  }, [editingLog, logForm]);

  const shiftText: Record<string, string> = {
    morning: '早班',
    afternoon: '中班',
    night: '夜班',
  };

  const shiftColor: Record<string, string> = {
    morning: 'orange',
    afternoon: 'blue',
    night: 'purple',
  };

  const handleAddPhoneRecord = async () => {
    const values = await phoneForm.validateFields();
    if (editingPhone) {
      updatePhoneRecord(editingPhone.id, {
        ...values,
        time: values.time ? values.time.format('YYYY-MM-DD HH:mm:ss') : editingPhone.time,
      });
      message.success('通话记录已更新');
      setEditingPhone(null);
    } else {
      addPhoneRecord({
        alarmId: values.alarmId,
        time: values.time ? values.time.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        caller: currentUser,
        receiver: values.receiver,
        phone: values.phone,
        content: values.content,
        duration: values.duration,
      });
      message.success('通话记录已添加');
    }
    setShowPhoneModal(false);
    phoneForm.resetFields();
  };

  const handleAddDisposalStep = async () => {
    const values = await stepForm.validateFields();
    if (editingStep) {
      updateDisposalStep(editingStep.id, values);
      message.success('处置步骤已更新');
      setEditingStep(null);
    } else {
      const alarmSteps = disposalSteps.filter((s) => s.alarmId === values.alarmId);
      addDisposalStep({
        alarmId: values.alarmId,
        order: alarmSteps.length + 1,
        action: values.action,
        operator: currentUser,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        completed: false,
        remark: values.remark,
      });
      message.success('处置步骤已添加');
    }
    setShowStepModal(false);
    stepForm.resetFields();
  };

  const handleHandover = async () => {
    const values = await handoverForm.validateFields();
    const currentShift = dutyLogs.find(
      (log) => !log.offDutyPerson && log.onDutyPerson === currentUser
    );

    if (currentShift) {
      handoverDuty(currentShift.id, values.offDutyPerson, values.signature, values.remarks);
      message.success('交接班完成');
    } else {
      addDutyLog({
        date: dayjs().format('YYYY-MM-DD'),
        shift: values.shift,
        onDutyPerson: currentUser,
        signatureOn: values.signature,
        events: values.events ? values.events.split('\n').filter((e: string) => e.trim()) : [],
        remarks: values.remarks,
      });
      message.success('接班记录已创建');
    }
    setShowHandoverModal(false);
    handoverForm.resetFields();
  };

  const handleCompleteStep = (stepId: string) => {
    completeDisposalStep(stepId);
    message.success('步骤已完成');
  };

  const handleViewLogDetail = (log: DutyLog) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  const handleEditPhone = (record: PhoneRecord) => {
    setEditingPhone(record);
    setShowPhoneModal(true);
  };

  const handleDeletePhone = (id: string) => {
    deletePhoneRecord(id);
    message.success('通话记录已删除');
  };

  const handleEditStep = (step: DisposalStep) => {
    setEditingStep(step);
    setShowStepModal(true);
  };

  const handleDeleteStep = (id: string) => {
    deleteDisposalStep(id);
    message.success('处置步骤已删除');
  };

  const handleEditLog = (log: DutyLog) => {
    setEditingLog(log);
    logForm.setFieldsValue({
      ...log,
      events: log.events?.join('\n'),
    });
  };

  const handleSaveLogEdit = async () => {
    if (!editingLog) return;
    const values = await logForm.validateFields();
    updateDutyLog(editingLog.id, {
      ...values,
      events: values.events ? values.events.split('\n').filter((e: string) => e.trim()) : [],
    });
    message.success('值班日志已更新');
    setEditingLog(null);
    logForm.resetFields();
  };

  const handleDeleteLog = (id: string) => {
    deleteDutyLog(id);
    message.success('值班日志已删除');
  };

  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setEditingPhone(null);
    phoneForm.resetFields();
  };

  const handleCloseStepModal = () => {
    setShowStepModal(false);
    setEditingStep(null);
    stepForm.resetFields();
  };

  const phoneColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '主叫',
      dataIndex: 'caller',
      key: 'caller',
      width: 100,
    },
    {
      title: '被叫',
      dataIndex: 'receiver',
      key: 'receiver',
      width: 120,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '通话内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => `${duration}秒`,
    },
    {
      title: '关联报警',
      dataIndex: 'alarmId',
      key: 'alarmId',
      width: 100,
      render: (alarmId: string) => (alarmId ? <Tag color="blue">{alarmId}</Tag> : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: PhoneRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditPhone(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这条通话记录?"
            onConfirm={() => handleDeletePhone(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 100,
      render: (shift: string) => <Tag color={shiftColor[shift]}>{shiftText[shift]}</Tag>,
    },
    {
      title: '值班人员',
      dataIndex: 'onDutyPerson',
      key: 'onDutyPerson',
      width: 100,
    },
    {
      title: '接班人员',
      dataIndex: 'offDutyPerson',
      key: 'offDutyPerson',
      width: 100,
      render: (person: string) => person || '-',
    },
    {
      title: '交接时间',
      dataIndex: 'handoverTime',
      key: 'handoverTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '事项',
      dataIndex: 'events',
      key: 'events',
      render: (events: string[]) => events.length > 0 ? `${events.length} 项` : '无',
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: DutyLog) =>
        record.offDutyPerson ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Tag color="processing">值班中</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: DutyLog) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewLogDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditLog(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这条值班日志?"
            onConfirm={() => handleDeleteLog(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pendingAlarms = alarms.filter((a) => a.status === 'pending' || a.status === 'confirmed');

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1677ff' }}>{phoneRecords.length}</div>
            <div className="stat-label">通话记录</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#faad14' }}>
              {disposalSteps.filter((s) => !s.completed).length}
            </div>
            <div className="stat-label">待处置步骤</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{dutyLogs.length}</div>
            <div className="stat-label">值班日志</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{pendingAlarms.length}</div>
            <div className="stat-label">待处理报警</div>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            值班管理
          </Space>
        }
        extra={
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowPhoneModal(true)}>
              记录通话
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setShowStepModal(true)}>
              添加处置
            </Button>
            <Button type="primary" icon={<UserSwitchOutlined />} onClick={() => setShowHandoverModal(true)}>
              交接班
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="phone">
          <TabPane
            tab={
              <Space>
                <PhoneOutlined />
                通话记录
              </Space>
            }
            key="phone"
          >
            <Table
              columns={phoneColumns}
              dataSource={phoneRecords}
              rowKey="id"
              scroll={{ x: 900, y: 400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <Space>
                <EditOutlined />
                处置步骤
              </Space>
            }
            key="disposal"
          >
            <Timeline
              className="disposal-timeline"
              style={{ maxHeight: 450, overflow: 'auto', padding: '16px 0' }}
            >
              {[...disposalSteps]
                .sort((a, b) => {
                  if (a.alarmId !== b.alarmId) return a.alarmId.localeCompare(b.alarmId);
                  return a.order - b.order;
                })
                .map((step, index, arr) => {
                  const showAlarmHeader = index === 0 || arr[index - 1].alarmId !== step.alarmId;
                  const alarm = alarms.find((a) => a.id === step.alarmId);
                  return (
                    <React.Fragment key={step.id}>
                      {showAlarmHeader && (
                        <div style={{ margin: '16px 0 8px', padding: '8px 12px', background: '#0f1f35', borderRadius: 4 }}>
                          <Space>
                            <Tag color="blue">{step.alarmId}</Tag>
                            <span style={{ fontWeight: 'bold' }}>{alarm?.type}</span>
                            <span style={{ color: '#91caff', fontSize: 12 }}>{alarm?.location}</span>
                          </Space>
                        </div>
                      )}
                      <Timeline.Item
                        color={step.completed ? '#52c41a' : '#1677ff'}
                        dot={step.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: step.completed ? 'normal' : 'bold' }}>
                              步骤 {step.order}: {step.action}
                            </div>
                            <div style={{ fontSize: 12, color: '#91caff', marginTop: 4 }}>
                              操作人: {step.operator} | 时间: {step.time}
                            </div>
                            {step.remark && (
                              <div style={{ fontSize: 12, marginTop: 4, color: '#e6f0ff' }}>
                                备注: {step.remark}
                              </div>
                            )}
                          </div>
                          <Space size={4} style={{ marginLeft: 16, flexShrink: 0 }}>
                            {!step.completed && (
                              <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleCompleteStep(step.id)}
                              >
                                完成
                              </Button>
                            )}
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditStep(step)}
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确认删除这个处置步骤?"
                              onConfirm={() => handleDeleteStep(step.id)}
                              okText="确认"
                              cancelText="取消"
                            >
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        </div>
                      </Timeline.Item>
                    </React.Fragment>
                  );
                })}
            </Timeline>
          </TabPane>

          <TabPane
            tab={
              <Space>
                <FileTextOutlined />
                值班日志
              </Space>
            }
            key="log"
          >
            <Table
              columns={logColumns}
              dataSource={dutyLogs}
              rowKey="id"
              scroll={{ x: 900, y: 400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <Space>
            <PhoneOutlined />
            {editingPhone ? '编辑通话记录' : '记录通话'}
          </Space>
        }
        open={showPhoneModal}
        onCancel={handleClosePhoneModal}
        onOk={handleAddPhoneRecord}
        okText={editingPhone ? '保存修改' : '保存'}
        width={600}
      >
        <Form form={phoneForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="alarmId" label="关联报警">
                <Select allowClear placeholder="请选择关联的报警">
                  {pendingAlarms.map((alarm) => (
                    <Option key={alarm.id} value={alarm.id}>
                      {alarm.id} - {alarm.type} - {alarm.location}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time" label="通话时间">
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="选择通话时间"
                  defaultValue={dayjs()}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="receiver"
                label="被叫人员"
                rules={[{ required: true, message: '请输入被叫人员' }]}
              >
                <Input placeholder="请输入被叫人员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话号码"
                rules={[{ required: true, message: '请输入电话号码' }]}
              >
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="通话内容"
            rules={[{ required: true, message: '请输入通话内容' }]}
          >
            <TextArea rows={3} placeholder="请输入通话内容摘要" />
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
            <EditOutlined />
            {editingStep ? '编辑处置步骤' : '添加处置步骤'}
          </Space>
        }
        open={showStepModal}
        onCancel={handleCloseStepModal}
        onOk={handleAddDisposalStep}
        okText={editingStep ? '保存修改' : '添加'}
        width={600}
      >
        <Form form={stepForm} layout="vertical">
          <Form.Item
            name="alarmId"
            label="关联报警"
            rules={[{ required: true, message: '请选择关联的报警' }]}
          >
            <Select placeholder="请选择关联的报警" disabled={!!editingStep}>
              {pendingAlarms.map((alarm) => (
                <Option key={alarm.id} value={alarm.id}>
                  {alarm.id} - {alarm.type} - {alarm.location}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="action"
            label="处置动作"
            rules={[{ required: true, message: '请输入处置动作' }]}
          >
            <Input placeholder="例如：通知保安人员前往现场" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EditOutlined />
            编辑值班日志
          </Space>
        }
        open={!!editingLog}
        onCancel={() => {
          setEditingLog(null);
          logForm.resetFields();
        }}
        onOk={handleSaveLogEdit}
        okText="保存修改"
        width={600}
      >
        <Form form={logForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shift"
                label="班次"
                rules={[{ required: true, message: '请选择班次' }]}
              >
                <Select placeholder="请选择班次">
                  <Option value="morning">早班 (08:00-16:00)</Option>
                  <Option value="afternoon">中班 (16:00-24:00)</Option>
                  <Option value="night">夜班 (00:00-08:00)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="onDutyPerson"
                label="值班人员"
                rules={[{ required: true, message: '请输入值班人员' }]}
              >
                <Input placeholder="请输入值班人员姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="offDutyPerson" label="接班人员">
                <Input placeholder="请输入接班人员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handoverTime" label="交接时间">
                <Input placeholder="交接完成后自动生成" disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="events" label="值班事项">
            <TextArea
              rows={3}
              placeholder="请输入值班期间发生的重要事项，每行一项"
            />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <UserSwitchOutlined />
            交接班
          </Space>
        }
        open={showHandoverModal}
        onCancel={() => setShowHandoverModal(false)}
        onOk={handleHandover}
        okText="确认"
        width={600}
      >
        <Form form={handoverForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shift"
                label="班次"
                rules={[{ required: true, message: '请选择班次' }]}
              >
                <Select placeholder="请选择班次">
                  <Option value="morning">早班 (08:00-16:00)</Option>
                  <Option value="afternoon">中班 (16:00-24:00)</Option>
                  <Option value="night">夜班 (00:00-08:00)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="offDutyPerson"
                label="接班人员"
                rules={[{ required: true, message: '请输入接班人员' }]}
              >
                <Input placeholder="请输入接班人员姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="signature"
            label="签名"
            rules={[{ required: true, message: '请输入签名' }]}
          >
            <Input placeholder="请输入您的签名" />
          </Form.Item>
          <Form.Item name="events" label="值班事项">
            <TextArea
              rows={3}
              placeholder="请输入值班期间发生的重要事项，每行一项"
            />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            值班日志详情
          </Space>
        }
        placement="right"
        onClose={() => setShowLogDetail(false)}
        open={showLogDetail}
        width={500}
      >
        {selectedLog && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <List
                dataSource={[
                  { label: '日期', value: selectedLog.date },
                  {
                    label: '班次',
                    value: <Tag color={shiftColor[selectedLog.shift]}>{shiftText[selectedLog.shift]}</Tag>,
                  },
                  { label: '值班人员', value: selectedLog.onDutyPerson },
                  { label: '接班人员', value: selectedLog.offDutyPerson || '-' },
                  { label: '交接时间', value: selectedLog.handoverTime || '-' },
                  { label: '值班签名', value: selectedLog.signatureOn || '-' },
                  { label: '接班签名', value: selectedLog.signatureOff || '-' },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.label} description={item.value} />
                  </List.Item>
                )}
              />
            </Card>

            {selectedLog.events.length > 0 && (
              <Card size="small" title="值班事项">
                <List
                  dataSource={selectedLog.events}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        {item}
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {selectedLog.remarks && (
              <Card size="small" title="备注">
                {selectedLog.remarks}
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default DutyLogModule;
