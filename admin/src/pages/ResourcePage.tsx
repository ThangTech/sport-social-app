import { ExportOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { Button, Select, Space, Switch, Table, Tag, Typography } from "antd";
import { PostReview } from "../components/PostReview";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageState } from "../components/ui";
import { api, appUrl, formatDate } from "../lib/api";
import type { AdminRow, PageData } from "../lib/types";

export type Resource = "users" | "groups" | "posts";

const settings: Record<
  Resource,
  {
    title: string;
    description: string;
    states: [number, string][];
  }
> = {
  users: {
    title: "Người dùng",
    description: "Kiểm soát trạng thái tài khoản ở cấp hệ thống.",
    states: [
      [1, "Hoạt động"],
      [2, "Tạm khóa"],
      [3, "Bị cấm"],
      [4, "Đã vô hiệu hóa"],
    ],
  },
  groups: {
    title: "Nhóm",
    description: "Xử lý nhóm vi phạm độc lập với quyền Owner hoặc Group Admin.",
    states: [
      [1, "Hoạt động"],
      [2, "Tạm ẩn"],
      [3, "Đã gỡ"],
    ],
  },
  posts: {
    title: "Bài viết",
    description:
      "Kiểm duyệt nội dung toàn hệ thống, không thay thế moderation trong nhóm.",
    states: [
      [1, "Đã đăng"],
      [2, "Đã ẩn"],
      [3, "Đã gỡ"],
      [4, "Đã xóa"],
    ],
  },
};

export function ResourcePage({ resource }: { resource: Resource }) {
  const config = settings[resource];
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData<AdminRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [reviewRow, setReviewRow] = useState<AdminRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(
        await api(
          `/admin/${resource}?page=${page}&pageSize=20&pendingOnly=${pendingOnly}`,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải dữ liệu.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, resource, pendingOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const update = async (row: AdminRow, status: number) => {
    setUpdatingId(row.id);
    setError("");

    try {
      await api(`/admin/${resource}/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, rowVersion: row.rowVersion }),
      });
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể cập nhật.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: TableProps<AdminRow>["columns"] = [
    {
      title: "Nội dung",
      key: "content",
      render: (_, row) => {
        const label = String(
          row.name ?? row.content ?? row.displayName ?? row.userName ?? "—",
        );
        const publicUrl =
          resource === "groups" || resource === "posts"
            ? appUrl(
                resource === "groups" ? `/group/${row.id}` : `/post/${row.id}`,
              )
            : null;

        return (
          <div className="max-w-xl">
            {publicUrl ? (
              <Typography.Link
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                strong
              >
                <Space size={6}>
                  <span className="line-clamp-2">{label}</span>
                  <ExportOutlined />
                </Space>
              </Typography.Link>
            ) : (
              <Typography.Text strong>{label}</Typography.Text>
            )}
            {row.description ? (
              <Typography.Text
                type="secondary"
                className="mt-1 block max-w-lg truncate text-xs"
              >
                {String(row.description)}
              </Typography.Text>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Mã",
      dataIndex: "id",
      width: 130,
      render: (value: string) => (
        <Typography.Text code>{value.slice(0, 8)}…</Typography.Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 190,
      render: (value: number, row) =>
        resource === "posts" ? (
          <Space orientation="vertical">
            <Tag>
              {row.systemModerationStatus === 1
                ? "Chờ duyệt"
                : row.systemModerationStatus === 4
                  ? "Đang tải media"
                  : config.states.find(([state]) => state === value)?.[1]}
            </Tag>
            <Typography.Text type="secondary">
              {row.groupId
                ? "Trong nhóm"
                : { 1: "Công khai", 2: "Người theo dõi", 3: "Riêng tư" }[
                    Number(row.visibility)
                  ] || ""}
            </Typography.Text>
            <Button onClick={() => setReviewRow(row)}>Xem và duyệt</Button>
          </Space>
        ) : (
          <Select
            value={value}
            options={config.states.map(([state, label]) => ({
              value: state,
              label,
            }))}
            loading={updatingId === row.id}
            disabled={updatingId === row.id}
            onChange={(status) => void update(row, status)}
            className="w-full"
          />
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 170,
      render: (value?: string) => formatDate(value),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="System management"
        title={config.title}
        description={config.description}
        action={<Tag color="blue">{data?.total ?? 0} mục</Tag>}
      />

      <PageState loading={loading} error={error} retry={() => void load()}>
        {resource === "posts" && (
          <Space style={{ marginBottom: 16 }}>
            <Switch
              checked={pendingOnly}
              onChange={(value) => {
                setPendingOnly(value);
                setPage(1);
              }}
            />
            <span>Chỉ hiện bài ngoài nhóm chờ duyệt</span>
          </Space>
        )}
        {data ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data.items}
            scroll={{ x: 820 }}
            pagination={{
              current: page,
              pageSize: data.pageSize,
              total: data.total,
              showSizeChanger: false,
              showTotal: (total) => `${total} mục`,
              onChange: setPage,
            }}
          />
        ) : null}
      </PageState>
      {reviewRow && (
        <PostReview
          row={reviewRow}
          onClose={() => setReviewRow(null)}
          onUpdated={load}
        />
      )}
    </>
  );
}
