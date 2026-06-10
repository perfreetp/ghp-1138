import dayjs from 'dayjs';
import type {
  Alarm,
  Device,
  FireDoor,
  SmokeExhaust,
  Detector,
  Camera,
  PhoneRecord,
  DisposalStep,
  DutyLog,
  Contact,
  DailyReport,
  DrillRecord,
  PendingTask,
  Floor,
} from '../types';

export const floors: Floor[] = [
  { id: 1, name: '1层', area: 2500, height: 4.5, hasBasement: false },
  { id: 2, name: '2层', area: 2500, height: 4.5, hasBasement: false },
  { id: 3, name: '3层', area: 2500, height: 4.5, hasBasement: false },
  { id: 4, name: '4层', area: 2500, height: 4.5, hasBasement: false },
  { id: 5, name: '5层', area: 2500, height: 4.5, hasBasement: false },
  { id: -1, name: 'B1层', area: 3000, height: 3.8, hasBasement: true },
  { id: -2, name: 'B2层', area: 3000, height: 3.8, hasBasement: true },
];

const now = dayjs();

export const initialAlarms: Alarm[] = [
  {
    id: 'A001',
    deviceId: 'D053',
    deviceName: '3层烟感3',
    location: '3层东侧走廊',
    floor: 3,
    type: '烟雾报警',
    level: 'urgent',
    status: 'pending',
    alarmTime: now.subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    description: '检测到烟雾浓度异常升高',
    cameraIds: ['C003', 'C004'],
  },
  {
    id: 'A002',
    deviceId: 'D049',
    deviceName: '2层烟感9',
    location: '2层会议室门口',
    floor: 2,
    type: '手动报警',
    level: 'important',
    status: 'confirmed',
    alarmTime: now.subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    confirmTime: now.subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    description: '人员按下手动报警按钮',
    operator: '张三',
    remark: '已核实，为测试触发',
    cameraIds: ['C002'],
  },
  {
    id: 'A003',
    deviceId: 'D015',
    deviceName: 'B1层烟感5',
    location: 'B1层配电室',
    floor: -1,
    type: '温度报警',
    level: 'urgent',
    status: 'pending',
    alarmTime: now.subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    description: '检测到温度超过阈值(65℃)',
    cameraIds: ['C008'],
  },
  {
    id: 'A004',
    deviceId: 'D072',
    deviceName: '5层烟感2',
    location: '5层办公区',
    floor: 5,
    type: '烟雾报警',
    level: 'general',
    status: 'false_alarm',
    alarmTime: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    confirmTime: now.subtract(118, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    handleTime: now.subtract(115, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    description: '检测到轻微烟雾',
    operator: '李四',
    remark: '误报，现场有人员吸烟',
    cameraIds: ['C006'],
  },
  {
    id: 'A005',
    deviceId: 'FD023',
    deviceName: '4层防火门3',
    location: '4层楼梯间',
    floor: 4,
    type: '防火门异常',
    level: 'important',
    status: 'handled',
    alarmTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    confirmTime: now.subtract(23, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    handleTime: now.subtract(22, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    description: '防火门长时间未关闭',
    operator: '王五',
    remark: '已通知保安关闭',
    cameraIds: ['C005'],
  },
];

const generateDetectors = (): Detector[] => {
  const detectors: Detector[] = [];
  const positions = [
    { x: 100, y: 150 }, { x: 300, y: 150 }, { x: 500, y: 150 },
    { x: 700, y: 150 }, { x: 100, y: 350 }, { x: 300, y: 350 },
    { x: 500, y: 350 }, { x: 700, y: 350 }, { x: 200, y: 250 },
    { x: 600, y: 250 },
  ];

  for (let floor = -2; floor <= 5; floor++) {
    for (let i = 0; i < 10; i++) {
      const idx = (floor + 2) * 10 + i;
      detectors.push({
        id: `D${String(idx + 1).padStart(3, '0')}`,
        name: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层烟感${i + 1}`,
        type: 'detector',
        detectorType: i === 5 ? 'heat' : i === 9 ? 'manual' : 'smoke',
        floor,
        location: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层${['东侧', '西侧', '南侧', '北侧', '中央'][i % 5]}`,
        status: idx % 15 === 0 ? 'warning' : idx % 25 === 0 ? 'fault' : idx % 30 === 0 ? 'offline' : 'normal',
        position: positions[i],
        lastCheckTime: now.subtract(idx, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        description: i === 5 ? '温度探测器' : i === 9 ? '手动报警按钮' : '光电感烟探测器',
        smokeValue: 10 + Math.random() * 20,
        temperature: 20 + Math.random() * 15,
      });
    }
  }
  return detectors;
};

const generateFireDoors = (): FireDoor[] => {
  const doors: FireDoor[] = [];
  const positions = [
    { x: 50, y: 200 }, { x: 750, y: 200 },
    { x: 400, y: 50 }, { x: 400, y: 450 },
  ];

  for (let floor = -2; floor <= 5; floor++) {
    for (let i = 0; i < 4; i++) {
      const idx = (floor + 2) * 4 + i;
      doors.push({
        id: `FD${String(idx + 1).padStart(3, '0')}`,
        name: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层防火门${i + 1}`,
        type: 'fire_door',
        floor,
        location: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层${['楼梯间A', '楼梯间B', '电梯厅', '设备间'][i]}`,
        status: idx % 8 === 0 ? 'warning' : idx % 12 === 0 ? 'fault' : 'normal',
        position: positions[i],
        lastCheckTime: now.subtract(idx * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        description: '甲级防火门',
        doorStatus: idx % 6 === 0 ? 'open' : 'closed',
        doorName: `FM-${floor}-${i + 1}`,
      });
    }
  }
  return doors;
};

const generateSmokeExhausts = (): SmokeExhaust[] => {
  const exhausts: SmokeExhaust[] = [];
  const positions = [
    { x: 150, y: 400 }, { x: 650, y: 400 },
    { x: 150, y: 100 }, { x: 650, y: 100 },
  ];

  for (let floor = -2; floor <= 5; floor++) {
    for (let i = 0; i < 4; i++) {
      const idx = (floor + 2) * 4 + i;
      exhausts.push({
        id: `SE${String(idx + 1).padStart(3, '0')}`,
        name: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层排烟风机${i + 1}`,
        type: 'smoke_exhaust',
        floor,
        location: `${floor > 0 ? '' : 'B'}${Math.abs(floor)}层${['东北', '西北', '东南', '西南'][i]}机房`,
        status: idx % 10 === 0 ? 'fault' : idx % 15 === 0 ? 'offline' : 'normal',
        position: positions[i],
        lastCheckTime: now.subtract(idx * 3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        description: '消防排烟风机',
        exhaustStatus: idx % 7 === 0 ? 'running' : 'stopped',
        fanSpeed: idx % 7 === 0 ? 50 + Math.random() * 50 : 0,
      });
    }
  }
  return exhausts;
};

export const detectors = generateDetectors();
export const fireDoors = generateFireDoors();
export const smokeExhausts = generateSmokeExhausts();
export const devices: Device[] = [...detectors, ...fireDoors, ...smokeExhausts];

export const cameras: Camera[] = [
  { id: 'C001', name: '1层大厅摄像机', floor: 1, location: '1层大厅中央', position: { x: 400, y: 250 }, status: 'online', streamUrl: 'rtsp://192.168.1.101/camera1', associatedAlarms: [] },
  { id: 'C002', name: '2层会议室摄像机', floor: 2, location: '2层会议室门口', position: { x: 200, y: 200 }, status: 'online', streamUrl: 'rtsp://192.168.1.102/camera2', associatedAlarms: ['A002'] },
  { id: 'C003', name: '3层东侧摄像机', floor: 3, location: '3层东侧走廊', position: { x: 100, y: 150 }, status: 'online', streamUrl: 'rtsp://192.168.1.103/camera3', associatedAlarms: ['A001'] },
  { id: 'C004', name: '3层西侧摄像机', floor: 3, location: '3层西侧走廊', position: { x: 700, y: 150 }, status: 'online', streamUrl: 'rtsp://192.168.1.104/camera4', associatedAlarms: ['A001'] },
  { id: 'C005', name: '4层楼梯间摄像机', floor: 4, location: '4层楼梯间', position: { x: 50, y: 200 }, status: 'online', streamUrl: 'rtsp://192.168.1.105/camera5', associatedAlarms: ['A005'] },
  { id: 'C006', name: '5层办公区摄像机', floor: 5, location: '5层办公区中央', position: { x: 400, y: 300 }, status: 'online', streamUrl: 'rtsp://192.168.1.106/camera6', associatedAlarms: ['A004'] },
  { id: 'C007', name: 'B1层车库摄像机', floor: -1, location: 'B1层车库入口', position: { x: 300, y: 200 }, status: 'online', streamUrl: 'rtsp://192.168.1.107/camera7', associatedAlarms: [] },
  { id: 'C008', name: 'B1层配电室摄像机', floor: -1, location: 'B1层配电室', position: { x: 600, y: 350 }, status: 'online', streamUrl: 'rtsp://192.168.1.108/camera8', associatedAlarms: ['A003'] },
  { id: 'C009', name: 'B2层机房摄像机', floor: -2, location: 'B2层数据机房', position: { x: 400, y: 250 }, status: 'offline', streamUrl: 'rtsp://192.168.1.109/camera9', associatedAlarms: [] },
  { id: 'C010', name: 'B2层仓库摄像机', floor: -2, location: 'B2层仓库', position: { x: 200, y: 350 }, status: 'online', streamUrl: 'rtsp://192.168.1.110/camera10', associatedAlarms: [] },
];

export const phoneRecords: PhoneRecord[] = [
  { id: 'P001', alarmId: 'A002', time: now.subtract(12, 'minute').format('YYYY-MM-DD HH:mm:ss'), caller: '张三', receiver: '保安队长', phone: '138****1234', content: '通知现场核实2层报警情况', duration: 45 },
  { id: 'P002', alarmId: 'A001', time: now.subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'), caller: '李四', receiver: '消防中控室', phone: '119', content: '报告3层烟雾报警情况', duration: 120 },
  { id: 'P003', time: now.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), caller: '王五', receiver: '工程部', phone: '139****5678', content: '询问设备巡检情况', duration: 85 },
];

export const disposalSteps: DisposalStep[] = [
  { id: 'S001', alarmId: 'A002', order: 1, action: '接收报警信号，核实报警位置', operator: '张三', time: now.subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: true },
  { id: 'S002', alarmId: 'A002', order: 2, action: '通知保安人员前往现场', operator: '张三', time: now.subtract(14, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: true },
  { id: 'S003', alarmId: 'A002', order: 3, action: '调取现场监控视频', operator: '张三', time: now.subtract(13, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: true },
  { id: 'S004', alarmId: 'A002', order: 4, action: '确认现场情况并记录', operator: '李四', time: now.subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: true },
  { id: 'S005', alarmId: 'A001', order: 1, action: '接收报警信号', operator: '李四', time: now.subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: true },
  { id: 'S006', alarmId: 'A001', order: 2, action: '核实报警位置', operator: '李四', time: now.subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'), completed: false },
];

export const dutyLogs: DutyLog[] = [
  { id: 'DL001', date: now.format('YYYY-MM-DD'), shift: 'morning', onDutyPerson: '张三', events: ['设备巡检完成', '系统测试正常'], signatureOn: '张三' },
  { id: 'DL002', date: now.subtract(1, 'day').format('YYYY-MM-DD'), shift: 'night', onDutyPerson: '王五', offDutyPerson: '张三', handoverTime: now.subtract(1, 'day').hour(8).minute(30).format('YYYY-MM-DD HH:mm:ss'), events: ['夜间巡检2次', '处理误报1起'], signatureOn: '王五', signatureOff: '张三' },
  { id: 'DL003', date: now.subtract(1, 'day').format('YYYY-MM-DD'), shift: 'afternoon', onDutyPerson: '李四', offDutyPerson: '王五', handoverTime: now.subtract(1, 'day').hour(16).minute(0).format('YYYY-MM-DD HH:mm:ss'), events: ['系统维护', '消防联动测试'], signatureOn: '李四', signatureOff: '王五' },
];

export const contacts: Contact[] = [
  { id: 'CT001', name: '张建国', position: '消防主管', department: '安保部', phone: '13800138001', backupPhone: '13900139001', emergency: true, sort: 1 },
  { id: 'CT002', name: '李明华', position: '保安队长', department: '安保部', phone: '13800138002', backupPhone: '13900139002', emergency: true, sort: 2 },
  { id: 'CT003', name: '王志强', position: '工程主管', department: '工程部', phone: '13800138003', emergency: true, sort: 3 },
  { id: 'CT004', name: '赵晓燕', position: '物业经理', department: '物业部', phone: '13800138004', backupPhone: '13900139004', emergency: true, sort: 4 },
  { id: 'CT005', name: '陈伟', position: '弱电工程师', department: '工程部', phone: '13800138005', emergency: false, sort: 5 },
  { id: 'CT006', name: '刘芳', position: '行政主管', department: '行政部', phone: '13800138006', emergency: false, sort: 6 },
  { id: 'CT007', name: '周涛', position: '空调工程师', department: '工程部', phone: '13800138007', emergency: false, sort: 7 },
  { id: 'CT008', name: '孙磊', position: '消防员', department: '安保部', phone: '13800138008', backupPhone: '13900139008', emergency: true, sort: 8 },
];

const generateDailyReports = (): DailyReport[] => {
  const reports: DailyReport[] = [];
  for (let i = 0; i < 30; i++) {
    const date = now.subtract(i, 'day').format('YYYY-MM-DD');
    reports.push({
      date,
      totalAlarms: Math.floor(Math.random() * 10) + 2,
      realAlarms: Math.floor(Math.random() * 3),
      falseAlarms: Math.floor(Math.random() * 8) + 1,
      avgResponseTime: Math.floor(Math.random() * 60) + 30,
      deviceFaults: Math.floor(Math.random() * 5),
      completedTasks: Math.floor(Math.random() * 20) + 10,
      pendingTasks: Math.floor(Math.random() * 5),
      operator: ['张三', '李四', '王五'][i % 3],
    });
  }
  return reports;
};

export const dailyReports = generateDailyReports();

export const drillRecords: DrillRecord[] = [
  { id: 'DR001', name: '2026年上半年消防演练', date: now.subtract(15, 'day').format('YYYY-MM-DD'), duration: 90, participants: ['张三', '李四', '王五', '安保队全体'], videoUrl: '', description: '模拟高层火灾应急疏散演练', result: 'good' },
  { id: 'DR002', name: '消防水泵联动测试', date: now.subtract(45, 'day').format('YYYY-MM-DD'), duration: 60, participants: ['工程部', '安保部'], description: '消防水泵自动启动测试', result: 'excellent' },
  { id: 'DR003', name: '应急照明演练', date: now.subtract(75, 'day').format('YYYY-MM-DD'), duration: 30, participants: ['全体值班人员'], description: '断电情况下应急照明切换测试', result: 'excellent' },
];

export const pendingTasks: PendingTask[] = [
  { id: 'T001', title: '处理3层烟雾报警', description: '需要前往现场核实3层东侧走廊烟雾报警情况', priority: 'high', deadline: now.add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), alarmId: 'A001', completed: false, createTime: now.subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  { id: 'T002', title: '处理B1层温度报警', description: '配电室温度异常，需工程人员检查', priority: 'high', deadline: now.add(25, 'minute').format('YYYY-MM-DD HH:mm:ss'), alarmId: 'A003', completed: false, createTime: now.subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  { id: 'T003', title: '填写A002处置记录', description: '补充完善2层手动报警的处置记录', priority: 'medium', deadline: now.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), alarmId: 'A002', completed: false, createTime: now.subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  { id: 'T004', title: '设备月度巡检', description: '本月设备巡检计划，需检查所有探测器和防火门', priority: 'medium', deadline: now.add(3, 'day').format('YYYY-MM-DD HH:mm:ss'), completed: false, createTime: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 'T005', title: '整理上周值班记录', description: '归档上周所有值班日志和处置单', priority: 'low', deadline: now.add(5, 'day').format('YYYY-MM-DD HH:mm:ss'), completed: false, createTime: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') },
];
