import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type {
  Alarm,
  Device,
  Camera,
  PhoneRecord,
  DisposalStep,
  DutyLog,
  Contact,
  DailyReport,
  DrillRecord,
  PendingTask,
  AlarmStatus,
} from '../types';
import {
  initialAlarms,
  devices,
  cameras as initialCameras,
  phoneRecords as initialPhoneRecords,
  disposalSteps as initialDisposalSteps,
  dutyLogs as initialDutyLogs,
  contacts as initialContacts,
  dailyReports as initialDailyReports,
  drillRecords as initialDrillRecords,
  pendingTasks as initialPendingTasks,
} from '../data/mockData';

interface AppState {
  alarms: Alarm[];
  devices: Device[];
  cameras: Camera[];
  phoneRecords: PhoneRecord[];
  disposalSteps: DisposalStep[];
  dutyLogs: DutyLog[];
  contacts: Contact[];
  dailyReports: DailyReport[];
  drillRecords: DrillRecord[];
  pendingTasks: PendingTask[];
  selectedFloor: number;
  currentUser: string;
  showAlarmModal: boolean;
  selectedAlarm: Alarm | null;
  currentModule: string;
  locateAlarm: Alarm | null;

  setSelectedFloor: (floor: number) => void;
  setCurrentModule: (module: string) => void;
  setShowAlarmModal: (show: boolean) => void;
  setSelectedAlarm: (alarm: Alarm | null) => void;
  setLocateAlarm: (alarm: Alarm | null) => void;
  locateAlarmOnFloor: (alarm: Alarm) => void;

  confirmAlarm: (alarmId: string, operator: string, remark?: string) => void;
  markFalseAlarm: (alarmId: string, operator: string, remark?: string) => void;
  handleAlarm: (alarmId: string, operator: string, remark?: string) => void;
  updateAlarmStatus: (alarmId: string, status: AlarmStatus, operator: string, remark?: string) => void;

  addPhoneRecord: (record: Omit<PhoneRecord, 'id'>) => void;
  updatePhoneRecord: (id: string, record: Partial<PhoneRecord>) => void;
  deletePhoneRecord: (id: string) => void;
  addDisposalStep: (step: Omit<DisposalStep, 'id'>) => void;
  updateDisposalStep: (id: string, step: Partial<DisposalStep>) => void;
  deleteDisposalStep: (id: string) => void;
  completeDisposalStep: (stepId: string) => void;

  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  addDutyLog: (log: Omit<DutyLog, 'id'>) => void;
  updateDutyLog: (id: string, log: Partial<DutyLog>) => void;
  deleteDutyLog: (id: string) => void;
  handoverDuty: (logId: string, offDutyPerson: string, signature: string, remarks?: string) => void;

  completePendingTask: (taskId: string) => void;
  addPendingTask: (task: Omit<PendingTask, 'id'>) => void;

