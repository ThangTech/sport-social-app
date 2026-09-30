import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageState } from "../components/ui";
import { api, formatDate } from "../lib/api";

type SportItem = {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  isActive: boolean;
  postCount: number;
  createdAt: string;
  updatedAt?: string | null;
};

type SportForm = {
  name: string;
  slug: string;
  iconUrl?: string;
};

export function SportsPage() {
  const [form] = Form.useForm<SportForm>();
  const [items, setItems] = useState<SportItem[]>([]);
  const [editing, setEditing] = useState<SportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setItems(await api<SportItem[]>("/admin/sports"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải danh mục.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const cancelEdit = () => {
    setEditing(null);
    form.resetFields();
  };

  const startEdit = (item: SportItem) => {
    setEditing(item);
    form.setFieldsValue({
      name: item.name,
      slug: item.slug,
      iconUrl: item.iconUrl ?? "",
    });
  };

  const submit = async (values: SportForm) => {
    setSaving(true);
    setError("");

    try {
      await api(editing ? `/admin/sports/${editing.id}` : "/admin/sports", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: values.name.trim(),
          slug: values.slug.trim(),
          iconUrl: values.iconUrl?.trim() || null,
          isActive: editing?.isActive ?? true,
        }),
      });
      cancelEdit();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể lưu danh mục.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: SportItem) => {
    setTogglingId(item.id);
    setError("");

    try {
      await api(`/admin/sports/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: item.name,
          slug: item.slug,
          iconUrl: item.iconUrl,
          isActive: !item.isActive,
        }),
      });
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể đổi trạng thái.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const columns: TableProps<SportItem>["columns"] = [
    {
      title: "Môn thể thao",
      key: "sport",
      render: (_, item) => (
        <div>
          <Typography.Text strong>{item.name}</Typography.Text>
          <Typography.Text code className="mt-1 block w-fit text-xs">
            {item.slug}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Bài viết",
      dataIndex: "postCount",
      width: 110,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 150,
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Đang hiện" : "Đã ẩn"}
        </Tag>
      ),
    },
    {
      title: "Cập nhật",
      key: "updatedAt",
      width: 170,
      render: (_, item) => formatDate(item.updatedAt ?? item.createdAt),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, item) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => startEdit(item)}
          >
            Sửa
          </Button>
          <Popconfirm
            title={item.isActive ? "Ẩn thẻ khỏi Mobile?" : "Bật lại thẻ?"}
            description={
              item.isActive
                ? "API công khai sẽ không trả về thẻ này."
                : "Thẻ sẽ xuất hiện lại trên Mobile."
            }
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() => toggle(item)}
          >
            <Switch
              checked={item.isActive}
              loading={togglingId === item.id}
              aria-label={item.isActive ? "Ẩn khỏi Mobile" : "Bật lại"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Community taxonomy"
        title="Thẻ môn thể thao"
        description="Quản lý danh mục xuất hiện trong bộ lọc và trình tạo bài viết trên Mobile. Thẻ tắt sẽ không còn được API công khai trả về."
        action={
          <Tag color="success">
            {items.filter((item) => item.isActive).length} đang hoạt động
          </Tag>
        }
      />

      <PageState loading={loading} error={error} retry={() => void load()}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={7}>
            <Card
              title={editing ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"}
              className="h-full"
            >
              <Typography.Paragraph type="secondary">
                Slug chỉ gồm chữ thường, số và dấu gạch ngang.
              </Typography.Paragraph>

              <Form<SportForm>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={(values) => void submit(values)}
              >
                <Form.Item
                  label="Tên hiển thị"
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: "Nhập tên môn thể thao.",
                    },
                  ]}
                >
                  <Input placeholder="Ví dụ: Bóng đá" />
                </Form.Item>

                <Form.Item
                  label="Slug"
                  name="slug"
                  rules={[
                    {
                      required: true,
                      message: "Nhập slug.",
                    },
                    {
                      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: "Slug không đúng định dạng.",
                    },
                  ]}
                >
                  <Input placeholder="bong-da" />
                </Form.Item>

                <Form.Item label="URL icon" name="iconUrl">
                  <Input placeholder="Không bắt buộc" />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={editing ? <EditOutlined /> : <PlusOutlined />}
                  >
                    {editing ? "Lưu thay đổi" : "Tạo thẻ"}
                  </Button>
                  {editing ? (
                    <Button onClick={cancelEdit}>Hủy</Button>
                  ) : null}
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={17}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={items}
              scroll={{ x: 760 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </Col>
        </Row>
      </PageState>
    </>
  );
}
