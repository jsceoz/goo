'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Card,
  Tabs,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  brand: string | null;
  specification: string | null;
  imageUrl: string | null;
}

interface Item {
  id: string;
  quantity: number;
  unit: string;
  expirationDate: string | null;
  note: string | null;
  product: Product;
  cabinet: {
    id: string;
    name: string;
    room: {
      id: string;
      name: string;
    };
  };
  brick: {
    id: string;
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  cabinets: {
    id: string;
    name: string;
  }[];
}

interface Brick {
  id: string;
  name: string;
  code: string;
  fullPath: string;
  hierarchy: {
    segment: {
      id: string;
      code: string;
      name: string;
    };
    family: {
      id: string;
      code: string;
      name: string;
    };
    class: {
      id: string;
      code: string;
      name: string;
    };
    brick: {
      id: string;
      code: string;
      name: string;
    };
  };
}

interface CategoryNode {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId?: string;
  children: { [key: string]: CategoryNode };
}

interface CategoryTree {
  [key: string]: CategoryNode;
}

export default function ItemManagePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>();
  const [selectedCabinet, setSelectedCabinet] = useState<string>();
  const [form] = Form.useForm();
  const [categoryTree, setCategoryTree] = useState<CategoryTree>({});
  const [selectedCategories, setSelectedCategories] = useState<{
    segment?: string;
    family?: string;
    class?: string;
    brick?: string;
  }>({});

