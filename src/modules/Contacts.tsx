import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  message,
  Descriptions,
} from 'antd';
import {
  PhoneOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  StarFilled,
  PhoneFilled,
  MailOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useStore } from '../store/useStore';
import type { Contact } from '../types';

const { Option } = Select;
const { TextArea } = Input;

const Contacts: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterEmergency, setFilterEmergency] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const departments = Array.from(new Set(contacts.map((c) => c.department)));

  const filteredContacts = contacts.filter((c) => {
    const matchDept = filterDept === 'all' || c.department === filterDept;
    const matchEmergency = filterEmergency === 'all' || (filterEmergency === 'yes' ? c.emergency : !c.emergency);
    const matchSearch =
      searchText === '' ||
      c.name.includes(searchText) ||
      c.phone.includes(searchText) ||
      c.position.includes(searchText);
    return matchDept && matchEmergency && matchSearch;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.emergency !== b.emergency) return b.emergency ? 1 : -1;
    return a.sort - b.sort;
  });

  const emergencyContacts = contacts.filter((c) => c.emergency);

  const handleAdd = () => {
    setEditingContact(null);
    form.resetFields();
    form.setFieldsValue({
      emergency: false,
      sort: contacts.length + 1,
    });
    setShowModal(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    form.setFieldsValue(contact);
    setShowModal(true);
  };

  const handleView = (contact: Contact) => {
    setViewingContact(contact);
    setShowDetail(true);
  };

  const handleDelete = (id: string) => {
    deleteContact(id);
    message.success('删除成功');
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingContact) {
        updateContact(editingContact.id, values);
        message.success('更新成功');
      } else {
        addContact(values);
        message.success('添加成功');
      }
      setShowModal(false);
    });
  };

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 60,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Contact) => (
        <Space>
          {record.emergency && <StarFilled style={{ color: '#faad14' }} />}
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '职务',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <Space>
          <PhoneFilled style={{ color: '#52c41a' }} />
          <a href={`tel:${text}`}>{text}</a>
        </Space>
      ),
    },
    {
      title: '备用电话',
      dataIndex: 'backupPhone',
      key: 'backupPhone',
      render: (text?: string) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text?: string) =>
        text ? (
          <Space>
            <MailOutlined />
            <a href={`mailto:${text}`}>{text}</a>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '紧急联络',
      dataIndex: 'emergency',
      key: 'emergency',
      render: (emergency: boolean) =>
        emergency ? (
          <Tag color="red">
            <ExclamationCircleOutlined /> 是
          </Tag>
        ) : (
          <Tag color="default">否</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: Contact) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此联系人？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1677ff' }}>{contacts.length}</div>
            <div className="stat-label">联系人数</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{emergencyContacts.length}</div>
            <div className="stat-label">紧急联络人</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#722ed1' }}>{departments.length}</div>
            <div className="stat-label">部门数量</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#fa8c16' }}>{filteredContacts.length}</div>
            <div className="stat-label">筛选结果</div>
          </div>
        </Col>
      </Row>

      {emergencyContacts.length > 0 && (
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#ff4d4f' }} />
              紧急联络人
            </Space>
          }
          style={{ borderColor: '#ff4d4f', borderWidth: 1 }}
        >
          <Row gutter={[16, 16]}>
            {emergencyContacts.slice(0, 4).map((contact) => (
              <Col xs={24} sm={12} md={6} key={contact.id}>
                <Card
                  size="small"
                  style={{ background: 'rgba(255, 77, 79, 0.05)', borderColor: '#ff4d4f' }}
                  actions={[
                    <Button type="link" size="small" icon={<PhoneOutlined />} href={`tel:${contact.phone}`}>
                      拨打
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: '#ff4d4f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 20,
                        }}
                      >
                        {contact.name.charAt(0)}
                      </div>
                    }
                    title={
                      <Space>
                        {contact.name}
                        <StarFilled style={{ color: '#faad14' }} />
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2} style={{ width: '100%', marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#91caff' }}>{contact.position}</div>
                        <div style={{ fontSize: 12, color: '#52c41a' }}>{contact.phone}</div>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        title={
          <Space>
            <TeamOutlined />
            联络清单
          </Space>
        }
        extra={
          <Space wrap>
            <Input.Search
              placeholder="搜索姓名/电话/职务"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={filterDept}
              onChange={setFilterDept}
              style={{ width: 120 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">全部部门</Option>
              {departments.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
            <Select
              value={filterEmergency}
              onChange={setFilterEmergency}
              style={{ width: 120 }}
              prefix={<StarOutlined />}
            >
              <Option value="all">全部</Option>
              <Option value="yes">仅紧急</Option>
              <Option value="no">非紧急</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加联系人
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={sortedContacts}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingContact ? <EditOutlined /> : <PlusOutlined />}
            {editingContact ? '编辑联系人' : '添加联系人'}
          </Space>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职务"
                rules={[{ required: true, message: '请输入职务' }]}
              >
                <Input placeholder="请输入职务" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: '请输入部门' }]}
              >
                <Input placeholder="请输入部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort"
                label="排序"
                rules={[{ required: true, message: '请输入排序号' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="backupPhone" label="备用电话">
                <Input placeholder="请输入备用电话" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="emergency"
                label="紧急联络人"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Select>
                  <Option value={false}>否</Option>
                  <Option value={true}>是</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <UserOutlined />
            联系人详情
          </Space>
        }
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        footer={
          <Space>
            <Button onClick={() => setShowDetail(false)}>关闭</Button>
            {viewingContact && (
              <>
                <Button type="primary" icon={<PhoneOutlined />} href={`tel:${viewingContact.phone}`}>
                  拨打电话
                </Button>
                <Button icon={<EditOutlined />} onClick={() => {
                  setShowDetail(false);
                  handleEdit(viewingContact);
                }}>
                  编辑
                </Button>
              </>
            )}
          </Space>
        }
        width={600}
      >
        {viewingContact && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="姓名">
              <Space>
                {viewingContact.name}
                {viewingContact.emergency && <StarFilled style={{ color: '#faad14' }} />}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="职务">{viewingContact.position}</Descriptions.Item>
            <Descriptions.Item label="部门">
              <Tag color="blue">{viewingContact.department}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              <a href={`tel:${viewingContact.phone}`}>{viewingContact.phone}</a>
            </Descriptions.Item>
            <Descriptions.Item label="备用电话">
              {viewingContact.backupPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {viewingContact.email ? <a href={`mailto:${viewingContact.email}`}>{viewingContact.email}</a> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="紧急联络人">
              {viewingContact.emergency ? (
                <Tag color="red">
                  <ExclamationCircleOutlined /> 是
                </Tag>
              ) : (
                <Tag color="default">否</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="排序">{viewingContact.sort}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
};

export default Contacts;
