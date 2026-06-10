import React, { useState, useRef, useEffect } from 'react';
import { Modal, List, Button, Space, Tag, Progress, Card, Descriptions, Empty, Timeline } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { DrillRecord, DrillEvent } from '../types';

interface DrillPlayerProps {
  open: boolean;
  onClose: () => void;
}

const DrillPlayer: React.FC<DrillPlayerProps> = ({ open, onClose }) => {
  const { drillRecords } = useStore();
  const [selectedDrill, setSelectedDrill] = useState<DrillRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedDrill) return;
    const currentTime = (progress / 100) * selectedDrill.duration;
    const events = selectedDrill.events || [];
    
    let newCurrentIndex = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i].timeOffset <= currentTime) {
        newCurrentIndex = i;
      } else {
        break;
      }
    }
    setCurrentEventIndex(newCurrentIndex);
  }, [progress, selectedDrill]);

  const resultColor = {
    excellent: 'green',
    good: 'blue',
    pass: 'orange',
    fail: 'red',
  };

  const resultText = {
    excellent: '优秀',
    good: '良好',
    pass: '合格',
    fail: '不合格',
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInterval = (drill: DrillRecord, startProgress: number = 0) => {
    stopInterval();

    let currentProgress = startProgress;
    intervalRef.current = window.setInterval(() => {
      currentProgress += 1;
      if (currentProgress >= 100) {
        currentProgress = 100;
        stopInterval();
        setIsPlaying(false);
        setProgress(100);
      } else {
        setProgress(currentProgress);
      }
    }, (drill.duration * 1000) / 100);
  };

  const handlePlay = (drill: DrillRecord) => {
    setSelectedDrill(drill);
    setIsPlaying(true);
    setProgress(0);
    setCurrentEventIndex(-1);
    startInterval(drill, 0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopInterval();
  };

  const handleResume = () => {
    if (!selectedDrill || progress >= 100) return;
    setIsPlaying(true);
    startInterval(selectedDrill, progress);
  };

  const handleRestart = () => {
    if (!selectedDrill) return;
    setIsPlaying(true);
    setProgress(0);
    setCurrentEventIndex(-1);
    startInterval(selectedDrill, 0);
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    if (!selectedDrill) return '00:00';
    return formatTime((progress / 100) * selectedDrill.duration);
  };

  return (
    <Modal
      title={
        <Space>
          <PlayCircleOutlined />
          演练过程回放
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      {drillRecords.length === 0 ? (
        <Empty description="暂无演练记录" style={{ marginTop: 60 }} />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {selectedDrill ? (
            <Card
              title={
                <Space>
                  <PlayCircleOutlined />
                  {selectedDrill.name}
                  <Tag color={resultColor[selectedDrill.result]}>{resultText[selectedDrill.result]}</Tag>
                </Space>
              }
              extra={
                <Button onClick={() => setSelectedDrill(null)}>返回列表</Button>
              }
            >
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="演练日期">{selectedDrill.date}</Descriptions.Item>
                <Descriptions.Item label="持续时间">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {selectedDrill.duration} 分钟
                </Descriptions.Item>
                <Descriptions.Item label="参与人员" span={2}>
                  <Space wrap>
                    {selectedDrill.participants.map((p, idx) => (
                      <Tag key={idx} icon={<UserOutlined />}>{p}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="演练描述" span={2}>
                  {selectedDrill.description}
                </Descriptions.Item>
              </Descriptions>

              <div className="video-player" style={{ height: 400, marginBottom: 16 }}>
                <div style={{ zIndex: 1, color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>
                    {isPlaying ? <PlayCircleOutlined spin /> : <PauseCircleOutlined />}
                  </div>
                  <div style={{ fontSize: 18 }}>演练视频播放中...</div>
                  <div style={{ fontSize: 14, color: '#91caff', marginTop: 8 }}>
                    {selectedDrill.videoUrl || '暂无视频源，模拟播放'}
                  </div>
                </div>
                <div className="video-info">
                  <div>{selectedDrill.name}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#91caff' }}>
                <span>00:00</span>
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#e6f0ff' }}>{getCurrentTime()} / {selectedDrill ? formatTime(selectedDrill.duration) : '00:00'}</span>
                <span>{selectedDrill ? formatTime(selectedDrill.duration) : '00:00'}</span>
              </div>
              <Progress percent={Math.round(progress)} strokeColor="#1677ff" style={{ marginBottom: 16 }} />

              <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
                {isPlaying ? (
                  <Button type="primary" icon={<PauseCircleOutlined />} onClick={handlePause} size="large">
                    暂停
                  </Button>
                ) : (
                  <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleResume} size="large">
                    {progress > 0 ? '继续' : '播放'}
                  </Button>
                )}
                <Button icon={<ReloadOutlined />} onClick={handleRestart} size="large">
                  重新播放
                </Button>
              </Space>

              {selectedDrill?.events && selectedDrill.events.length > 0 && (
                <Card
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      事件时间轴
                    </Space>
                  }
                  size="small"
                >
                  <Timeline
                    mode="left"
                    items={selectedDrill.events.map((event: DrillEvent, index: number) => ({
                      color: index <= currentEventIndex ? '#52c41a' : '#8c8c8c',
                      dot: index === currentEventIndex && isPlaying ? <PlayCircleOutlined style={{ fontSize: 16, color: '#1677ff' }} /> : undefined,
                      children: (
                        <div style={{ 
                          padding: '8px 12px', 
                          background: index <= currentEventIndex ? 'rgba(82, 196, 26, 0.1)' : 'rgba(28, 47, 69, 0.5)',
                          borderRadius: 4,
                          borderLeft: index === currentEventIndex && isPlaying ? '3px solid #1677ff' : '3px solid transparent',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              {index <= currentEventIndex && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                              <span style={{ 
                                fontWeight: index === currentEventIndex ? 'bold' : 'normal',
                                color: index <= currentEventIndex ? '#e6f0ff' : '#8c8c8c',
                              }}>
                                {event.name}
                              </span>
                              {index === currentEventIndex && isPlaying && (
                                <Tag color="blue" style={{ animation: 'blink 1s infinite' }}>进行中</Tag>
                              )}
                            </Space>
                            <Tag color={index <= currentEventIndex ? 'success' : 'default'}>
                              {formatTime(event.timeOffset)}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#91caff', marginTop: 4 }}>
                            {event.description}
                          </div>
                        </div>
                      ),
                    }))}
                  />
                </Card>
              )}
            </Card>
          ) : (
            <List
              dataSource={drillRecords}
              renderItem={(drill) => (
                <List.Item
                  actions={[
                    <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handlePlay(drill)}>
                      播放
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {drill.name}
                        <Tag color={resultColor[drill.result]}>{resultText[drill.result]}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Space size="middle" style={{ fontSize: 12, color: '#91caff' }}>
                          <span>日期: {drill.date}</span>
                          <span><ClockCircleOutlined /> {drill.duration} 分钟</span>
                          <span>参与: {drill.participants.length} 人</span>
                        </Space>
                        <div style={{ marginTop: 4 }}>{drill.description}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default DrillPlayer;
