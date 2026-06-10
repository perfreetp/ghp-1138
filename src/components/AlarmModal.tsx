import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Tag, Descriptions, Card } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Alarm } from '../types';
import { useStore } from '../store/useStore';

interface AlarmModalProps {
  open: boolean;
  alarm: Alarm;
  onClose: () => void;
}

const AlarmModal: React.FC<AlarmModalProps> = ({ open, alarm, onClose }) => {
  const [form] = Form.useForm();
  const { confirmAlarm, markFalseAlarm, handleAlarm, currentUser, cameras, getDisposalStepsByAlarm, alarms, setSelectedAlarm, setShowAlarmModal } = useStore();
  const [showCamera, setShowCamera] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>();

  const disposalSteps = getDisposalStepsByAlarm(alarm.id);
  const associatedCameras = cameras.filter((c) => alarm.cameraIds.includes(c.id));

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

  const statusColor = {
    pending: 'red',
    confirmed: 'orange',
    false_alarm: 'default',
    handled: 'green',
  };

  const statusText = {
    pending: '待处理',
    confirmed: '已确认',
    false_alarm: '误报',
    handled: '已处理',
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

  const handleFalseAlarm = async () => {
    const values = await form.validateFields();
    markFalseAlarm(alarm.id, currentUser, values.remark);
    showNextUrgentAlarm();
  };

  const handleComplete = async () => {
    const values = await form.validateFields();
    handleAlarm(alarm.id, currentUser, values.remark);
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
          alarm.status === 'pending' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button icon={<CloseCircleOutlined />} onClick={handleFalseAlarm}>
                标记误报
              </Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirm}>
                确认报警
              </Button>
            </Space>
          ) : alarm.status === 'confirmed' ? (
            <Space>
              <Button onClick={onClose}>关闭</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}>
                完成处置
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

        <Form form={form} layout="vertical">
          <Form.Item
            name="remark"
            label="处理备注"
            rules={[{ required: alarm.status !== 'handled' && alarm.status !== 'false_alarm', message: '请输入处理备注' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入处理备注..." />
          </Form.Item>
        </Form>
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
