import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Tag, Descriptions, Card, Steps } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  CarOutlined,
  FileDoneOutlined,
  AuditOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Alarm, AlarmStatus, AlarmFlowStatus } from '../types';
import { useStore } from '../store/useStore';

interface AlarmModalProps {
  open: boolean;
  alarm: Alarm;
  onClose: () => void;
}

const AlarmModal: React.FC<AlarmModalProps> = ({ open, alarm, onClose }) => {
  const [form] = Form.useForm();
  const [remarkForm] = Form.useForm();
  const {
    confirmAlarm,
    markFalseAlarm,
    notifyAlarm,
    arriveAlarm,
    disposeAlarm,
    archiveAlarm,
    currentUser,
    cameras,
    getDisposalStepsByAlarm,
    alarms,
    setSelectedAlarm,
    setShowAlarmModal,
  } = useStore();
  const [showCamera, setShowCamera] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>();

  const disposalSteps = getDisposalStepsByAlarm(alarm.id);
  const associatedCameras = cameras.filter((c) => alarm.cameraIds.includes(c.id));

  const flowStepItems = [
    { title: '待确认', icon: <ExclamationCircleOutlined />, timeField: 'confirmTime' as const, status: 'pending' as AlarmFlowStatus },
    { title: '已确认', icon: <CheckCircleOutlined />, timeField: 'confirmTime' as const, status: 'confirmed' as AlarmFlowStatus },
    { title: '通知现场', icon: <SoundOutlined />, timeField: 'notifyTime' as const, status: 'notified' as AlarmFlowStatus },
    { title: '到达现场', icon: <CarOutlined />, timeField: 'arriveTime' as const, status: 'arrived' as AlarmFlowStatus },
    { title: '处置完成', icon: <FileDoneOutlined />, timeField: 'disposeTime' as const, status: 'disposed' as AlarmFlowStatus },
    { title: '复核归档', icon: <AuditOutlined />, timeField: 'archiveTime' as const, status: 'archived' as AlarmFlowStatus },
    { title: '误报/关闭', icon: <StopOutlined />, timeField: 'handleTime' as const, status: 'false_alarm' as AlarmFlowStatus },
  ];

  const getCurrentStepIndex = (flowStatus: AlarmFlowStatus): number => {
    const order: AlarmFlowStatus[] = ['pending', 'confirmed', 'notified', 'arrived', 'disposed', 'reviewed', 'archived', 'false_alarm'];
    const idx = order.indexOf(flowStatus);
    if (flowStatus === 'false_alarm') return 6;
    if (flowStatus === 'archived') return 5;
    if (flowStatus === 'reviewed') return 5;
    if (idx >= 5) return 5;
    return idx;
  };

  const isStepCompleted = (stepStatus: AlarmFlowStatus, currentStatus: AlarmFlowStatus): boolean => {
    const order: AlarmFlowStatus[] = ['pending', 'confirmed', 'notified', 'arrived', 'disposed', 'reviewed', 'archived'];
    const stepIdx = order.indexOf(stepStatus);
    const currentIdx = order.indexOf(currentStatus);
    if (currentStatus === 'false_alarm') {
      return false;
    }
    return currentIdx > stepIdx;
  };

  const getTimeForStep = (step: typeof flowStepItems[0]): string => {
    if (alarm.flowStatus === 'false_alarm' && step.status === 'false_alarm') {
      return alarm.handleTime || '-';
    }
    if (step.status === 'pending') {
      return alarm.confirmTime ? alarm.alarmTime : alarm.alarmTime;
    }
    if (step.status === 'confirmed') {
      return alarm.confirmTime || '-';
    }
    if (step.status === 'archived') {
      return alarm.archiveTime || alarm.reviewTime || '-';
    }
    return alarm[step.timeField] || '-';
  };

  const showNextUrgentAlarm = () => {
    const pendingUrgentAlarms = alarms.filter(
      (a) => a.status === 'pending' && a.level === 'urgent' && a.id !== alarm.id
    );
    if (pendingUrgentAlarms.length > 0) {
      const nextAlarm = pendingUrgentAlarms.sort(
        (a, b) => dayjs(a.alarmTime).valueOf() - dayjs(b.alarmTime).valueOf()
      )[0];
      setSelectedAlarm(nextAlarm);
      setShowAlarmModal(true);
    } else {
      onClose();
    }
  };

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

  const handleConfirm = async () => {
    const values = await form.validateFields();
    confirmAlarm(alarm.id, currentUser, values.remark);
    showNextUrgentAlarm();
  };

  const handleNotify = () => {
    notifyAlarm(alarm.id, currentUser);
  };

  const handleArrive = () => {
    arriveAlarm(alarm.id, currentUser);
  };

  const handleDispose = async () => {
    const values = await remarkForm.validateFields();
    disposeAlarm(alarm.id, currentUser, values.disposeRemark);
  };

  const handleArchive = async () => {
    const values = await remarkForm.validateFields();
    archiveAlarm(alarm.id, currentUser, values.archiveRemark);
  };

  const handleFalseAlarm = async () => {
    const values = await form.validateFields();
    markFalseAlarm(alarm.id, currentUser, values.remark);
    showNextUrgentAlarm();
  };

  const openCamera = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setShowCamera(true);
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            报警详情 - {alarm.id}
          </Space>
        }
        open={open}
        onCancel={onClose}
        width={900}
        footer={
          alarm.flowStatus === 'pending' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button icon={<CloseCircleOutlined />} onClick={handleFalseAlarm}>
                标记误报
              </Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirm}>
                确认报警
              </Button>
            </Space>
          ) : alarm.flowStatus === 'confirmed' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button icon={<CloseCircleOutlined />} onClick={handleFalseAlarm}>
                标记误报
              </Button>
              <Button type="primary" icon={<SoundOutlined />} onClick={handleNotify}>
                通知现场
              </Button>
            </Space>
          ) : alarm.flowStatus === 'notified' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button icon={<CloseCircleOutlined />} onClick={handleFalseAlarm}>
                标记误报
              </Button>
              <Button type="primary" icon={<CarOutlined />} onClick={handleArrive}>
                到达现场
              </Button>
            </Space>
          ) : alarm.flowStatus === 'arrived' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button icon={<CloseCircleOutlined />} onClick={handleFalseAlarm}>
                标记误报
              </Button>
              <Button type="primary" icon={<FileDoneOutlined />} onClick={handleDispose}>
                处置完成
              </Button>
            </Space>
          ) : alarm.flowStatus === 'disposed' || alarm.flowStatus === 'reviewed' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button type="primary" icon={<AuditOutlined />} onClick={handleArchive}>
                复核归档
              </Button>
            </Space>
          ) : (
            <Button onClick={onClose}>关闭</Button>
          )
        }
      >
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="报警编号">{alarm.id}</Descriptions.Item>
          <Descriptions.Item label="报警类型">{alarm.type}</Descriptions.Item>
          <Descriptions.Item label="报警级别">
            <Tag color={levelColor[alarm.level]}>{levelText[alarm.level]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={statusColor[alarm.status]}>{statusText[alarm.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="报警位置" span={2}>
            {alarm.location}
          </Descriptions.Item>
          <Descriptions.Item label="设备名称">{alarm.deviceName}</Descriptions.Item>
          <Descriptions.Item label="设备编号">{alarm.deviceId}</Descriptions.Item>
          <Descriptions.Item label="报警时间">{alarm.alarmTime}</Descriptions.Item>
          <Descriptions.Item label="确认时间">{alarm.confirmTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="处理时间">{alarm.handleTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="操作人员">{alarm.operator || '-'}</Descriptions.Item>
          <Descriptions.Item label="报警描述" span={2}>
            {alarm.description}
          </Descriptions.Item>
          {alarm.remark && (
            <Descriptions.Item label="备注" span={2}>
              {alarm.remark}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Card
          size="small"
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#1677ff' }} />
              处置流转
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Steps
            direction="vertical"
            size="small"
            current={alarm.flowStatus === 'false_alarm' ? 6 : getCurrentStepIndex(alarm.flowStatus)}
            status={alarm.flowStatus === 'false_alarm' ? 'error' : 'process'}
            items={flowStepItems.map((step, index) => {
              const isCurrent =
                alarm.flowStatus !== 'false_alarm' && index === getCurrentStepIndex(alarm.flowStatus);
              const isCompleted =
                alarm.flowStatus !== 'false_alarm' && isStepCompleted(step.status, alarm.flowStatus);
              const isFalseAlarmPath = alarm.flowStatus === 'false_alarm' && step.status === 'false_alarm';

              return {
                title: (
                  <span style={{
                    color: isCurrent ? '#1677ff' : isCompleted ? '#52c41a' : isFalseAlarmPath ? '#ff4d4f' : '#8c8c8c',
                    fontWeight: isCurrent || isFalseAlarmPath ? 'bold' : 'normal',
                  }}>
                    {step.title}
                  </span>
                ),
                description: (
                  <div style={{ fontSize: 12, color: '#91caff', marginTop: 4 }}>
                    {getTimeForStep(step) !== '-' && (
                      <span>{getTimeForStep(step)}</span>
                    )}
                    {getTimeForStep(step) === '-' && <span style={{ color: '#595959' }}>--</span>}
                  </div>
                ),
                icon: (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    color: isCompleted ? '#fff' : isCurrent ? '#fff' : isFalseAlarmPath ? '#fff' : '#8c8c8c',
                    background: isCompleted ? '#52c41a' : isCurrent ? '#1677ff' : isFalseAlarmPath ? '#ff4d4f' : '#2a3a50',
                  }}>
                    {step.icon}
                  </span>
                ),
                status: isFalseAlarmPath
                  ? 'error'
                  : isCompleted
                  ? 'finish'
                  : isCurrent
                  ? 'process'
                  : 'wait',
              };
            })}
          />
        </Card>

        {associatedCameras.length > 0 && (
          <Card
            size="small"
            title={
              <Space>
                <VideoCameraOutlined />
                关联摄像头
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Space wrap>
              {associatedCameras.map((camera) => (
                <Button
                  key={camera.id}
                  icon={<VideoCameraOutlined />}
                  onClick={() => openCamera(camera.id)}
                  type={camera.status === 'online' ? 'primary' : 'default'}
                  disabled={camera.status === 'offline'}
                >
                  {camera.name}
                  {camera.status === 'offline' && ' (离线)'}
                </Button>
              ))}
            </Space>
          </Card>
        )}

        {disposalSteps.length > 0 && (
          <Card
            size="small"
            title="处置流程"
            style={{ marginBottom: 16 }}
            className="disposal-timeline"
          >
            {disposalSteps.map((step) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  paddingLeft: 12,
                  borderLeft: `3px solid ${step.completed ? '#52c41a' : '#1677ff'}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: step.completed ? '#52c41a' : '#e6f0ff' }}>
                    步骤 {step.order}: {step.action}
                  </div>
                  <div style={{ fontSize: 12, color: '#91caff', marginTop: 4 }}>
                    操作人：{step.operator} | 时间：{step.time}
                    {step.completed && <Tag color="success" style={{ marginLeft: 8 }}>已完成</Tag>}
                  </div>
                  {step.remark && <div style={{ fontSize: 12, marginTop: 4 }}>{step.remark}</div>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {(alarm.flowStatus === 'pending' || alarm.flowStatus === 'confirmed' || alarm.flowStatus === 'notified' || alarm.flowStatus === 'arrived') && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="remark"
              label={alarm.flowStatus === 'pending' ? '确认备注' : '处理备注'}
              rules={[{ required: alarm.flowStatus === 'pending', message: '请输入备注' }]}
            >
              <Input.TextArea rows={2} placeholder={alarm.flowStatus === 'pending' ? '请输入确认备注（可选）...' : '请输入处理备注（可选）...'} />
            </Form.Item>
          </Form>
        )}

        {alarm.flowStatus === 'arrived' && (
          <Form form={remarkForm} layout="vertical">
            <Form.Item
              name="disposeRemark"
              label="处置完成备注"
              rules={[{ required: true, message: '请输入处置完成备注' }]}
            >
              <Input.TextArea rows={2} placeholder="请输入处置完成的详细说明..." />
            </Form.Item>
          </Form>
        )}

        {(alarm.flowStatus === 'disposed' || alarm.flowStatus === 'reviewed') && (
          <Form form={remarkForm} layout="vertical">
            <Form.Item
              name="archiveRemark"
              label="复核归档备注"
              rules={[{ required: true, message: '请输入复核归档备注' }]}
            >
              <Input.TextArea rows={2} placeholder="请输入复核意见和归档说明..." />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="视频监控"
        open={showCamera}
        onCancel={() => setShowCamera(false)}
        footer={null}
        width={800}
      >
        <div className="video-player" style={{ height: 450 }}>
          <div style={{ zIndex: 1, color: '#fff', fontSize: 16 }}>
            {cameras.find((c) => c.id === selectedCameraId)?.name}
          </div>
          <div className="video-info">
            <div>{cameras.find((c) => c.id === selectedCameraId)?.location}</div>
            <div style={{ fontSize: 11, color: '#91caff' }}>
              {cameras.find((c) => c.id === selectedCameraId)?.streamUrl}
            </div>
          </div>
          <Tag
            color={cameras.find((c) => c.id === selectedCameraId)?.status === 'online' ? 'success' : 'default'}
            className="video-status"
          >
            {cameras.find((c) => c.id === selectedCameraId)?.status === 'online' ? '在线' : '离线'}
          </Tag>
        </div>
      </Modal>
    </>
  );
};

export default AlarmModal;
