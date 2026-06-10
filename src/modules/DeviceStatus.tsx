import React, { useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Space, Select, Tabs, Badge, Descriptions, Modal } from 'antd';
import {
  AppstoreOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  FireOutlined,
  FilterOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { DeviceStatus as DeviceStatusType, Device, FireDoor, SmokeExhaust, Detector } from '../types';

const { Option } = Select;
const { TabPane } = Tabs;

const DeviceStatus: React.FC = () => {
  const { devices, getDevicesByFloor, setSelectedFloor, selectedFloor } = useStore();
  const [statusFilter, setStatusFilter] = useState<DeviceStatusType | 'all'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const floorDevices = selectedFloor === -999 ? devices : getDevicesByFloor(selectedFloor);

  const detectors = floorDevices.filter((d): d is Detector => d.type === 'detector');
  const fireDoors = floorDevices.filter((d): d is FireDoor => d.type === 'fire_door');
  const smokeExhausts = floorDevices.filter((d): d is SmokeExhaust => d.type === 'smoke_exhaust');

  const statusColor = {
    normal: 'green',
    warning: 'orange',
    fault: 'red',
    offline: 'default',
  };

  const statusText = {
    normal: '正常',
    warning: '预警',
    fault: '故障',
    offline: '离线',
  };

  const filterByStatus = <T extends { status: DeviceStatusType }>(items: T[]) => {
    if (statusFilter === 'all') return items;
    return items.filter((item) => item.status === statusFilter);
  };

  const getStatusStats = (items: { status: DeviceStatusType }[]) => ({
    total: items.length,
    normal: items.filter((i) => i.status === 'normal').length,
    warning: items.filter((i) => i.status === 'warning').length,
    fault: items.filter((i) => i.status === 'fault').length,
    offline: items.filter((i) => i.status === 'offline').length,
  });

  const detectorStats = getStatusStats(detectors);
  const doorStats = getStatusStats(fireDoors);
  const exhaustStats = getStatusStats(smokeExhausts);

  const handleViewDetail = (device: Device) => {
    setSelectedDevice(device);
    setShowDeviceModal(true);
  };

  const detectorColumns = [
    {
      title: '设备编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'detectorType',
      key: 'detectorType',
      width: 100,
      render: (type: string) => {
        const typeText: Record<string, string> = {
          smoke: '烟感',
          heat: '温感',
          manual: '手动',
        };
        return typeText[type] || type;
      },
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
      render: (floor: number) => (floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DeviceStatusType) => (
        <Space>
          {status === 'fault' && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          <Tag color={statusColor[status]}>{statusText[status]}</Tag>
        </Space>
      ),
    },
    {
      title: '烟雾浓度',
      dataIndex: 'smokeValue',
      key: 'smokeValue',
      width: 100,
      render: (value: number) => (value !== undefined ? `${value.toFixed(1)}%` : '-'),
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      render: (value: number) => (value !== undefined ? `${value.toFixed(1)}℃` : '-'),
    },
    {
      title: '上次巡检',
      dataIndex: 'lastCheckTime',
      key: 'lastCheckTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Detector) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const doorColumns = [
    {
      title: '设备编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '门编号',
      dataIndex: 'doorName',
      key: 'doorName',
      width: 100,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
      render: (floor: number) => (floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DeviceStatusType) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '门状态',
      dataIndex: 'doorStatus',
      key: 'doorStatus',
      width: 100,
      render: (status: string) => {
        const color = status === 'open' ? 'orange' : status === 'closed' ? 'green' : 'red';
        const text = status === 'open' ? '开启' : status === 'closed' ? '关闭' : '故障';
        return (
          <Space>
            {status === 'open' ? <WarningOutlined style={{ color: '#faad14' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            <Tag color={color}>{text}</Tag>
          </Space>
        );
      },
    },
    {
      title: '上次巡检',
      dataIndex: 'lastCheckTime',
      key: 'lastCheckTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: FireDoor) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const exhaustColumns = [
    {
      title: '设备编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
      render: (floor: number) => (floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DeviceStatusType) => <Tag color={statusColor[status]}>{statusText[status]}</Tag>,
    },
    {
      title: '运行状态',
      dataIndex: 'exhaustStatus',
      key: 'exhaustStatus',
      width: 100,
      render: (status: string) => {
        const color = status === 'running' ? 'green' : status === 'stopped' ? 'default' : 'red';
        const text = status === 'running' ? '运行中' : status === 'stopped' ? '已停止' : '故障';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '风机转速',
      dataIndex: 'fanSpeed',
      key: 'fanSpeed',
      width: 100,
      render: (speed: number) => `${speed.toFixed(0)}%`,
    },
    {
      title: '上次巡检',
      dataIndex: 'lastCheckTime',
      key: 'lastCheckTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: SmokeExhaust) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FireOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                <span style={{ fontSize: 16 }}>探测器</span>
              </div>
              <Row gutter={[8, 8]} style={{ fontSize: 12 }}>
                <Col span={12}>
                  <Badge status="success" text={`正常 ${detectorStats.normal}`} />
                </Col>
                <Col span={12}>
                  <Badge status="warning" text={`预警 ${detectorStats.warning}`} />
                </Col>
                <Col span={12}>
                  <Badge status="error" text={`故障 ${detectorStats.fault}`} />
                </Col>
                <Col span={12}>
                  <Badge status="default" text={`离线 ${detectorStats.offline}`} />
                </Col>
              </Row>
            </Space>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <span style={{ fontSize: 16 }}>防火门</span>
              </div>
              <Row gutter={[8, 8]} style={{ fontSize: 12 }}>
                <Col span={12}>
                  <Badge status="success" text={`正常 ${doorStats.normal}`} />
                </Col>
                <Col span={12}>
                  <Badge status="warning" text={`预警 ${doorStats.warning}`} />
                </Col>
                <Col span={12}>
                  <Badge status="error" text={`故障 ${doorStats.fault}`} />
                </Col>
                <Col span={12}>
                  <Badge status="default" text={`离线 ${doorStats.offline}`} />
                </Col>
              </Row>
            </Space>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <span style={{ fontSize: 16 }}>排烟设备</span>
              </div>
              <Row gutter={[8, 8]} style={{ fontSize: 12 }}>
                <Col span={12}>
                  <Badge status="success" text={`正常 ${exhaustStats.normal}`} />
                </Col>
                <Col span={12}>
                  <Badge status="warning" text={`预警 ${exhaustStats.warning}`} />
                </Col>
                <Col span={12}>
                  <Badge status="error" text={`故障 ${exhaustStats.fault}`} />
                </Col>
                <Col span={12}>
                  <Badge status="default" text={`离线 ${exhaustStats.offline}`} />
                </Col>
              </Row>
            </Space>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <AppstoreOutlined />
            设备状态监控
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
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">全部状态</Option>
              <Option value="normal">正常</Option>
              <Option value="warning">预警</Option>
              <Option value="fault">故障</Option>
              <Option value="offline">离线</Option>
            </Select>
          </Space>
        }
      >
        <Tabs defaultActiveKey="detector">
          <TabPane
            tab={
              <Space>
                <FireOutlined />
                探测器 ({filterByStatus(detectors).length})
              </Space>
            }
            key="detector"
          >
            <Table
              columns={detectorColumns}
              dataSource={filterByStatus(detectors)}
              rowKey="id"
              scroll={{ x: 1100, y: 400 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <Space>
                <SafetyOutlined />
                防火门 ({filterByStatus(fireDoors).length})
              </Space>
            }
            key="door"
          >
            <Table
              columns={doorColumns}
              dataSource={filterByStatus(fireDoors)}
              rowKey="id"
              scroll={{ x: 1100, y: 400 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <Space>
                <ThunderboltOutlined />
                排烟设备 ({filterByStatus(smokeExhausts).length})
              </Space>
            }
            key="exhaust"
          >
            <Table
              columns={exhaustColumns}
              dataSource={filterByStatus(smokeExhausts)}
              rowKey="id"
              scroll={{ x: 1100, y: 400 }}
              pagination={{
                pageSize: 8,
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
            <AppstoreOutlined />
            设备详情
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
            <Descriptions.Item label="设备名称">{selectedDevice.name}</Descriptions.Item>
            <Descriptions.Item label="设备类型">
              {selectedDevice.type === 'detector'
                ? '探测器'
                : selectedDevice.type === 'fire_door'
                ? '防火门'
                : '排烟设备'}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={statusColor[selectedDevice.status]}>{statusText[selectedDevice.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所在楼层">
              {selectedDevice.floor > 0 ? `${selectedDevice.floor}层` : `B${Math.abs(selectedDevice.floor)}层`}
            </Descriptions.Item>
            <Descriptions.Item label="安装位置">{selectedDevice.location}</Descriptions.Item>
            <Descriptions.Item label="上次巡检">{selectedDevice.lastCheckTime}</Descriptions.Item>
            <Descriptions.Item label="设备描述" span={2}>
              {selectedDevice.description}
            </Descriptions.Item>
            {(selectedDevice as any).detectorType && (
              <>
                <Descriptions.Item label="探测器类型">
                  {(selectedDevice as any).detectorType === 'smoke'
                    ? '烟雾探测器'
                    : (selectedDevice as any).detectorType === 'heat'
                    ? '温度探测器'
                    : '手动报警按钮'}
                </Descriptions.Item>
                {(selectedDevice as any).smokeValue !== undefined && (
                  <Descriptions.Item label="烟雾浓度">
                    {(selectedDevice as any).smokeValue.toFixed(1)} %
                  </Descriptions.Item>
                )}
                {(selectedDevice as any).temperature !== undefined && (
                  <Descriptions.Item label="当前温度">
                    {(selectedDevice as any).temperature.toFixed(1)} ℃
                  </Descriptions.Item>
                )}
              </>
            )}
            {(selectedDevice as any).doorStatus && (
              <>
                <Descriptions.Item label="门编号">{(selectedDevice as any).doorName}</Descriptions.Item>
                <Descriptions.Item label="门状态">
                  {(selectedDevice as any).doorStatus === 'open' ? (
                    <Tag color="orange"><WarningOutlined /> 开启</Tag>
                  ) : (selectedDevice as any).doorStatus === 'closed' ? (
                    <Tag color="green"><CheckCircleOutlined /> 关闭</Tag>
                  ) : (
                    <Tag color="red"><CloseCircleOutlined /> 故障</Tag>
                  )}
                </Descriptions.Item>
              </>
            )}
            {(selectedDevice as any).exhaustStatus && (
              <>
                <Descriptions.Item label="运行状态">
                  <Tag color={(selectedDevice as any).exhaustStatus === 'running' ? 'green' : 'default'}>
                    {(selectedDevice as any).exhaustStatus === 'running' ? '运行中' : '已停止'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风机转速">
                  {(selectedDevice as any).fanSpeed.toFixed(0)} %
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
};

export default DeviceStatus;
