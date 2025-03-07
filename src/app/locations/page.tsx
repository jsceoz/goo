'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Form,
  Input,
  Card,
  Space,
  List,
  DotLoading,
  ErrorBlock
} from 'antd-mobile';
import { 
  AddOutline, 
  EditSOutline, 
  DeleteOutline,
  CloseOutline,
  CheckOutline
} from 'antd-mobile-icons';

interface Room {
  id: string;
  name: string;
  cabinets: Cabinet[];
}

interface Cabinet {
  id: string;
  name: string;
  roomId: string;
}

interface FormValues {
  name: string;
}

export default function LocationsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingRoom, setAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [addingCabinetToRoomId, setAddingCabinetToRoomId] = useState<string | null>(null);
  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // 加载房间和柜子数据
  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error('加载失败');
      }
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // 添加房间
  const handleAddRoom = async (values: FormValues) => {
    try {
      setError(null);
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('创建失败');
      }

      await loadRooms();
      setAddingRoom(false);
      form.resetFields();
    } catch (error) {
      setError('创建失败');
    }
  };

  // 编辑房间
  const handleEditRoom = async (values: FormValues, roomId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      await loadRooms();
      setEditingRoomId(null);
      form.resetFields();
    } catch (error) {
      setError('更新失败');
    }
  };

  // 删除房间
  const handleDeleteRoom = async (roomId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      await loadRooms();
    } catch (error) {
      setError('删除失败');
    }
  };

  // 添加柜子
  const handleAddCabinet = async (values: FormValues, roomId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/cabinets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          roomId,
        }),
      });

      if (!response.ok) {
        throw new Error('创建失败');
      }

      await loadRooms();
      setAddingCabinetToRoomId(null);
      form.resetFields();
    } catch (error) {
      setError('创建失败');
    }
  };

  // 编辑柜子
  const handleEditCabinet = async (values: FormValues, cabinetId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/cabinets/${cabinetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      await loadRooms();
      setEditingCabinetId(null);
      form.resetFields();
    } catch (error) {
      setError('更新失败');
    }
  };

  // 删除柜子
  const handleDeleteCabinet = async (cabinetId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/cabinets/${cabinetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      await loadRooms();
    } catch (error) {
      setError('删除失败');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">存储位置管理</h1>
        <Button 
          color='primary'
          onClick={() => setAddingRoom(true)}
        >
          <div className="flex items-center">
            <AddOutline className="mr-1" /> 添加房间
          </div>
        </Button>
      </div>

      {error && (
        <ErrorBlock status='default' title={error} />
      )}

      {addingRoom && (
        <Card className="mb-4">
          <Form
            form={form}
            layout='horizontal'
            onFinish={handleAddRoom}
            footer={
              <Space>
                <Button
                  color='default'
                  onClick={() => {
                    setAddingRoom(false);
                    form.resetFields();
                  }}
                >
                  <div className="flex items-center">
                    <CloseOutline className="mr-1" /> 取消
                  </div>
                </Button>
                <Button color='primary' type='submit'>
                  <div className="flex items-center">
                    <CheckOutline className="mr-1" /> 确定
                  </div>
                </Button>
              </Space>
            }
          >
            <Form.Item
              name='name'
              label='房间名称'
              rules={[{ required: true, message: '请输入房间名称' }]}
            >
              <Input placeholder='请输入房间名称' />
            </Form.Item>
          </Form>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-4">
          <DotLoading color='primary' />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-4 text-gray-500">暂无数据</div>
      ) : (
        <Space direction='vertical' block>
          {rooms.map(room => (
            <Card key={room.id}>
              <div className="flex justify-between items-center mb-4">
                {editingRoomId === room.id ? (
                  <Form
                    form={form}
                    layout='horizontal'
                    initialValues={room}
                    onFinish={(values) => handleEditRoom(values, room.id)}
                    className="flex-1 mr-4"
                  >
                    <div className="flex items-center">
                      <Form.Item
                        name='name'
                        rules={[{ required: true, message: '请输入房间名称' }]}
                        className="flex-1 mb-0"
                      >
                        <Input placeholder='请输入房间名称' />
                      </Form.Item>
                      <Space className="ml-2">
                        <Button
                          color='default'
                          onClick={() => {
                            setEditingRoomId(null);
                            form.resetFields();
                          }}
                        >
                          <CloseOutline />
                        </Button>
                        <Button color='primary' type='submit'>
                          <CheckOutline />
                        </Button>
                      </Space>
                    </div>
                  </Form>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold">{room.name}</h2>
                    <Space>
                      <Button
                        color='primary'
                        fill='outline'
                        onClick={() => setAddingCabinetToRoomId(room.id)}
                      >
                        <div className="flex items-center">
                          <AddOutline className="mr-1" /> 添加位置
                        </div>
                      </Button>
                      <Button
                        color='primary'
                        fill='outline'
                        onClick={() => {
                          setEditingRoomId(room.id);
                          form.setFieldsValue(room);
                        }}
                      >
                        <div className="flex items-center">
                          <EditSOutline className="mr-1" /> 编辑
                        </div>
                      </Button>
                      <Button
                        color='danger'
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <div className="flex items-center">
                          <DeleteOutline className="mr-1" /> 删除
                        </div>
                      </Button>
                    </Space>
                  </>
                )}
              </div>

              {addingCabinetToRoomId === room.id && (
                <div className="mb-4">
                  <Form
                    form={form}
                    layout='horizontal'
                    onFinish={(values) => handleAddCabinet(values, room.id)}
                    footer={
                      <Space>
                        <Button
                          color='default'
                          onClick={() => {
                            setAddingCabinetToRoomId(null);
                            form.resetFields();
                          }}
                        >
                          <div className="flex items-center">
                            <CloseOutline className="mr-1" /> 取消
                          </div>
                        </Button>
                        <Button color='primary' type='submit'>
                          <div className="flex items-center">
                            <CheckOutline className="mr-1" /> 确定
                          </div>
                        </Button>
                      </Space>
                    }
                  >
                    <Form.Item
                      name='name'
                      label='位置名称'
                      rules={[{ required: true, message: '请输入位置名称' }]}
                    >
                      <Input placeholder='请输入位置名称' />
                    </Form.Item>
                  </Form>
                </div>
              )}
              
              <List>
                {room.cabinets.map(cabinet => (
                  <List.Item
                    key={cabinet.id}
                    extra={
                      <Space>
                        <Button
                          color='primary'
                          fill='outline'
                          size='small'
                          onClick={() => {
                            setEditingCabinetId(cabinet.id);
                            form.setFieldsValue(cabinet);
                          }}
                        >
                          <div className="flex items-center">
                            <EditSOutline className="mr-1" /> 编辑
                          </div>
                        </Button>
                        <Button
                          color='danger'
                          size='small'
                          onClick={() => handleDeleteCabinet(cabinet.id)}
                        >
                          <div className="flex items-center">
                            <DeleteOutline className="mr-1" /> 删除
                          </div>
                        </Button>
                      </Space>
                    }
                  >
                    {editingCabinetId === cabinet.id ? (
                      <Form
                        form={form}
                        layout='horizontal'
                        initialValues={cabinet}
                        onFinish={(values) => handleEditCabinet(values, cabinet.id)}
                      >
                        <div className="flex items-center">
                          <Form.Item
                            name='name'
                            rules={[{ required: true, message: '请输入位置名称' }]}
                            className="flex-1 mb-0"
                          >
                            <Input placeholder='请输入位置名称' />
                          </Form.Item>
                          <Space className="ml-2">
                            <Button
                              color='default'
                              onClick={() => {
                                setEditingCabinetId(null);
                                form.resetFields();
                              }}
                            >
                              <CloseOutline />
                            </Button>
                            <Button color='primary' type='submit'>
                              <CheckOutline />
                            </Button>
                          </Space>
                        </div>
                      </Form>
                    ) : (
                      cabinet.name
                    )}
                  </List.Item>
                ))}
              </List>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
} 