  getAlarmsByStatus: (status: AlarmStatus) => Alarm[];
  getAlarmsByFloor: (floor: number) => Alarm[];
  getDevicesByFloor: (floor: number) => Device[];
  getCamerasByFloor: (floor: number) => Camera[];
  getDisposalStepsByAlarm: (alarmId: string) => DisposalStep[];
  getPendingTasksByPriority: (priority: 'high' | 'medium' | 'low') => PendingTask[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      alarms: initialAlarms,
      devices,
      cameras: initialCameras,
      phoneRecords: initialPhoneRecords,
      disposalSteps: initialDisposalSteps,
      dutyLogs: initialDutyLogs,
      contacts: initialContacts,
      dailyReports: initialDailyReports,
      drillRecords: initialDrillRecords,
      pendingTasks: initialPendingTasks,
      selectedFloor: 1,
      currentUser: '张三',
      showAlarmModal: false,
      selectedAlarm: null,
      currentModule: 'alarm',
      locateAlarm: null,

      setSelectedFloor: (floor) => set({ selectedFloor: floor }),
      setCurrentModule: (module) => set({ currentModule: module }),
      setShowAlarmModal: (show) => set({ showAlarmModal: show }),
      setSelectedAlarm: (alarm) => set({ selectedAlarm: alarm }),
      setLocateAlarm: (alarm) => set({ locateAlarm: alarm }),
      locateAlarmOnFloor: (alarm) =>
        set({
          currentModule: 'floor',
          selectedFloor: alarm.floor,
          locateAlarm: alarm,
        }),

      confirmAlarm: (alarmId, operator, remark) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  status: 'confirmed',
                  confirmTime: now,
                  operator,
                  remark: remark || a.remark,
                }
              : a
          ),
          pendingTasks: state.pendingTasks.map((t) =>
            t.alarmId === alarmId
              ? {
                  ...t,
                  title: `[处理中] ${t.title.replace(/^\[处理中\] /, '').replace(/^\[已完成\] /, '')}`,
                  description: `${t.description} (已确认，处置中)`,
                }
              : t
          ),
        }));
      },

      markFalseAlarm: (alarmId, operator, remark) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  status: 'false_alarm',
                  confirmTime: now,
                  handleTime: now,
                  operator,
                  remark: remark || a.remark,
                }
              : a
          ),
          pendingTasks: state.pendingTasks.map((t) =>
            t.alarmId === alarmId
              ? {
                  ...t,
                  completed: true,
                  title: `[已完成] ${t.title.replace(/^\[处理中\] /, '').replace(/^\[已完成\] /, '')}`,
                  description: `${t.description} (误报，已关闭)`,
                }
              : t
          ),
        }));
      },

      handleAlarm: (alarmId, operator, remark) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  status: 'handled',
                  handleTime: now,
                  operator,
                  remark: remark || a.remark,
                }
              : a
          ),
          pendingTasks: state.pendingTasks.map((t) =>
            t.alarmId === alarmId
              ? {
                  ...t,
                  completed: true,
                  title: `[已完成] ${t.title.replace(/^\[处理中\] /, '').replace(/^\[已完成\] /, '')}`,
                  description: `${t.description} (处置完成)`,
                }
              : t
          ),
        }));
      },

      updateAlarmStatus: (alarmId, status, operator, remark) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  status,
                  confirmTime: status !== 'pending' ? now : a.confirmTime,
                  handleTime: status === 'handled' || status === 'false_alarm' ? now : a.handleTime,
                  operator,
                  remark: remark || a.remark,
                }
              : a
          ),
        }));
      },

      addPhoneRecord: (record) => {
        set((state) => ({
          phoneRecords: [
            {
              ...record,
              id: `P${String(state.phoneRecords.length + 1).padStart(3, '0')}`,
            },
            ...state.phoneRecords,
          ],
        }));
      },

      updatePhoneRecord: (id, record) => {
        set((state) => ({
          phoneRecords: state.phoneRecords.map((r) =>
            r.id === id ? { ...r, ...record } : r
          ),
        }));
      },

      deletePhoneRecord: (id) => {
        set((state) => ({
          phoneRecords: state.phoneRecords.filter((r) => r.id !== id),
        }));
      },

      addDisposalStep: (step) => {
        set((state) => ({
          disposalSteps: [
            ...state.disposalSteps,
            {
              ...step,
              id: `S${String(state.disposalSteps.length + 1).padStart(3, '0')}`,
            },
          ],
        }));
      },

      updateDisposalStep: (id, step) => {
        set((state) => ({
          disposalSteps: state.disposalSteps.map((s) =>
            s.id === id ? { ...s, ...step } : s
          ),
        }));
      },

      deleteDisposalStep: (id) => {
        set((state) => ({
          disposalSteps: state.disposalSteps.filter((s) => s.id !== id),
        }));
      },

      completeDisposalStep: (stepId) => {
        set((state) => ({
          disposalSteps: state.disposalSteps.map((s) =>
            s.id === stepId ? { ...s, completed: true, time: dayjs().format('YYYY-MM-DD HH:mm:ss') } : s
          ),
        }));
      },

      addContact: (contact) => {
        set((state) => ({
          contacts: [
            ...state.contacts,
            {
              ...contact,
              id: `CT${String(state.contacts.length + 1).padStart(3, '0')}`,
            },
          ].sort((a, b) => a.sort - b.sort),
        }));
      },

      updateContact: (id, contact) => {
        set((state) => ({
          contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...contact } : c)),
        }));
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        }));
      },

      addDutyLog: (log) => {
        set((state) => ({
          dutyLogs: [
            {
              ...log,
              id: `DL${String(state.dutyLogs.length + 1).padStart(3, '0')}`,
            },
            ...state.dutyLogs,
          ],
        }));
      },

      updateDutyLog: (id, log) => {
        set((state) => ({
          dutyLogs: state.dutyLogs.map((l) =>
            l.id === id ? { ...l, ...log } : l
          ),
        }));
      },

      deleteDutyLog: (id) => {
        set((state) => ({
          dutyLogs: state.dutyLogs.filter((l) => l.id !== id),
        }));
      },

      handoverDuty: (logId, offDutyPerson, signature, remarks) => {
        set((state) => ({
          dutyLogs: state.dutyLogs.map((log) =>
            log.id === logId
              ? {
                  ...log,
                  offDutyPerson,
                  handoverTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                  signatureOff: signature,
                  remarks: remarks || log.remarks,
                }
              : log
          ),
        }));
      },

      completePendingTask: (taskId) => {
        set((state) => ({
          pendingTasks: state.pendingTasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          ),
        }));
      },

      addPendingTask: (task) => {
        set((state) => ({
          pendingTasks: [
            {
              ...task,
              id: `T${String(state.pendingTasks.length + 1).padStart(3, '0')}`,
            },
            ...state.pendingTasks,
          ],
        }));
      },

      getAlarmsByStatus: (status) => get().alarms.filter((a) => a.status === status),
      getAlarmsByFloor: (floor) => get().alarms.filter((a) => a.floor === floor),
      getDevicesByFloor: (floor) => get().devices.filter((d) => d.floor === floor),
      getCamerasByFloor: (floor) => get().cameras.filter((c) => c.floor === floor),
      getDisposalStepsByAlarm: (alarmId) =>
        get()
          .disposalSteps.filter((s) => s.alarmId === alarmId)
          .sort((a, b) => a.order - b.order),
      getPendingTasksByPriority: (priority) =>
        get().pendingTasks.filter((t) => t.priority === priority && !t.completed),
    }),
    {
      name: 'fire-control-station-storage',
      partialize: (state) => ({
        alarms: state.alarms,
        phoneRecords: state.phoneRecords,
        disposalSteps: state.disposalSteps,
        dutyLogs: state.dutyLogs,
        contacts: state.contacts,
        pendingTasks: state.pendingTasks,
        dailyReports: state.dailyReports,
      }),
    }
  )
);
