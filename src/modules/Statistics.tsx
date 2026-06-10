import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  DatePicker,
  Select,
  Descriptions,
  Drawer,
  Statistic,
  Progress,
} from 'antd';
import {
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  EyeOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  PieChartOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import type { Alarm, DailyReport } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const Statistics: React.FC = () => {
  const { alarms, dailyReports, getDisposalStepsByAlarm, setSelectedAlarm, setShowAlarmModal } = useStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [viewingAlarm, setViewingAlarm] = useState<Alarm | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<number>(-999);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  const responseChartRef = useRef<HTMLDivElement>(null);
  const alarmTrendChartRef = useRef<HTMLDivElement>(null);
  const statusPieChartRef = useRef<HTMLDivElement>(null);
  const floorBarChartRef = useRef<HTMLDivElement>(null);

  const responseChartInstance = useRef<echarts.ECharts | null>(null);
  const alarmTrendChartInstance = useRef<echarts.ECharts | null>(null);
  const statusPieChartInstance = useRef<echarts.ECharts | null>(null);
  const floorBarChartInstance = useRef<echarts.ECharts | null>(null);

  const filteredAlarms = alarms.filter((alarm) => {
    const alarmDate = dayjs(alarm.alarmTime);
    const matchDate = alarmDate.isAfter(dateRange[0]) && alarmDate.isBefore(dateRange[1].endOf('day'));
    const matchStatus = filterStatus === 'all' || alarm.status === filterStatus;
    const matchLevel = filterLevel === 'all' || alarm.level === filterLevel;
    const matchFloor = filterFloor === -999 || alarm.floor === filterFloor;
    return matchDate && matchStatus && matchLevel && matchFloor;
  });

  const filteredReports = dailyReports.filter((report) => {
    const reportDate = dayjs(report.date);
    return reportDate.isAfter(dateRange[0]) && reportDate.isBefore(dateRange[1].endOf('day'));
  }).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  const calculateResponseTime = (alarm: Alarm): number | null => {
    if (!alarm.alarmTime || !alarm.confirmTime) return null;
    const alarmTime = dayjs(alarm.alarmTime);
    const confirmTime = dayjs(alarm.confirmTime);
    return confirmTime.diff(alarmTime, 'second');
  };

  const statistics = {
    totalAlarms: filteredAlarms.length,
    confirmedAlarms: filteredAlarms.filter((a) => a.status === 'confirmed').length,
    falseAlarms: filteredAlarms.filter((a) => a.status === 'false_alarm').length,
    handledAlarms: filteredAlarms.filter((a) => a.status === 'handled').length,
    pendingAlarms: filteredAlarms.filter((a) => a.status === 'pending').length,
    avgResponseTime: (() => {
      const times = filteredAlarms.map(calculateResponseTime).filter((t): t is number => t !== null);
      return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    })(),
    falseAlarmRate: filteredAlarms.length > 0
      ? Math.round((filteredAlarms.filter((a) => a.status === 'false_alarm').length / filteredAlarms.length) * 100)
      : 0,
  };

  useEffect(() => {
    if (responseChartRef.current) {
      if (!responseChartInstance.current) {
        responseChartInstance.current = echarts.init(responseChartRef.current);
      }

      const responseTimes = filteredAlarms
        .map((alarm) => ({ alarm, time: calculateResponseTime(alarm) }))
        .filter((item): item is { alarm: Alarm; time: number } => item.time !== null)
        .sort((a, b) => dayjs(b.alarm.alarmTime).valueOf() - dayjs(a.alarm.alarmTime).valueOf())
        .slice(0, 20)
        .reverse();

      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const data = params[0];
            return `${data.name}<br/>响应时长: ${data.value}秒`;
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: responseTimes.map((item) => dayjs(item.alarm.alarmTime).format('MM-DD HH:mm')),
          axisLabel: { color: '#91caff', rotate: 45, fontSize: 10 },
          axisLine: { lineStyle: { color: '#1f2f45' } },
        },
        yAxis: {
          type: 'value',
          name: '秒',
          nameTextStyle: { color: '#91caff' },
          axisLabel: { color: '#91caff' },
          splitLine: { lineStyle: { color: '#1f2f45' } },
        },
        series: [
          {
            type: 'bar',
            data: responseTimes.map((item) => ({
              value: item.time,
              itemStyle: {
                color: item.time < 60 ? '#52c41a' : item.time < 120 ? '#faad14' : '#ff4d4f',
              },
            })),
            barWidth: '60%',
          },
        ],
      };

      responseChartInstance.current.setOption(option);
    }

    if (alarmTrendChartRef.current) {
      if (!alarmTrendChartInstance.current) {
        alarmTrendChartInstance.current = echarts.init(alarmTrendChartRef.current);
      }

      const days = 30;
      const dates: string[] = [];
      const alarmCounts: number[] = [];
      const falseAlarmCounts: number[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day');
        dates.push(date.format('MM-DD'));
        const dayAlarms = alarms.filter((a) => dayjs(a.alarmTime).isSame(date, 'day'));
        alarmCounts.push(dayAlarms.length);
        falseAlarmCounts.push(dayAlarms.filter((a) => a.status === 'false_alarm').length);
      }

      const option: echarts.EChartsOption = {
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['总报警', '误报'],
          textStyle: { color: '#91caff' },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: { color: '#91caff', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1f2f45' } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#91caff' },
          splitLine: { lineStyle: { color: '#1f2f45' } },
        },
        series: [
          {
            name: '总报警',
            type: 'line',
            data: alarmCounts,
            smooth: true,
            itemStyle: { color: '#1677ff' },
            areaStyle: { color: 'rgba(22, 119, 255, 0.3)' },
          },
          {
            name: '误报',
            type: 'line',
            data: falseAlarmCounts,
            smooth: true,
            itemStyle: { color: '#faad14' },
            areaStyle: { color: 'rgba(250, 173, 20, 0.3)' },
          },
        ],
      };

      alarmTrendChartInstance.current.setOption(option);
    }

    if (statusPieChartRef.current) {
      if (!statusPieChartInstance.current) {
        statusPieChartInstance.current = echarts.init(statusPieChartRef.current);
      }

      const option: echarts.EChartsOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { color: '#91caff' },
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#0a1628', borderWidth: 2 },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' },
            },
            labelLine: { show: false },
            data: [
              { value: statistics.confirmedAlarms, name: '已确认', itemStyle: { color: '#1677ff' } },
              { value: statistics.falseAlarms, name: '误报', itemStyle: { color: '#faad14' } },
              { value: statistics.handledAlarms, name: '已处置', itemStyle: { color: '#52c41a' } },
              { value: statistics.pendingAlarms, name: '待处理', itemStyle: { color: '#ff4d4f' } },
            ],
          },
        ],
      };

      statusPieChartInstance.current.setOption(option);
    }

    if (floorBarChartRef.current) {
      if (!floorBarChartInstance.current) {
        floorBarChartInstance.current = echarts.init(floorBarChartRef.current);
      }

      const floors = [-2, -1, 1, 2, 3, 4, 5];
      const floorNames = floors.map((f) => (f > 0 ? `${f}层` : `B${Math.abs(f)}层`));
      const floorAlarms = floors.map(
        (floor) => filteredAlarms.filter((a) => a.floor === floor).length
      );

      const option: echarts.EChartsOption = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#91caff' },
          splitLine: { lineStyle: { color: '#1f2f45' } },
        },
        yAxis: {
          type: 'category',
          data: floorNames,
          axisLabel: { color: '#91caff' },
          axisLine: { lineStyle: { color: '#1f2f45' } },
        },
        series: [
          {
            type: 'bar',
            data: floorAlarms.map((value, index) => ({
              value,
              itemStyle: {
                color: value === 0 ? '#1f2f45' : value < 3 ? '#52c41a' : value < 6 ? '#faad14' : '#ff4d4f',
              },
            })),
            barWidth: '60%',
            label: {
              show: true,
              position: 'right',
              color: '#fff',
              formatter: '{c}起',
            },
          },
        ],
      };

      floorBarChartInstance.current.setOption(option);
    }

    const handleResize = () => {
      responseChartInstance.current?.resize();
      alarmTrendChartInstance.current?.resize();
      statusPieChartInstance.current?.resize();
      floorBarChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [filteredAlarms, alarms]);

  const handleViewAlarm = (alarm: Alarm) => {
    setViewingAlarm(alarm);
    setShowDetail(true);
  };

  const handleOpenAlarmModal = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setShowAlarmModal(true);
  };

  const handleViewReport = (report: DailyReport) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      pending: { color: 'red', icon: <WarningOutlined />, text: '待处理' },
      confirmed: { color: 'blue', icon: <CheckCircleOutlined />, text: '已确认' },
      false_alarm: { color: 'gold', icon: <CloseCircleOutlined />, text: '误报' },
      handled: { color: 'green', icon: <CheckCircleOutlined />, text: '已处置' },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <Tag color={config.color}>
        {config.icon} {config.text}
      </Tag>
    );
  };

  const getLevelTag = (level: string) => {
    const levelMap: Record<string, { color: string; text: string }> = {
      urgent: { color: 'red', text: '紧急' },
      important: { color: 'orange', text: '重要' },
      general: { color: 'blue', text: '一般' },
    };
    const config = levelMap[level] || levelMap.general;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const historyColumns = [
    {
      title: '报警编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '报警类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => getLevelTag(level),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      render: (floor: number) => (floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`),
    },
    {
      title: '报警时间',
      dataIndex: 'alarmTime',
      key: 'alarmTime',
      width: 170,
    },
    {
      title: '响应时长',
      key: 'responseTime',
      render: (_: any, record: Alarm) => {
        const time = calculateResponseTime(record);
        if (time === null) return <span style={{ color: '#8c8c8c' }}>-</span>;
        return (
          <Tag color={time < 60 ? 'success' : time < 120 ? 'warning' : 'error'}>
            {time}秒
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Alarm) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewAlarm(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleOpenAlarmModal(record)}>
              处置
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const reportColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '总报警数',
      dataIndex: 'totalAlarms',
      key: 'totalAlarms',
      render: (value: number) => <strong style={{ color: '#1677ff' }}>{value}</strong>,
    },
    {
      title: '真实报警',
      dataIndex: 'realAlarms',
      key: 'realAlarms',
      render: (value: number) => <strong style={{ color: '#ff4d4f' }}>{value}</strong>,
    },
    {
      title: '误报',
      dataIndex: 'falseAlarms',
      key: 'falseAlarms',
      render: (value: number) => <strong style={{ color: '#faad14' }}>{value}</strong>,
    },
    {
      title: '误报率',
      key: 'falseRate',
      render: (_: any, record: DailyReport) => {
        const rate = record.totalAlarms > 0 ? Math.round((record.falseAlarms / record.totalAlarms) * 100) : 0;
        return (
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate < 30 ? '#52c41a' : rate < 50 ? '#faad14' : '#ff4d4f'}
            showInfo={true}
          />
        );
      },
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (value: number) => `${value}秒`,
    },
    {
      title: '设备故障',
      dataIndex: 'deviceFaults',
      key: 'deviceFaults',
      render: (value: number) => value || '-',
    },
    {
      title: '值班人员',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DailyReport) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewReport(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<FileExcelOutlined />}>
            导出
          </Button>
          <Button type="link" size="small" icon={<PrinterOutlined />}>
            打印
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <FilterOutlined />
            筛选条件
          </Space>
        }
        size="small"
      >
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            style={{ width: 280 }}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
            prefix={<FilterOutlined />}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待处理</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="false_alarm">误报</Option>
            <Option value="handled">已处置</Option>
          </Select>
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            style={{ width: 120 }}
            prefix={<WarningOutlined />}
          >
            <Option value="all">全部级别</Option>
            <Option value="urgent">紧急</Option>
            <Option value="important">重要</Option>
            <Option value="general">一般</Option>
          </Select>
          <Select
            value={filterFloor}
            onChange={setFilterFloor}
            style={{ width: 120 }}
            prefix={<SearchOutlined />}
          >
            <Option value={-999}>全部楼层</Option>
            {[-2, -1, 1, 2, 3, 4, 5].map((floor) => (
              <Option key={floor} value={floor}>
                {floor > 0 ? `${floor}层` : `B${Math.abs(floor)}层`}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1677ff' }}>{statistics.totalAlarms}</div>
            <div className="stat-label">总报警数</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{statistics.avgResponseTime}s</div>
            <div className="stat-label">平均响应时间</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#faad14' }}>{statistics.falseAlarmRate}%</div>
            <div className="stat-label">误报率</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{statistics.pendingAlarms}</div>
            <div className="stat-label">待处理</div>
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="response">
        <TabPane
          tab={
            <Space>
              <ClockCircleOutlined />
              响应时长统计
            </Space>
          }
          key="response"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    最近20条报警响应时长
                  </Space>
                }
              >
                <div ref={responseChartRef} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <RiseOutlined />
                    响应效率指标
                  </Space>
                }
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Statistic
                    title="平均响应时间"
                    value={statistics.avgResponseTime}
                    suffix="秒"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ClockCircleOutlined />}
                  />
                  <Statistic
                    title="最快响应"
                    value={35}
                    suffix="秒"
                    valueStyle={{ color: '#1677ff' }}
                  />
                  <Statistic
                    title="最慢响应"
                    value={180}
                    suffix="秒"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  <Progress
                    type="dashboard"
                    percent={statistics.avgResponseTime < 60 ? 95 : statistics.avgResponseTime < 120 ? 75 : 50}
                    format={() => `${statistics.avgResponseTime < 60 ? '优秀' : statistics.avgResponseTime < 120 ? '良好' : '需改进'}`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <HistoryOutlined />
              历史警情
            </Space>
          }
          key="history"
        >
          <Card
            title={
              <Space>
                <HistoryOutlined />
                历史警情记录
              </Space>
            }
            extra={
              <Space>
                <Button icon={<FileExcelOutlined />}>导出Excel</Button>
                <Button icon={<PrinterOutlined />}>打印</Button>
              </Space>
            }
          >
            <Table
              columns={historyColumns}
              dataSource={filteredAlarms}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <FileTextOutlined />
              值班日报
            </Space>
          }
          key="report"
        >
          <Card
            title={
              <Space>
                <FileTextOutlined />
                值班日报列表
              </Space>
            }
            extra={
              <Space>
                <Button icon={<FileExcelOutlined />}>批量导出</Button>
                <Button icon={<PrinterOutlined />}>批量打印</Button>
              </Space>
            }
          >
            <Table
              columns={reportColumns}
              dataSource={filteredReports}
              rowKey="date"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BarChartOutlined />
              综合统计
            </Space>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    30天报警趋势
                  </Space>
                }
              >
                <div ref={alarmTrendChartRef} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined />
                    报警状态分布
                  </Space>
                }
              >
                <div ref={statusPieChartRef} style={{ height: 300 }} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined />
                    各楼层报警分布
                  </Space>
                }
              >
                <div ref={floorBarChartRef} style={{ height: 300 }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            报警详情
          </Space>
        }
        placement="right"
        width={500}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      >
        {viewingAlarm && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="报警编号">{viewingAlarm.id}</Descriptions.Item>
              <Descriptions.Item label="报警类型">{viewingAlarm.type}</Descriptions.Item>
              <Descriptions.Item label="报警级别">{getLevelTag(viewingAlarm.level)}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{viewingAlarm.deviceName}</Descriptions.Item>
              <Descriptions.Item label="设备编号">{viewingAlarm.deviceId}</Descriptions.Item>
              <Descriptions.Item label="位置">
                {viewingAlarm.floor > 0 ? `${viewingAlarm.floor}层` : `B${Math.abs(viewingAlarm.floor)}层`}
                {' '}{viewingAlarm.location}
              </Descriptions.Item>
              <Descriptions.Item label="报警时间">{viewingAlarm.alarmTime}</Descriptions.Item>
              <Descriptions.Item label="确认时间">{viewingAlarm.confirmTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="处置时间">{viewingAlarm.handleTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="响应时长">
                {calculateResponseTime(viewingAlarm) !== null
                  ? `${calculateResponseTime(viewingAlarm)}秒`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(viewingAlarm.status)}</Descriptions.Item>
              <Descriptions.Item label="操作员">{viewingAlarm.operator || '-'}</Descriptions.Item>
              <Descriptions.Item label="报警描述">{viewingAlarm.description}</Descriptions.Item>
              <Descriptions.Item label="备注">{viewingAlarm.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  处置步骤
                </Space>
              }
              size="small"
            >
              {getDisposalStepsByAlarm(viewingAlarm.id).length > 0 ? (
                getDisposalStepsByAlarm(viewingAlarm.id).map((step) => (
                  <div
                    key={step.id}
                    style={{
                      padding: '8px 12px',
                      marginBottom: 8,
                      background: step.completed ? 'rgba(82, 196, 26, 0.1)' : 'rgba(250, 173, 20, 0.1)',
                      borderLeft: `3px solid ${step.completed ? '#52c41a' : '#faad14'}`,
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <Tag color={step.completed ? 'success' : 'warning'}>
                          步骤 {step.order}
                        </Tag>
                        {step.action}
                      </span>
                      <Tag color={step.completed ? 'success' : 'processing'}>
                        {step.completed ? '已完成' : '进行中'}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#91caff', marginTop: 4 }}>
                      {step.operator} · {step.time}
                    </div>
                    {step.remark && (
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        备注: {step.remark}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <span style={{ color: '#8c8c8c' }}>暂无处置步骤</span>
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            值班日报详情
          </Space>
        }
        placement="right"
        width={500}
        open={showReportDetail}
        onClose={() => setShowReportDetail(false)}
      >
        {selectedReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  {selectedReport.date} 值班日报
                </Space>
              }
              size="small"
            >
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="日期">{selectedReport.date}</Descriptions.Item>
                <Descriptions.Item label="值班人员">{selectedReport.operator}</Descriptions.Item>
                <Descriptions.Item label="总报警数">
                  <strong style={{ color: '#1677ff' }}>{selectedReport.totalAlarms}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="真实报警">
                  <strong style={{ color: '#ff4d4f' }}>{selectedReport.realAlarms}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="误报">
                  <strong style={{ color: '#faad14' }}>{selectedReport.falseAlarms}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="误报率">
                  {selectedReport.totalAlarms > 0
                    ? Math.round((selectedReport.falseAlarms / selectedReport.totalAlarms) * 100)
                    : 0}%
                </Descriptions.Item>
                <Descriptions.Item label="平均响应时间">{selectedReport.avgResponseTime}秒</Descriptions.Item>
                <Descriptions.Item label="设备故障数">{selectedReport.deviceFaults}</Descriptions.Item>
                <Descriptions.Item label="已完成任务">{selectedReport.completedTasks}</Descriptions.Item>
                <Descriptions.Item label="待处理任务">{selectedReport.pendingTasks}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <Space>
                  <BarChartOutlined />
                  数据概览
                </Space>
              }
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="总报警"
                    value={selectedReport.totalAlarms}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="真实报警"
                    value={selectedReport.realAlarms}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="误报"
                    value={selectedReport.falseAlarms}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均响应"
                    value={selectedReport.avgResponseTime}
                    suffix="秒"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<FileExcelOutlined />}>导出Excel</Button>
              <Button type="primary" icon={<PrinterOutlined />}>打印日报</Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default Statistics;
