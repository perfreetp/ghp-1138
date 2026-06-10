import React, { useState } from 'react';
import { Row, Col, Card, Select, Button, Space, Tag, Modal, Descriptions, Badge, List } from 'antd';
import {
  VideoCameraOutlined,
  FilterOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { Camera, Alarm } from '../types';

const { Option } = Select;

const VideoPoints: React.FC = () => {
  const { cameras, getCamerasByFloor, alarms, selectedFloor, setSelectedFloor, setSelectedAlarm, setShowAlarmModal } = useStore();
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const floorCameras = selectedFloor === -999 ? cameras : getCamerasByFloor(selectedFloor);
  const onlineCameras = floorCameras.filter((c) => c.status === 'online');
  const offlineCameras = floorCameras.filter((c) => c.status === 'offline');

  const getAssociatedAlarms = (cameraId: string): Alarm[] => {
    return alarms.filter((a) => a.cameraIds.includes(cameraId) && a.status !== 'handled' && a.status !== 'false_alarm');
  };

  const handleViewCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setShowCameraModal(true);
  };

  const handleViewAlarm = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setShowAlarmModal(true);
  };

  const renderCameraCard = (camera: Camera) => {
    const associatedAlarms = getAssociatedAlarms(camera.id);
    const hasActiveAlarm = associatedAlarms.length > 0;

    return (
      <Card
        key={camera.id}
        size="small"
        style={{
          borderColor: hasActiveAlarm ? '#ff4d4f' : camera.status === 'online' ? '#1f2f45' : '#1f2f45',
          borderWidth: hasActiveAlarm ? 2 : 1,
        }}
        bodyStyle={{ padding: 0 }}
        actions={[
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleViewCamera(camera)}
            disabled={camera.status === 'offline'}
          >
            查看
          </Button>,
        ]}
      >
        <div className="video-player" style={{ height: 180, borderRadius: '4px 4px 0 0' }}>
          <div style={{ zIndex: 1, color: '#fff', textAlign: 'center' }}>
            {camera.status === 'online' ? (
              <>
                <PlayCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontSize: 12 }}>点击查看</div>
              </>
            ) : (
              <>
                <WarningOutlined style={{ fontSize: 32, color: '#8c8c8c', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>设备离线</div>
              </>
            )}
          </div>
          <div className="video-info">
            <div style={{ fontSize: 12, fontWeight: 'bold' }}>{camera.name}</div>
            <div style={{ fontSize: 10, color: '#91caff' }}>{camera.location}</div>
          </div>
          <Tag
            color={camera.status === 'online' ? 'success' : 'default'}
            className="video-status"
          >
            {camera.status === 'online' ? '在线' : '离线'}
          </Tag>
          {hasActiveAlarm && (
            <Badge
              count={associatedAlarms.length}
              style={{ position: 'absolute', top: 8, left: 8 }}
              color="#ff4d4f"
            />
          )}
        </div>
        {hasActiveAlarm && (
          <div
            style={{
              padding: 8,
              background: 'rgba(255, 77, 79, 0.1)',
              borderTop: '1px solid #ff4d4f',
            }}
          >
            {associatedAlarms.map((alarm) => (
              <div
                key={alarm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <Space>
                  <BellOutlined style={{ color: '#ff4d4f' }} />
                  <span style={{ color: '#ff4d4f' }}>{alarm.type}</span>
                </Space>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewAlarm(alarm)}
                  style={{ padding: 0, fontSize: 12 }}
                >
                  详情
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const listColumns = [
    {
      title: '摄像头名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      render: (floor: number) => (floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'success' : 'default'}>
          {status === 'online' ? (
            <Space>
              <CheckCircleOutlined />
              在线
            </Space>
          ) : (
            <Space>
              <WarningOutlined />
              离线
            </Space>
          )}
        </Tag>
      ),
    },
    {
      title: '关联报警',
      dataIndex: 'id',
      key: 'alarms',
      render: (id: string) => {
        const associatedAlarms = getAssociatedAlarms(id);
        return associatedAlarms.length > 0 ? (
          <Tag color="red">
            <BellOutlined /> {associatedAlarms.length} 个
          </Tag>
        ) : (
          <span style={{ color: '#5c7a99' }}>无</span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Camera) => (
        <Button
          type="link"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleViewCamera(record)}
          disabled={record.status === 'offline'}
        >
          查看视频
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1677ff' }}>{cameras.length}</div>
            <div className="stat-label">摄像头总数</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{onlineCameras.length}</div>
            <div className="stat-label">在线</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#8c8c8c' }}>{offlineCameras.length}</div>
            <div className="stat-label">离线</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>
              {cameras.filter((c) => getAssociatedAlarms(c.id).length > 0).length}
            </div>
            <div className="stat-label">关联报警</div>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <VideoCameraOutlined />
            视频点位监控
          </Space>
        }
        extra={
          <Space wrap>
            <Select
              value={selectedFloor}
              onChange={setSelectedFloor}
              style={{ width: 120 }}
              prefix={<FilterOutlined />}
            >
              <Option value={-999}>全部楼层</Option>
              {[-2, -1, 1, 2, 3, 4, 5].map((floor) => (
                <Option key={floor} value={floor}>
                  {floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`}
                </Option>
              ))}
            </Select>
            <Button.Group>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              >
                网格视图
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                列表视图
              </Button>
            </Button.Group>
          </Space>
        }
      >
        {viewMode === 'grid' ? (
          <Row gutter={[16, 16]}>
            {floorCameras.map((camera) => (
              <Col xs={24} sm={12} md={8} lg={6} key={camera.id}>
                {renderCameraCard(camera)}
              </Col>
            ))}
          </Row>
        ) : (
          <List
            dataSource={floorCameras}
            renderItem={(camera) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleViewCamera(camera)}
                    disabled={camera.status === 'offline'}
                  >
                    查看视频
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 60,
                        height: 45,
                        background: camera.status === 'online' ? '#000' : '#1f2f45',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {camera.status === 'online' ? (
                        <VideoCameraOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                      ) : (
                        <WarningOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />
                      )}
                    </div>
                  }
                  title={
                    <Space>
                      {camera.name}
                      <Tag color={camera.status === 'online' ? 'success' : 'default'}>
                        {camera.status === 'online' ? '在线' : '离线'}
                      </Tag>
                      {getAssociatedAlarms(camera.id).length > 0 && (
                        <Badge count={getAssociatedAlarms(camera.id).length} color="#ff4d4f" />
                      )}
                    </Space>
                  }
                  description={
                    <Space size="large" style={{ color: '#91caff', fontSize: 12 }}>
                      <span>{camera.floor > 0 ? `${camera.floor}层` : `B${Math.abs(camera.floor)}层`}</span>
                      <span>{camera.location}</span>
                      <span>{camera.streamUrl}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <PlayCircleOutlined />
            {selectedCamera?.name}
            <Tag color={selectedCamera?.status === 'online' ? 'success' : 'default'}>
              {selectedCamera?.status === 'online' ? '在线' : '离线'}
            </Tag>
          </Space>
        }
        open={showCameraModal}
        onCancel={() => setShowCameraModal(false)}
        width={900}
        footer={
          <Button onClick={() => setShowCameraModal(false)}>关闭</Button>
        }
      >
        {selectedCamera && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="video-player" style={{ height: 450 }}>
              <div style={{ zIndex: 1, color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {selectedCamera.status === 'online' ? (
                    <PlayCircleOutlined spin />
                  ) : (
                    <WarningOutlined />
                  )}
                </div>
                <div style={{ fontSize: 18 }}>
                  {selectedCamera.status === 'online' ? '视频播放中...' : '设备离线，无法查看'}
                </div>
                <div style={{ fontSize: 14, color: '#91caff', marginTop: 8 }}>
                  {selectedCamera.streamUrl}
                </div>
              </div>
              <div className="video-info">
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{selectedCamera.name}</div>
                <div style={{ fontSize: 12, color: '#91caff' }}>{selectedCamera.location}</div>
              </div>
              <Tag
                color={selectedCamera.status === 'online' ? 'success' : 'default'}
                className="video-status"
              >
                {selectedCamera.status === 'online' ? 'LIVE' : 'OFFLINE'}
              </Tag>
            </div>

            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="摄像头编号">{selectedCamera.id}</Descriptions.Item>
              <Descriptions.Item label="摄像头名称">{selectedCamera.name}</Descriptions.Item>
              <Descriptions.Item label="所在楼层">
                {selectedCamera.floor > 0 ? `${selectedCamera.floor}层` : `B${Math.abs(selectedCamera.floor)}层`}
              </Descriptions.Item>
              <Descriptions.Item label="安装位置">{selectedCamera.location}</Descriptions.Item>
              <Descriptions.Item label="流地址">{selectedCamera.streamUrl}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={selectedCamera.status === 'online' ? 'success' : 'default'}>
                  {selectedCamera.status === 'online' ? '在线' : '离线'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联报警" span={2}>
                {getAssociatedAlarms(selectedCamera.id).length > 0 ? (
                  <Space wrap>
                    {getAssociatedAlarms(selectedCamera.id).map((alarm) => (
                      <Tag key={alarm.id} color="red">
                        <BellOutlined /> {alarm.id} - {alarm.type}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#5c7a99' }}>无关联报警</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default VideoPoints;
