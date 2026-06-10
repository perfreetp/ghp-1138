export type AlarmStatus = 'pending' | 'confirmed' | 'false_alarm' | 'handled';
export type AlarmLevel = 'general' | 'important' | 'urgent';
export type DeviceStatus = 'normal' | 'warning' | 'fault' | 'offline';
export type DeviceType = 'detector' | 'fire_door' | 'smoke_exhaust' | 'sprinkler' | 'fire_hose';
export type DoorStatus = 'open' | 'closed' | 'fault';
export type ExhaustStatus = 'running' | 'stopped' | 'fault';

export interface Alarm {
  id: string;
  deviceId: string;
  deviceName: string;
  location: string;
  floor: number;
  type: string;
  level: AlarmLevel;
  status: AlarmStatus;
  alarmTime: string;
  confirmTime?: string;
  handleTime?: string;
  description: string;
  operator?: string;
  remark?: string;
  cameraIds: string[];
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  floor: number;
  location: string;
  status: DeviceStatus;
  position: { x: number; y: number };
  lastCheckTime: string;
  description: string;
}

export interface FireDoor extends Device {
  type: 'fire_door';
  doorStatus: DoorStatus;
  doorName: string;
}

export interface SmokeExhaust extends Device {
  type: 'smoke_exhaust';
  exhaustStatus: ExhaustStatus;
  fanSpeed: number;
}

export interface Detector extends Device {
  type: 'detector';
  detectorType: 'smoke' | 'heat' | 'manual';
  smokeValue?: number;
  temperature?: number;
}

export interface Camera {
  id: string;
  name: string;
  floor: number;
  location: string;
  position: { x: number; y: number };
  status: 'online' | 'offline';
  streamUrl: string;
  associatedAlarms: string[];
}

export interface PhoneRecord {
  id: string;
  alarmId?: string;
  time: string;
  caller: string;
  receiver: string;
  phone: string;
  content: string;
  duration: number;
}

export interface DisposalStep {
  id: string;
  alarmId: string;
  order: number;
  action: string;
  operator: string;
  time: string;
  completed: boolean;
  remark?: string;
}

export interface DutyLog {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  onDutyPerson: string;
  offDutyPerson?: string;
  handoverTime?: string;
  signatureOn?: string;
  signatureOff?: string;
  events: string[];
  remarks?: string;
}

export interface Contact {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  backupPhone?: string;
  email?: string;
  emergency: boolean;
  sort: number;
}

export interface DailyReport {
  date: string;
  totalAlarms: number;
  realAlarms: number;
  falseAlarms: number;
  avgResponseTime: number;
  deviceFaults: number;
  completedTasks: number;
  pendingTasks: number;
  operator: string;
}

export interface DrillRecord {
  id: string;
  name: string;
  date: string;
  duration: number;
  participants: string[];
  videoUrl?: string;
  description: string;
  result: 'excellent' | 'good' | 'pass' | 'fail';
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  alarmId?: string;
  completed: boolean;
  createTime: string;
}

export interface Floor {
  id: number;
  name: string;
  area: number;
  height: number;
  hasBasement: boolean;
}
