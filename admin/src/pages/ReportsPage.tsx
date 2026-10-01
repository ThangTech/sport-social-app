import {
  ExportOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  List,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Input,
  message,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageState } from "../components/ui";
import { api, apiBlob, appUrl, formatDate } from "../lib/api";
import type { PageData } from "../lib/types";

type ReportItem = {
  id: string;
  reporterId: string;
  reporterDisplayName?: string | null;
  reporterEmail?: string | null;
  targetType: number;
  targetId: string;
  reason: string;
  description?: string | null;
  status: number;
  reviewedBy?: string | null;
  reviewedByDisplayName?: string | null;
  reviewedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
};

type TargetMedia = {
  id: string;
  mediaType: number;
  url: string;
};

type ReportTarget = {
  kind: "user" | "post" | "comment" | "group";
  title: string;
  subtitle: string;
  status: number;
  appPath: string;
  media: TargetMedia[];
};

const statusOptions = [
  {
    value: 1,
    label: "Chờ xử lý",
  },
  {
    value: 2,
    label: "Đang xem xét",
  },
  {
    value: 3,
    label: "Đã giải quyết",
  },
  {
    value: 4,
    label: "Đã từ chối",
  },
];

const targetNames: Record<number, string> = {
  1: "Người dùng",
  2: "Bài viết",
  3: "Bình luận",
  4: "Nhóm",
};

const statusColor = (status: number) => {
  if (status === 1) {
    return "warning";
  }

  if (status === 2) {
    return "processing";
  }

  if (status === 3) {
    return "success";
  }

  return "default";
};

const statusName = (status: number) =>
  statusOptions.find((item) => item.value === status)?.label ?? "Không rõ";

