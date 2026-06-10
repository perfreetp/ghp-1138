import React, { useState, useEffect } from 'react';
import { Drawer, List, Tag, Button, Space, Badge, Empty, Popover } from 'antd';
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';
import type { PendingTask, AlarmFlowStatus } from '../types';

const PendingTasks: React.FC = () => {
  const { pendingTasks, completePendingTask, setSelectedAlarm, setShowAlarmModal, alarms } = useStore();
  const [open, setOpen] = useState(false);
  const [remindedTasks, setRemindedTasks] = useState<Set<string>>(new Set());

  const incompleteTasks = pendingTasks.filter((t) => !t.completed);

  useEffect(() => {
    const checkReminders = () => {
      incompleteTasks.forEach((task) => {
        const deadline = dayjs(task.deadline);
        const now = dayjs();
        const diffMinutes = deadline.diff(now, 'minute');

        if (diffMinutes <= 30 && diffMinutes > 0 && !remindedTasks.has(task.id) && task.priority === 'high') {
          setRemindedTasks((prev) => new Set([...prev, task.id]));
          if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.showAlert(
              `【紧急提醒】任务"${task.title}"将在${diffMinutes}分钟后到期！`
            );
          }
        }
      });
    };

    const timer = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(timer);
  }, [incompleteTasks, remindedTasks]);

  const priorityColor = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
  };

  const priorityText = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const flowStatusColor: Record<AlarmFlowStatus, string> = {
    pending: 'default',
    confirmed: 'blue',
    notified: 'cyan',
    arrived: 'orange',
    disposed: 'green',
    reviewed: 'teal',
    archived: 'default',
    false_alarm: 'magenta',
  };

  const flowStatusText: Record<AlarmFlowStatus, string> = {
    pending: '待确认',
    confirmed: '已确认',
    notified: '已通知',
    arrived: '已到达',
    disposed: '已处置',
    reviewed: '已复核',
    archived: '已归档',
    false_alarm: '误报',
  };

  const handleViewAlarm = (task: PendingTask) => {
    if (task.alarmId) {
      const alarm = alarms.find((a) => a.id === task.alarmId);
      if (alarm) {
        setSelectedAlarm(alarm);
        setShowAlarmModal(true);
        setOpen(false);
      }
    }
  };

  const renderTaskItem = (task: PendingTask) => {
    const deadline = dayjs(task.deadline);
    const now = dayjs();
    const isOverdue = deadline.isBefore(now);
    const isUrgent = deadline.diff(now, 'minute') <= 30 && !isOverdue;
    const relatedAlarm = task.alarmId ? alarms.find((a) => a.id === task.alarmId) : undefined;

    return (
      <List.Item
        key={task.id}
        actions={[
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => completePendingTask(task.id)}
          >
            完成
          </Button>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              <Badge
                status={isOverdue ? 'error' : isUrgent ? 'warning' : 'processing'}
                text={
                  <span style={{ color: isOverdue ? '#ff4d4f' : isUrgent ? '#faad14' : '#e6f0ff' }}>
                    {task.title}
                  </span>
                }
              />
              <Tag color={priorityColor[task.priority]}>{priorityText[task.priority]}优先级</Tag>
              {task.alarmId && (
                <Button type="link" size="small" onClick={() => handleViewAlarm(task)}>
                  查看报警
                </Button>
              )}
            </Space>
          }
          description={
            <div>
              <div style={{ color: '#91caff', marginBottom: 4 }}>{task.description}</div>
              {relatedAlarm && (
                <div style={{ marginBottom: 8 }}>
                  <Tag color={flowStatusColor[relatedAlarm.flowStatus]}>
                    流转状态: {flowStatusText[relatedAlarm.flowStatus]}
                  </Tag>
                </div>
              )}
              <Space size="middle" style={{ fontSize: 12 }}>
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  截止时间:
                  <span style={{ color: isOverdue ? '#ff4d4f' : isUrgent ? '#faad14' : '#91caff' }}>
                    {' '}
                    {task.deadline}
                  </span>
                  {isOverdue && <Tag color="red" style={{ marginLeft: 8 }}>已逾期</Tag>}
                  {isUrgent && !isOverdue && <Tag color="orange" style={{ marginLeft: 8 }}>即将到期</Tag>}
                </span>
                <span>
                  创建时间: {task.createTime}
                </span>
              </Space>
            </div>
          }
        />
      </List.Item>
    );
  };

  const highPriorityCount = incompleteTasks.filter((t) => t.priority === 'high').length;
  const overdueCount = incompleteTasks.filter((t) => dayjs(t.deadline).isBefore(dayjs())).length;

  const popoverContent = (
    <div style={{ width: 300 }}>
      {incompleteTasks.length === 0 ? (
        <Empty description="暂无待办事项" />
      ) : (
        <div>
          {incompleteTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #1f2f45',
                cursor: 'pointer',
              }}
              onClick={() => setOpen(true)}
            >
              <Space>
                <WarningOutlined style={{ color: task.priority === 'high' ? '#ff4d4f' : '#faad14' }} />
                <span style={{ color: '#e6f0ff', fontSize: 13 }}>{task.title}</span>
              </Space>
              <div style={{ fontSize: 11, color: '#91caff', marginTop: 4 }}>
                截止: {task.deadline}
              </div>
            </div>
          ))}
          {incompleteTasks.length > 5 && (
            <div
              style={{ textAlign: 'center', padding: 8, color: '#1677ff', cursor: 'pointer' }}
              onClick={() => setOpen(true)}
            >
              查看全部 {incompleteTasks.length} 项
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={popoverContent}
        title="待办事项提醒"
        trigger="click"
        placement="bottomRight"
      >
        <Badge count={incompleteTasks.length} offset={[-5, 5]} size="small">
          <Button
            type="primary"
            danger={highPriorityCount > 0}
            icon={<ExclamationCircleOutlined />}
            style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}
          >
            待办
            {overdueCount > 0 && <Tag color="red" style={{ marginLeft: 8 }}>逾期 {overdueCount}</Tag>}
          </Button>
        </Badge>
      </Popover>

      <Drawer
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            待办事项列表
            <Badge count={incompleteTasks.length} style={{ marginLeft: 8 }} />
          </Space>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={500}
      >
        {incompleteTasks.length === 0 ? (
          <Empty description="暂无待办事项" style={{ marginTop: 60 }} />
        ) : (
          <List
            dataSource={incompleteTasks}
            renderItem={renderTaskItem}
            style={{ background: '#0a1628' }}
          />
        )}
      </Drawer>
    </>
  );
};

export default PendingTasks;
