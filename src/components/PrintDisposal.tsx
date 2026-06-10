import React, { useState, useRef } from 'react';
import { Modal, Select, Button, Form, Space, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { Alarm } from '../types';

interface PrintDisposalProps {
  open: boolean;
  onClose: () => void;
}

const PrintDisposal: React.FC<PrintDisposalProps> = ({ open, onClose }) => {
  const { alarms, getDisposalStepsByAlarm, phoneRecords } = useStore();
  const [selectedAlarmId, setSelectedAlarmId] = useState<string>();
  const printRef = useRef<HTMLDivElement>(null);

  const handledAlarms = alarms.filter((a) => a.status === 'handled' || a.status === 'false_alarm' || a.status === 'confirmed');

  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId);
  const disposalSteps = selectedAlarm ? getDisposalStepsByAlarm(selectedAlarm.id) : [];
  const relatedPhoneRecords = selectedAlarm ? phoneRecords.filter((p) => p.alarmId === selectedAlarm.id) : [];

  const handlePrint = async () => {
    if (!selectedAlarm) {
      message.warning('请选择要打印的报警记录');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const result = await (window as any).electronAPI.printDisposal();
      if (result.success) {
        message.success('打印成功');
        onClose();
      } else {
        message.error('打印失败: ' + result.errorType);
      }
    } else {
      window.print();
      message.success('已发送打印指令');
      onClose();
    }
  };

  const statusText: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    false_alarm: '误报',
    handled: '已处理',
  };

  const levelText: Record<string, string> = {
    general: '一般',
    important: '重要',
    urgent: '紧急',
  };

  return (
    <Modal
      title={
        <Space>
          <PrinterOutlined />
          打印处置单
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" style={{ marginBottom: 16 }}>
        <Form.Item label="选择报警记录" required>
          <Select
            placeholder="请选择要打印的报警记录"
            value={selectedAlarmId}
            onChange={setSelectedAlarmId}
            options={handledAlarms.map((a) => ({
              label: `${a.id} - ${a.type} - ${a.location}`,
              value: a.id,
            }))}
          />
        </Form.Item>
      </Form>

      {selectedAlarm && (
        <div ref={printRef} className="print-content">
          <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 8 }}>消防报警处置单</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>编号: {selectedAlarm.id}</p>

          <table>
            <tbody>
              <tr>
                <th style={{ width: 120 }}>报警类型</th>
                <td>{selectedAlarm.type}</td>
                <th style={{ width: 120 }}>报警级别</th>
                <td>{levelText[selectedAlarm.level]}</td>
              </tr>
              <tr>
                <th>报警位置</th>
                <td colSpan={3}>{selectedAlarm.location}</td>
              </tr>
              <tr>
                <th>设备名称</th>
                <td>{selectedAlarm.deviceName}</td>
                <th>设备编号</th>
                <td>{selectedAlarm.deviceId}</td>
              </tr>
              <tr>
                <th>报警时间</th>
                <td>{selectedAlarm.alarmTime}</td>
                <th>当前状态</th>
                <td>{statusText[selectedAlarm.status]}</td>
              </tr>
              <tr>
                <th>确认时间</th>
                <td>{selectedAlarm.confirmTime || '-'}</td>
                <th>处理时间</th>
                <td>{selectedAlarm.handleTime || '-'}</td>
              </tr>
              <tr>
                <th>报警描述</th>
                <td colSpan={3}>{selectedAlarm.description}</td>
              </tr>
              <tr>
                <th>操作人员</th>
                <td>{selectedAlarm.operator || '-'}</td>
                <th>备注</th>
                <td>{selectedAlarm.remark || '-'}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>处置步骤</h3>
          {disposalSteps.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>序号</th>
                  <th>处置动作</th>
                  <th style={{ width: 100 }}>操作人</th>
                  <th style={{ width: 160 }}>时间</th>
                  <th style={{ width: 80 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {disposalSteps.map((step) => (
                  <tr key={step.id}>
                    <td>{step.order}</td>
                    <td>{step.action}</td>
                    <td>{step.operator}</td>
                    <td>{step.time}</td>
                    <td>{step.completed ? '已完成' : '进行中'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>暂无处置步骤记录</p>
          )}

          {relatedPhoneRecords.length > 0 && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 12 }}>通话记录</h3>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>时间</th>
                    <th style={{ width: 100 }}>主叫</th>
                    <th style={{ width: 100 }}>被叫</th>
                    <th style={{ width: 120 }}>电话</th>
                    <th>内容</th>
                    <th style={{ width: 80 }}>时长</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedPhoneRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.time}</td>
                      <td>{record.caller}</td>
                      <td>{record.receiver}</td>
                      <td>{record.phone}</td>
                      <td>{record.content}</td>
                      <td>{record.duration}秒</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p>值班人员签字: _________________</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>日期: ____________</p>
            </div>
            <div>
              <p>接班人员签字: _________________</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>日期: ____________</p>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#999' }}>
            本处置单由系统自动生成，一式两份，分别由值班人员和档案室留存
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PrintDisposal;