  // 加载物品列表
  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      message.error('加载物品列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载房间和柜子列表
  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      message.error('加载房间列表失败');
      console.error(error);
    }
  };

  // 加载分类列表
  const loadBricks = async () => {
    try {
      const response = await fetch('/api/bricks');
      if (!response.ok) throw new Error('Failed to fetch bricks');
      const data = await response.json();
      setBricks(data.items);
      setCategoryTree(data.tree);
    } catch (error) {
      message.error('加载分类列表失败');
      console.error(error);
    }
  };

  useEffect(() => {
    loadItems();
    loadRooms();
    loadBricks();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: ['product', 'name'],
      key: 'name',
      sorter: (a: Item, b: Item) => a.product.name.localeCompare(b.product.name),
    },
    {
      title: '条码',
      dataIndex: ['product', 'barcode'],
      key: 'barcode',
    },
    {
      title: '品牌',
      dataIndex: ['product', 'brand'],
      key: 'brand',
    },
    {
      title: '规格',
      dataIndex: ['product', 'specification'],
      key: 'specification',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: Item, b: Item) => a.quantity - b.quantity,
      render: (quantity: number, record: Item) => `${quantity} ${record.unit}`,
    },
    {
      title: '存放位置',
      key: 'location',
      render: (record: Item) => `${record.cabinet.room.name} - ${record.cabinet.name}`,
    },
    {
      title: '分类',
      dataIndex: ['brick', 'name'],
      key: 'category',
    },
    {
      title: '过期时间',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
      sorter: (a: Item, b: Item) => {
        if (!a.expirationDate) return -1;
        if (!b.expirationDate) return 1;
        return dayjs(a.expirationDate).unix() - dayjs(b.expirationDate).unix();
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Item) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个物品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理编辑
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setSelectedRoomId(item.cabinet.room.id);
    form.setFieldsValue({
      ...item,
      roomId: item.cabinet.room.id,
      cabinetId: item.cabinet.id,
      brickId: item.brick.id,
      expirationDate: item.expirationDate ? dayjs(item.expirationDate) : null,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');
      message.success('删除成功');
      loadItems();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        expirationDate: values.expirationDate?.format('YYYY-MM-DD'),
      };

      const response = await fetch(
        editingItem ? `/api/items/${editingItem.id}` : '/api/items',
        {
          method: editingItem ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error('Failed to save item');

      message.success(editingItem ? '更新成功' : '创建成功');
      setModalVisible(false);
      form.resetFields();
      setEditingItem(null);
      loadItems();
    } catch (error) {
      message.error(editingItem ? '更新失败' : '创建失败');
      console.error(error);
    }
  };

  // 处理分类选择
  const handleCategoryChange = (level: string, value: string | undefined) => {
    setSelectedCategories(prev => {
      const newCategories = { ...prev };
      
      // 清除当前级别及其后续级别的选择
      switch (level) {
        case 'segment':
          newCategories.segment = value;
          newCategories.family = undefined;
          newCategories.class = undefined;
          newCategories.brick = undefined;
          break;
        case 'family':
          newCategories.family = value;
          newCategories.class = undefined;
          newCategories.brick = undefined;
          break;
        case 'class':
          newCategories.class = value;
          newCategories.brick = undefined;
          break;
        case 'brick':
          newCategories.brick = value;
          break;
      }
      
      return newCategories;
    });
  };

  // 重置所有筛选条件
  const handleReset = () => {
    setSearchText('');
    setSelectedRoom(undefined);
    setSelectedCabinet(undefined);
    setSelectedCategories({});
  };

  // 处理房间选择变化
  const handleRoomChange = (value: string | undefined) => {
    setSelectedRoom(value);
    setSelectedCabinet(undefined); // 清除已选择的储物柜
  };

  // 获取当前选中房间的储物柜列表
  const getCurrentRoomCabinets = () => {
    if (!selectedRoom) return [];
    const room = rooms.find(r => r.id === selectedRoom);
    return room?.cabinets || [];
  };

  // 获取符合当前分类选择的物品
  const getFilteredItems = () => {
    return items.filter(item => {
      // 按名称搜索
      if (searchText && !item.product.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // 按房间筛选
      if (selectedRoom && item.cabinet.room.id !== selectedRoom) {
        return false;
      }

      // 按储物柜筛选
      if (selectedCabinet && item.cabinet.id !== selectedCabinet) {
        return false;
      }

      // 按分类筛选
      const brick = bricks.find(b => b.id === item.brick.id);
      if (!brick) return false;

      const { segment, family, class: cls } = selectedCategories;
      
      if (segment && brick.hierarchy.segment.id !== segment) return false;
      if (family && brick.hierarchy.family.id !== family) return false;
      if (cls && brick.hierarchy.class.id !== cls) return false;
      
      return true;
    });
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space>
              <Input
                placeholder="搜索商品名称"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder="选择房间"
                style={{ width: 150 }}
                allowClear
                value={selectedRoom}
                onChange={handleRoomChange}
              >
                {rooms.map(room => (
                  <Select.Option key={room.id} value={room.id}>
                    {room.name}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="选择储物柜"
                style={{ width: 150 }}
                allowClear
                disabled={!selectedRoom}
                value={selectedCabinet}
                onChange={setSelectedCabinet}
              >
                {getCurrentRoomCabinets().map(cabinet => (
                  <Select.Option key={cabinet.id} value={cabinet.id}>
                    {cabinet.name}
                  </Select.Option>
                ))}
              </Select>
              <Button onClick={handleReset}>重置</Button>
            </Space>
            
            <Space>
              {/* 段选择 */}
              <Select
                placeholder="选择段"
                style={{ width: 200 }}
                allowClear
                value={selectedCategories.segment}
                onChange={(value) => handleCategoryChange('segment', value)}
              >
                {Object.values(categoryTree).map(segment => (
                  <Select.Option key={segment.id} value={segment.id}>
                    {segment.name}
                  </Select.Option>
                ))}
              </Select>

              {/* 族选择 */}
              <Select
                placeholder="选择族"
                style={{ width: 200 }}
                allowClear
                disabled={!selectedCategories.segment}
                value={selectedCategories.family}
                onChange={(value) => handleCategoryChange('family', value)}
              >
                {selectedCategories.segment &&
                  Object.values(categoryTree[selectedCategories.segment].children).map(family => (
                    <Select.Option key={family.id} value={family.id}>
                      {family.name}
                    </Select.Option>
                  ))}
              </Select>

              {/* 类选择 */}
              <Select
                placeholder="选择类"
                style={{ width: 200 }}
                allowClear
                disabled={!selectedCategories.family}
                value={selectedCategories.class}
                onChange={(value) => handleCategoryChange('class', value)}
              >
                {selectedCategories.segment && selectedCategories.family &&
                  Object.values(categoryTree[selectedCategories.segment]
                    .children[selectedCategories.family].children).map(cls => (
                      <Select.Option key={cls.id} value={cls.id}>
                        {cls.name}
                      </Select.Option>
                    ))}
              </Select>
            </Space>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            新增物品
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredItems()}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />

        <Modal
          title={editingItem ? '编辑物品' : '新增物品'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingItem(null);
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="barcode"
              label="条码"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="brand"
              label="品牌"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="specification"
              label="规格"
            >
              <Input />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="unit"
                label="单位"
                rules={[{ required: true, message: '请选择单位' }]}
              >
                <Select>
                  <Select.Option value="个">个</Select.Option>
                  <Select.Option value="包">包</Select.Option>
                  <Select.Option value="瓶">瓶</Select.Option>
                  <Select.Option value="盒">盒</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="roomId"
                label="房间"
                rules={[{ required: true, message: '请选择房间' }]}
              >
                <Select
                  onChange={(value) => setSelectedRoomId(value)}
                >
                  {rooms.map(room => (
                    <Select.Option key={room.id} value={room.id}>
                      {room.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="cabinetId"
                label="储物柜"
                rules={[{ required: true, message: '请选择储物柜' }]}
              >
                <Select>
                  {rooms
                    .find(room => room.id === selectedRoomId)
                    ?.cabinets.map(cabinet => (
                      <Select.Option key={cabinet.id} value={cabinet.id}>
                        {cabinet.name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="brickId"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.label ? option.label.toString().toLowerCase().includes(input.toLowerCase()) : false
                }
              >
                {bricks.map(brick => (
                  <Select.Option key={brick.id} value={brick.id} label={brick.fullPath}>
                    {brick.fullPath}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="expirationDate"
              label="过期时间"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="note"
              label="备注"
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingItem(null);
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
} 