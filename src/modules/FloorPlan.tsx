import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Badge,
  Divider,
} from 'antd';
import {
  EnvironmentOutlined,
  FireOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import { floors } from '../data/mockData';
import type { Device, Detector, FireDoor, SmokeExhaust } from '../types';

const { Option } = Select;

const FloorPlan: React.FC = () => {
  const { selectedFloor, setSelectedFloor, getDevicesByFloor, getCamerasByFloor, setSelectedAlarm, setShowAlarmModal, alarms, locateAlarm, setLocateAlarm, cameras } = useStore();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const associatedCameras = locateAlarm ? cameras.filter((c) => locateAlarm.cameraIds.includes(c.id)) : [];

  const floorDevices = getDevicesByFloor(selectedFloor);
  const floorCameras = getCamerasByFloor(selectedFloor);
  const floorAlarms = alarms.filter((a) => a.floor === selectedFloor && a.status === 'pending');

  const detectors = floorDevices.filter((d): d is Detector => d.type === 'detector');
  const fireDoors = floorDevices.filter((d): d is FireDoor => d.type === 'fire_door');
  const smokeExhausts = floorDevices.filter((d): d is SmokeExhaust => d.type === 'smoke_exhaust');

  const statusColor = {
    normal: '#52c41a',
    warning: '#faad14',
    fault: '#ff4d4f',
    offline: '#8c8c8c',
  };

  const getDeviceIcon = (device: Device) => {
    switch (device.type) {
      case 'detector':
        return <FireOutlined />;
      case 'fire_door':
        return <SafetyOutlined />;
      case 'smoke_exhaust':
        return <ThunderboltOutlined />;
      default:
        return <EnvironmentOutlined />;
    }
  };

  const handleDeviceClick = (device: Device) => {
    const relatedAlarm = alarms.find(
      (a) => a.deviceId === device.id && a.status === 'pending'
    );
    if (relatedAlarm) {
      setSelectedAlarm(relatedAlarm);
      setShowAlarmModal(true);
    } else {
      setSelectedDevice(device);
      setShowDeviceModal(true);
    }
  };

  const handleViewCamera = (cameraId: string) => {
    const alarm = alarms.find((a) => a.cameraIds.includes(cameraId));
    if (alarm) {
      setSelectedAlarm(alarm);
      setShowAlarmModal(true);
    }
  };

  const isDeviceAlarming = (deviceId: string) => {
    return alarms.some((a) => a.deviceId === deviceId && a.status === 'pending');
  };

  const isDeviceHighlighted = (deviceId: string) => {
    return locateAlarm && locateAlarm.deviceId === deviceId;
  };

  const currentFloor = floors.find((f) => f.id === selectedFloor);

  const deviceTypeText = {
    detector: '探测器',
    fire_door: '防火门',
    smoke_exhaust: '排烟设备',
    sprinkler: '喷淋头',
    fire_hose: '消防栓',
  };

  const statusText = {
    normal: '正常',
    warning: '预警',
    fault: '故障',
    offline: '离线',
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', height: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={18}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                楼层平面图 - {currentFloor?.name || '1层'}
              </Space>
            }
            extra={
              <Space>
                <Select
                  value={selectedFloor}
                  onChange={setSelectedFloor}
                  style={{ width: 120 }}
                >
                  {floors.map((floor) => (
                    <Option key={floor.id} value={floor.id}>
                      {floor.name}
                    </Option>
                  ))}
                </Select>
                {floorAlarms.length > 0 && (
                  <Tag color="red">
                    <FireOutlined spin /> {floorAlarms.length} 个报警
                  </Tag>
                )}
              </Space>
            }
            style={{ height: 500 }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
          >
            <div className="floor-plan-container">
              <svg className="floor-svg" viewBox="0 0 800 500">
                <defs>
                  <pattern id="floorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1f2f45" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="800" height="500" fill="url(#floorGrid)" />
                <rect x="20" y="20" width="760" height="460" fill="none" stroke="#1677ff" strokeWidth="2" rx="8" />
                <rect x="350" y="20" width="100" height="60" fill="#1a2a42" stroke="#1f2f45" />
                <text x="400" y="55" textAnchor="middle" fill="#91caff" fontSize="12">电梯厅</text>
                <rect x="20" y="120" width="200" height="150" fill="#1a2a42" stroke="#1f2f45" />
                <text x="120" y="195" textAnchor="middle" fill="#91caff" fontSize="12">办公区A</text>
                <rect x="250" y="120" width="200" height="150" fill="#1a2a42" stroke="#1f2f45" />
                <text x="350" y="195" textAnchor="middle" fill="#91caff" fontSize="12">办公区B</text>
                <rect x="480" y="120" width="300" height="150" fill="#1a2a42" stroke="#1f2f45" />
                <text x="630" y="195" textAnchor="middle" fill="#91caff" fontSize="12">会议室</text>
                <rect x="20" y="310" width="200" height="170" fill="#1a2a42" stroke="#1f2f45" />
                <text x="120" y="395" textAnchor="middle" fill="#91caff" fontSize="12">设备间</text>
                <rect x="250" y="310" width="200" height="170" fill="#1a2a42" stroke="#1f2f45" />
                <text x="350" y="395" textAnchor="middle" fill="#91caff" fontSize="12">走廊</text>
                <rect x="480" y="310" width="300" height="170" fill="#1a2a42" stroke="#1f2f45" />
                <text x="630" y="395" textAnchor="middle" fill="#91caff" fontSize="12">储藏室</text>

                {detectors.map((detector) => (
                  <g
                    key={detector.id}
                    className="device-marker"
                    onClick={() => handleDeviceClick(detector)}
                  >
                    {isDeviceHighlighted(detector.id) && (
                      <>
                        <circle
                          cx={detector.position.x}
                          cy={detector.position.y}
                          r="35"
                          fill="none"
                          stroke="#faad14"
                          strokeWidth="4"
                          className="pulse-animation"
                        />
                        <circle
                          cx={detector.position.x}
                          cy={detector.position.y}
                          r="40"
                          fill="none"
                          stroke="#faad14"
                          strokeWidth="2"
                          opacity="0.5"
                          className="pulse-animation-delay"
                        />
                      </>
                    )}
                    {isDeviceAlarming(detector.id) && (
                      <>
                        <circle
                          cx={detector.position.x}
                          cy={detector.position.y}
                          r="25"
                          fill="none"
                          stroke="#ff4d4f"
                          strokeWidth="3"
                          className="pulse-animation"
                        />
                        <circle
                          cx={detector.position.x}
                          cy={detector.position.y}
                          r="30"
                          fill="none"
                          stroke="#ff4d4f"
                          strokeWidth="2"
                          opacity="0.5"
                          className="pulse-animation-delay"
                        />
                      </>
                    )}
                    <Tooltip title={`${detector.name} - ${statusText[detector.status]}${isDeviceAlarming(detector.id) ? ' [报警中]' : ''}${isDeviceHighlighted(detector.id) ? ' [定位中]' : ''}`}>
                      <circle
                        cx={detector.position.x}
                        cy={detector.position.y}
                        r={isDeviceAlarming(detector.id) || isDeviceHighlighted(detector.id) ? 16 : 12}
                        fill={isDeviceAlarming(detector.id) ? '#ff4d4f' : isDeviceHighlighted(detector.id) ? '#faad14' : statusColor[detector.status]}
                        stroke={isDeviceHighlighted(detector.id) ? '#faad14' : '#fff'}
                        strokeWidth={isDeviceAlarming(detector.id) || isDeviceHighlighted(detector.id) ? 4 : 2}
                      />
                      <text
                        x={detector.position.x}
                        y={detector.position.y + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        style={{ pointerEvents: 'none', fontWeight: isDeviceAlarming(detector.id) || isDeviceHighlighted(detector.id) ? 'bold' : 'normal' }}
                      >
                        烟
                      </text>
                    </Tooltip>
                  </g>
                ))}

                {fireDoors.map((door) => (
                  <g
                    key={door.id}
                    className="device-marker"
                    onClick={() => handleDeviceClick(door)}
                  >
                    {isDeviceHighlighted(door.id) && (
                      <circle
                        cx={door.position.x}
                        cy={door.position.y}
                        r="32"
                        fill="none"
                        stroke="#faad14"
                        strokeWidth="4"
                        className="pulse-animation"
                      />
                    )}
                    {isDeviceAlarming(door.id) && (
                      <circle
                        cx={door.position.x}
                        cy={door.position.y}
                        r="22"
                        fill="none"
                        stroke="#ff4d4f"
                        strokeWidth="2"
                        className="pulse-animation"
                      />
                    )}
                    <Tooltip title={`${door.name} - ${statusText[door.status]}${isDeviceAlarming(door.id) ? ' [报警中]' : ''}${isDeviceHighlighted(door.id) ? ' [定位中]' : ''}`}>
                      <rect
                        x={door.position.x - 12}
                        y={door.position.y - 8}
                        width="24"
                        height="16"
                        fill={isDeviceAlarming(door.id) ? '#ff4d4f' : isDeviceHighlighted(door.id) ? '#faad14' : statusColor[door.status]}
                        stroke={isDeviceHighlighted(door.id) ? '#faad14' : '#fff'}
                        strokeWidth={isDeviceAlarming(door.id) || isDeviceHighlighted(door.id) ? 3 : 2}
                        rx="2"
                      />
                      <text
                        x={door.position.x}
                        y={door.position.y + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        style={{ pointerEvents: 'none', fontWeight: isDeviceAlarming(door.id) || isDeviceHighlighted(door.id) ? 'bold' : 'normal' }}
                      >
                        门
                      </text>
                    </Tooltip>
                  </g>
                ))}

                {smokeExhausts.map((exhaust) => (
                  <g
                    key={exhaust.id}
                    className="device-marker"
                    onClick={() => handleDeviceClick(exhaust)}
                  >
                    {isDeviceHighlighted(exhaust.id) && (
                      <circle
                        cx={exhaust.position.x}
                        cy={exhaust.position.y}
                        r="32"
                        fill="none"
                        stroke="#faad14"
                        strokeWidth="4"
                        className="pulse-animation"
                      />
                    )}
                    {isDeviceAlarming(exhaust.id) && (
                      <circle
                        cx={exhaust.position.x}
                        cy={exhaust.position.y}
                        r="22"
                        fill="none"
                        stroke="#ff4d4f"
                        strokeWidth="2"
                        className="pulse-animation"
                      />
                    )}
                    <Tooltip title={`${exhaust.name} - ${statusText[exhaust.status]}${isDeviceAlarming(exhaust.id) ? ' [报警中]' : ''}${isDeviceHighlighted(exhaust.id) ? ' [定位中]' : ''}`}>
                      <polygon
                        points={`${exhaust.position.x},${exhaust.position.y - 12} ${exhaust.position.x + 12},${exhaust.position.y + 8} ${exhaust.position.x - 12},${exhaust.position.y + 8}`}
                        fill={isDeviceAlarming(exhaust.id) ? '#ff4d4f' : isDeviceHighlighted(exhaust.id) ? '#faad14' : statusColor[exhaust.status]}
                        stroke={isDeviceHighlighted(exhaust.id) ? '#faad14' : '#fff'}
                        strokeWidth={isDeviceAlarming(exhaust.id) || isDeviceHighlighted(exhaust.id) ? 3 : 2}
                      />
                      <text
                        x={exhaust.position.x}
                        y={exhaust.position.y + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        style={{ pointerEvents: 'none', fontWeight: isDeviceAlarming(exhaust.id) || isDeviceHighlighted(exhaust.id) ? 'bold' : 'normal' }}
                      >
                        排
                      </text>
                    </Tooltip>
                  </g>
                ))}

                {floorCameras.map((camera) => (
                  <g
                    key={camera.id}
                    className="device-marker"
                    onClick={() => handleViewCamera(camera.id)}
                  >
                    <Tooltip title={`${camera.name} - ${camera.status === 'online' ? '在线' : '离线'}`}>
                      <rect
                        x={camera.position.x - 10}
                        y={camera.position.y - 8}
                        width="20"
                        height="16"
                        fill={camera.status === 'online' ? '#1677ff' : '#8c8c8c'}
                        stroke="#fff"
                        strokeWidth="2"
                        rx="3"
                      />
                      <circle
                        cx={camera.position.x}
                        cy={camera.position.y}
                        r="4"
                        fill={camera.status === 'online' ? '#52c41a' : '#ff4d4f'}
                      />
                    </Tooltip>
                  </g>
                ))}
              </svg>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {locateAlarm && locateAlarm.floor === selectedFloor && (
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    定位报警
                  </Space>
                }
                size="small"
                style={{ borderColor: '#faad14', borderWidth: 2 }}
                extra={
                  <Button
                    size="small"
                    onClick={() => setLocateAlarm(null)}
                  >
                    取消定位
                  </Button>
                }
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="报警编号">
                    <Tag color="red">{locateAlarm.id}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="设备编号">
                    {locateAlarm.deviceId}
                  </Descriptions.Item>
                  <Descriptions.Item label="设备名称">
                    {locateAlarm.deviceName}
                  </Descriptions.Item>
                  <Descriptions.Item label="所在楼层">
                    <Tag color="blue">
                      {locateAlarm.floor > 0 ? `${locateAlarm.floor}层` : `B${Math.abs(locateAlarm.floor)}层`}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="报警位置">
                    {locateAlarm.location}
                  </Descriptions.Item>
                  <Descriptions.Item label="报警类型">
                    {locateAlarm.type}
                  </Descriptions.Item>
                  <Descriptions.Item label="报警时间">
                    {locateAlarm.alarmTime}
                  </Descriptions.Item>
                </Descriptions>

                {associatedCameras.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#91caff', marginBottom: 8 }}>
                      <VideoCameraOutlined style={{ marginRight: 4 }} />
                      关联摄像头
                    </div>
                    <Space wrap>
                      {associatedCameras.map((camera) => (
                        <Button
                          key={camera.id}
                          size="small"
                          icon={<VideoCameraOutlined />}
                          type={camera.status === 'online' ? 'primary' : 'default'}
                          disabled={camera.status === 'offline'}
                          onClick={() => {
                            setSelectedAlarm(locateAlarm);
                            setShowAlarmModal(true);
                          }}
                        >
                          {camera.name}
                        </Button>
                      ))}
                    </Space>
                  </div>
                )}

                <Space style={{ width: '100%', marginTop: 12, justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedAlarm(locateAlarm);
                      setShowAlarmModal(true);
                    }}
                  >
                    处置报警
                  </Button>
                </Space>
              </Card>
            )}

            <Card title="楼层信息" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="楼层名称">{currentFloor?.name}</Descriptions.Item>
                <Descriptions.Item label="建筑面积">{currentFloor?.area} m²</Descriptions.Item>
                <Descriptions.Item label="层高">{currentFloor?.height} m</Descriptions.Item>
                <Descriptions.Item label="探测器">{detectors.length} 个</Descriptions.Item>
                <Descriptions.Item label="防火门">{fireDoors.length} 个</Descriptions.Item>
                <Descriptions.Item label="排烟设备">{smokeExhausts.length} 个</Descriptions.Item>
                <Descriptions.Item label="摄像头">{floorCameras.length} 个</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="设备状态统计" size="small">
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>正常</span>
                  <span style={{ color: '#52c41a' }}>
                    {floorDevices.filter((d) => d.status === 'normal').length}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#1f2f45', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${(floorDevices.filter((d) => d.status === 'normal').length / floorDevices.length) * 100}%`,
                      height: '100%',
                      background: '#52c41a',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>预警</span>
                  <span style={{ color: '#faad14' }}>
                    {floorDevices.filter((d) => d.status === 'warning').length}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#1f2f45', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${(floorDevices.filter((d) => d.status === 'warning').length / floorDevices.length) * 100}%`,
                      height: '100%',
                      background: '#faad14',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>故障</span>
                  <span style={{ color: '#ff4d4f' }}>
                    {floorDevices.filter((d) => d.status === 'fault').length}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#1f2f45', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${(floorDevices.filter((d) => d.status === 'fault').length / floorDevices.length) * 100}%`,
                      height: '100%',
                      background: '#ff4d4f',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>离线</span>
                  <span style={{ color: '#8c8c8c' }}>
                    {floorDevices.filter((d) => d.status === 'offline').length}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#1f2f45', borderRadius: 4 }}>
                  <div
                    style={{
                      width: `${(floorDevices.filter((d) => d.status === 'offline').length / floorDevices.length) * 100}%`,
                      height: '100%',
                      background: '#8c8c8c',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card title="图例说明" size="small">
              <Space direction="vertical" size="small">
                <Space>
                  <Badge color="#52c41a" />
                  <span>设备正常</span>
                </Space>
                <Space>
                  <Badge color="#faad14" />
                  <span>设备预警</span>
                </Space>
                <Space>
                  <Badge color="#ff4d4f" />
                  <span>设备故障/报警</span>
                </Space>
                <Space>
                  <Badge color="#8c8c8c" />
                  <span>设备离线</span>
                </Space>
                <Divider style={{ margin: '8px 0' }} />
                <Space>
                  <FireOutlined style={{ color: '#52c41a' }} />
                  <span>烟感探测器</span>
                </Space>
                <Space>
                  <SafetyOutlined style={{ color: '#52c41a' }} />
                  <span>防火门</span>
                </Space>
                <Space>
                  <ThunderboltOutlined style={{ color: '#52c41a' }} />
                  <span>排烟风机</span>
                </Space>
                <Space>
                  <VideoCameraOutlined style={{ color: '#1677ff' }} />
                  <span>监控摄像头</span>
                </Space>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            {getDeviceIcon(selectedDevice!)}
            设备详情 - {selectedDevice?.name}
          </Space>
        }
        open={showDeviceModal}
        onCancel={() => setShowDeviceModal(false)}
        footer={
          <Button onClick={() => setShowDeviceModal(false)}>关闭</Button>
        }
      >
        {selectedDevice && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="设备编号">{selectedDevice.id}</Descriptions.Item>
            <Descriptions.Item label="设备类型">
              {deviceTypeText[selectedDevice.type]}
            </Descriptions.Item>
            <Descriptions.Item label="设备名称">{selectedDevice.name}</Descriptions.Item>
            <Descriptions.Item label="所在楼层">
              {selectedDevice.floor > 0 ? `${selectedDevice.floor}层` : `B${Math.abs(selectedDevice.floor)}层`}
            </Descriptions.Item>
            <Descriptions.Item label="安装位置">{selectedDevice.location}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={statusColor[selectedDevice.status]}>
                {statusText[selectedDevice.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="上次巡检">{selectedDevice.lastCheckTime}</Descriptions.Item>
            <Descriptions.Item label="设备描述" span={2}>
              {selectedDevice.description}
            </Descriptions.Item>
            {(selectedDevice as Detector).detectorType && (
              <>
                <Descriptions.Item label="探测器类型">
                  {(selectedDevice as Detector).detectorType === 'smoke'
                    ? '烟感'
                    : (selectedDevice as Detector).detectorType === 'heat'
                    ? '温感'
                    : '手动'}
                </Descriptions.Item>
                {(selectedDevice as Detector).smokeValue !== undefined && (
                  <Descriptions.Item label="烟雾浓度">
                    {(selectedDevice as Detector).smokeValue?.toFixed(1)} %
                  </Descriptions.Item>
                )}
                {(selectedDevice as Detector).temperature !== undefined && (
                  <Descriptions.Item label="当前温度">
                    {(selectedDevice as Detector).temperature?.toFixed(1)} ℃
                  </Descriptions.Item>
                )}
              </>
            )}
            {(selectedDevice as FireDoor).doorStatus && (
              <>
                <Descriptions.Item label="门状态">
                  <Tag color={(selectedDevice as FireDoor).doorStatus === 'open' ? 'orange' : 'green'}>
                    {(selectedDevice as FireDoor).doorStatus === 'open' ? '开启' : '关闭'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="门编号">{(selectedDevice as FireDoor).doorName}</Descriptions.Item>
              </>
            )}
            {(selectedDevice as SmokeExhaust).exhaustStatus && (
              <>
                <Descriptions.Item label="风机状态">
                  <Tag color={(selectedDevice as SmokeExhaust).exhaustStatus === 'running' ? 'green' : 'default'}>
                    {(selectedDevice as SmokeExhaust).exhaustStatus === 'running' ? '运行中' : '已停止'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风机转速">
                  {(selectedDevice as SmokeExhaust).fanSpeed.toFixed(0)} %
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
};

export default FloorPlan;