export function ReportsPage() {
  const [data, setData] = useState<PageData<ReportItem> | null>(null);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [targetLoading, setTargetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewStatus, setReviewStatus] = useState(1);
  const [resolutionNote, setResolutionNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await api(`/admin/reports?page=${page}&pageSize=20`));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải báo cáo.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const inspect = async (item: ReportItem) => {
    setSelected(item);
    setReviewStatus(item.status);
    setResolutionNote(item.resolutionNote ?? "");
    setTarget(null);
    setTargetLoading(true);
    setError("");

    try {
      setTarget(await api<ReportTarget>(`/admin/reports/${item.id}/target`));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể tải đối tượng bị báo cáo.",
      );
    } finally {
      setTargetLoading(false);
    }
  };

  const update = async () => {
    if (!selected) {
      return;
    }

    const note = resolutionNote.trim();
    if ((reviewStatus === 3 || reviewStatus === 4) && !note) {
      message.error("Cần nhập ghi chú trước khi đóng báo cáo.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api(`/admin/reports/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: reviewStatus,
          resolutionNote: note || null,
        }),
      });
      setSelected((current) =>
        current
          ? {
              ...current,
              status: reviewStatus,
              resolutionNote: note || null,
              reviewedAt: new Date().toISOString(),
            }
          : null,
      );
      message.success("Đã lưu kết quả xử lý báo cáo.");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể cập nhật báo cáo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Trust & safety"
        title="Hàng đợi báo cáo"
        description="Xem đầy đủ người gửi, nội dung và media ngay trong Admin trước khi lưu quyết định. Đóng report không tự động gỡ đối tượng."
        action={<Tag color="blue">{data?.total ?? 0} báo cáo</Tag>}
      />

      <PageState loading={loading} error={error} retry={() => void load()}>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={9}>
            <Card className="h-full" styles={{ body: { padding: 0 } }}>
              <List
                dataSource={data?.items ?? []}
                locale={{
                  emptyText: <Empty description="Chưa có báo cáo" />,
                }}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => void inspect(item)}
                    className={`cursor-pointer px-5 transition-colors ${
                      selected?.id === item.id
                        ? "bg-emerald-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <List.Item.Meta
                      avatar={<UserOutlined className="text-slate-400" />}
                      title={
                        <Space wrap>
                          <Typography.Text strong>
                            {item.reason}
                          </Typography.Text>
                          <Tag color={statusColor(item.status)}>
                            {statusName(item.status)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          <Typography.Text type="secondary" className="text-xs">
                            {item.reporterDisplayName || "Người dùng"}
                            {item.reporterEmail
                              ? ` · ${item.reporterEmail}`
                              : ""}
                          </Typography.Text>
                          <Typography.Text type="secondary" className="text-xs">
                            {targetNames[item.targetType]} ·{" "}
                            {formatDate(item.createdAt)}
                          </Typography.Text>
                          {item.description ? (
                            <Typography.Text
                              type="secondary"
                              className="line-clamp-2 text-xs"
                            >
                              {item.description}
                            </Typography.Text>
                          ) : null}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
              {data && data.total > data.pageSize ? (
                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    current={page}
                    pageSize={data.pageSize}
                    total={data.total}
                    showSizeChanger={false}
                    onChange={setPage}
                  />
                </div>
              ) : null}
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card
              title="Chi tiết xử lý"
              extra={<SafetyCertificateOutlined />}
              className="h-full"
            >
              {!selected ? (
                <Empty description="Chọn một báo cáo để kiểm tra" />
              ) : targetLoading ? (
                <div className="grid min-h-96 place-items-center">
                  <Spin tip="Đang tải nội dung bị báo cáo" />
                </div>
              ) : target ? (
                <ReportInspection
                  report={selected}
                  target={target}
                  reviewStatus={reviewStatus}
                  resolutionNote={resolutionNote}
                  saving={saving}
                  onStatusChange={setReviewStatus}
                  onNoteChange={setResolutionNote}
                  onSave={() => void update()}
                />
              ) : null}
            </Card>
          </Col>
        </Row>
      </PageState>
    </>
  );
}

function ReportInspection({
  report,
  target,
  reviewStatus,
  resolutionNote,
  saving,
  onStatusChange,
  onNoteChange,
  onSave,
}: {
  report: ReportItem;
  target: ReportTarget;
  reviewStatus: number;
  resolutionNote: string;
  saving: boolean;
  onStatusChange: (status: number) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
}) {
  const externalUrl = appUrl(target.appPath);

  return (
    <Space direction="vertical" size={20} className="w-full">
      <div>
        <Space wrap className="mb-2">
          <Tag color="blue">{target.kind}</Tag>
          <Tag>Trạng thái đối tượng: {target.status}</Tag>
        </Space>
        <Typography.Title level={4} className="whitespace-pre-wrap">
          {target.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          {target.subtitle}
        </Typography.Paragraph>
        {externalUrl ? (
          <Button
            type="link"
            icon={<ExportOutlined />}
            href={externalUrl}
            target="_blank"
            className="px-0"
          >
            Mở trang SocialSport (có thể yêu cầu đăng nhập hoặc quyền nhóm)
          </Button>
        ) : null}
      </div>

      {target.media.length > 0 ? (
        <Row gutter={[12, 12]}>
          {target.media.map((media) => (
            <Col xs={24} md={12} key={media.id}>
              <ProtectedReportMedia item={media} />
            </Col>
          ))}
        </Row>
      ) : null}

      <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
        <Descriptions.Item label="Người gửi">
          <Space direction="vertical" size={0}>
            <Typography.Text>
              {report.reporterDisplayName || "Người dùng"}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {report.reporterEmail || report.reporterId}
            </Typography.Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Đối tượng">
          {targetNames[report.targetType]} · {report.targetId}
        </Descriptions.Item>
        <Descriptions.Item label="Lý do">
          {report.reason}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày gửi">
          {formatDate(report.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>
          {report.description || "Không có mô tả bổ sung."}
        </Descriptions.Item>
        {report.reviewedAt ? (
          <Descriptions.Item label="Lần xử lý gần nhất" span={2}>
            {report.reviewedByDisplayName || report.reviewedBy || "System Admin"}
            {` · ${formatDate(report.reviewedAt)}`}
          </Descriptions.Item>
        ) : null}
      </Descriptions>

      <Alert
        type="warning"
        showIcon
        title="Trạng thái report không tự gỡ nội dung"
        description="Nếu đối tượng vi phạm, hãy chuyển sang trang Người dùng, Nhóm hoặc Bài viết để áp dụng hành động hệ thống riêng và có audit độc lập."
      />

      <Card size="small" title="Kết quả xử lý">
        <Space direction="vertical" size={12} className="w-full">
          <Select
            value={reviewStatus}
            options={statusOptions}
            onChange={onStatusChange}
            className="w-full"
          />
          <Input.TextArea
            value={resolutionNote}
            onChange={(event) => onNoteChange(event.target.value)}
            maxLength={1000}
            showCount
            autoSize={{
              minRows: 4,
              maxRows: 8,
            }}
            placeholder={
              reviewStatus === 3 || reviewStatus === 4
                ? "Bắt buộc: giải thích kết quả cho người gửi báo cáo"
                : "Ghi chú nội bộ hoặc tiến độ xem xét"
            }
          />
          <Button type="primary" loading={saving} onClick={onSave}>
            Lưu kết quả xử lý
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

function ProtectedReportMedia({ item }: { item: TargetMedia }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    void apiBlob(item.url)
      .then((blob) => {
        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Không tải được media.",
          );
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item.url]);

  if (error) {
    return <Alert type="error" showIcon title={error} />;
  }

  if (!url) {
    return (
      <div className="grid h-64 place-items-center rounded-lg bg-slate-50">
        <Spin />
      </div>
    );
  }

  return item.mediaType === 2 ? (
    <video
      className="h-64 w-full rounded-lg bg-slate-950 object-contain"
      controls
      src={url}
    />
  ) : (
    <Image
      className="h-64 w-full rounded-lg object-contain"
      src={url}
      alt="Media bị báo cáo"
    />
  );
}
