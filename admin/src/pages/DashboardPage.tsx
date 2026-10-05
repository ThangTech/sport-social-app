import {
  AlertOutlined,
  AuditOutlined,
  CopyrightOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Column, Pie } from "@ant-design/charts";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Timeline,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader, PageState } from "../components/ui";
import { api, formatDate } from "../lib/api";
import type { DashboardData, HealthData } from "../lib/types";

const quickActions = [
  {
    to: "/reports",
    title: "Xử lý báo cáo",
    description: "Xem nội dung bị báo cáo trước khi quyết định",
    icon: <SafetyCertificateOutlined />,
  },
  {
    to: "/copyright",
    title: "Duyệt bản quyền",
    description: "Đối chiếu reference và video nghi ngờ",
    icon: <CopyrightOutlined />,
  },
  {
    to: "/sports",
    title: "Quản lý thẻ thể thao",
    description: "Danh mục đang hiển thị trên Mobile",
    icon: <TrophyOutlined />,
  },
  {
    to: "/incidents",
    title: "Sự cố hệ thống",
    description: "Điều phối incident và phương án dự phòng",
    icon: <AlertOutlined />,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboard, status] = await Promise.all([
        api<DashboardData>("/admin/dashboard"),
        api<HealthData>("/admin/health"),
      ]);

      setData(dashboard);
      setHealth(status);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Central dashboard"
        title="Tổng quan vận hành"
        description="Theo dõi sức khỏe hệ thống, tốc độ tăng trưởng, hàng đợi kiểm duyệt và hoạt động quản trị trong một màn hình."
        action={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void load()}
          >
            Làm mới dữ liệu
          </Button>
        }
      />

      <PageState loading={loading} error={error} retry={() => void load()}>
        {data && health ? (
          <Space direction="vertical" size={24} className="w-full">
            <Row gutter={[16, 16]}>
              <Metric
                label="Người dùng"
                value={data.totals.users}
                helper={`+${data.activity.newUsers7d} trong 7 ngày`}
                icon={<UserOutlined />}
                color="#16794f"
              />
              <Metric
                label="Nhóm"
                value={data.totals.groups}
                helper={`+${data.activity.newGroups7d} trong 7 ngày`}
                icon={<TeamOutlined />}
                color="#1677ff"
              />
              <Metric
                label="Bài viết"
                value={data.totals.posts}
                helper={`+${data.activity.newPosts7d} trong 7 ngày`}
                icon={<FileTextOutlined />}
                color="#722ed1"
              />
              <Metric
                label="Đang chờ xử lý"
                value={
                  data.totals.reportsPending + data.totals.copyrightPending
                }
                helper={`${data.totals.reportsPending} báo cáo · ${data.totals.copyrightPending} bản quyền`}
                icon={<SafetyCertificateOutlined />}
                color="#d97706"
              />
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={14}>
                <Card
                  title="Hoạt động 7 ngày gần nhất"
                  extra={<Badge status="processing" text="Dữ liệu thực" />}
                  className="h-full"
                >
                  <ActivityChart data={data} />
                </Card>
              </Col>
              <Col xs={24} xl={10}>
                <Card title="Phân bổ dữ liệu hiện tại" className="h-full">
                  <DistributionChart data={data} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Card
                  title="Trạng thái dịch vụ"
                  extra={
                    <Typography.Text type="secondary" className="text-xs">
                      {formatDate(health.checkedAt)}
                    </Typography.Text>
                  }
                  className="h-full"
                >
                  <List
                    dataSource={health.services}
                    renderItem={(item) => {
                      const healthy = item.status === "healthy";

                      return (
                        <List.Item
                          extra={
                            <Badge
                              status={healthy ? "success" : "error"}
                              text={healthy ? "Ổn định" : "Suy giảm"}
                            />
                          }
                        >
                          <List.Item.Meta
                            title={item.name}
                            description={item.detail}
                          />
                        </List.Item>
                      );
                    }}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={14}>
                <Card title="Thao tác nhanh" className="h-full">
                  <Row gutter={[12, 12]}>
                    {quickActions.map((item) => (
                      <Col xs={24} sm={12} key={item.to}>
                        <Card
                          hoverable
                          size="small"
                          onClick={() => navigate(item.to)}
                          className="h-full"
                        >
                          <Space align="start">
                            <span className="text-lg text-[#16794f]">
                              {item.icon}
                            </span>
                            <div>
                              <Typography.Text strong>
                                {item.title}
                              </Typography.Text>
                              <Typography.Text
                                type="secondary"
                                className="mt-1 block text-xs"
                              >
                                {item.description}
                              </Typography.Text>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            </Row>

            <Card
              title="Hoạt động quản trị gần đây"
              extra={<AuditOutlined />}
            >
              {data.recentAudit.length === 0 ? (
                <Empty description="Chưa có hoạt động quản trị" />
              ) : (
                <Timeline
                  items={data.recentAudit.map((item) => ({
                    color: "#16794f",
                    children: (
                      <div>
                        <Typography.Text>
                          {item.displaySummary}
                        </Typography.Text>
                        <Typography.Text
                          type="secondary"
                          className="mt-1 block text-xs"
                        >
                          {item.actionLabel} · {formatDate(item.createdAt)}
                        </Typography.Text>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </Space>
        ) : null}
      </PageState>
    </>
  );
}

function Metric({
  label,
  value,
  helper,
  icon,
  color,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Col xs={24} sm={12} xl={6}>
      <Card className="h-full">
        <Statistic
          title={label}
          value={value}
          prefix={icon}
          valueStyle={{
            color,
            fontWeight: 700,
          }}
        />
        <Typography.Text type="secondary" className="mt-2 block text-xs">
          {helper}
        </Typography.Text>
      </Card>
    </Col>
  );
}

function ActivityChart({ data }: { data: DashboardData }) {
  const chartData = useMemo(
    () => [
      {
        type: "Người dùng mới",
        value: data.activity.newUsers7d,
      },
      {
        type: "Nhóm mới",
        value: data.activity.newGroups7d,
      },
      {
        type: "Bài viết mới",
        value: data.activity.newPosts7d,
      },
      {
        type: "Báo cáo",
        value: data.activity.reports7d,
      },
    ],
    [data],
  );

  return (
    <Column
      data={chartData}
      xField="type"
      yField="value"
      colorField="type"
      height={290}
      axis={{
        y: {
          title: "Số lượng",
        },
        x: {
          title: false,
        },
      }}
      legend={false}
      style={{
        radiusTopLeft: 6,
        radiusTopRight: 6,
      }}
    />
  );
}

function DistributionChart({ data }: { data: DashboardData }) {
  const chartData = useMemo(
    () => [
      {
        type: "Người dùng",
        value: data.totals.users,
      },
      {
        type: "Nhóm",
        value: data.totals.groups,
      },
      {
        type: "Bài viết",
        value: data.totals.posts,
      },
      {
        type: "Thẻ thể thao",
        value: data.totals.sports,
      },
    ],
    [data],
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Pie
      data={chartData}
      angleField="value"
      colorField="type"
      innerRadius={0.62}
      height={290}
      legend={{
        position: "bottom",
      }}
      label={{
        text: "value",
        position: "outside",
      }}
      tooltip={{
        title: "type",
      }}
      annotations={[
        {
          type: "text",
          style: {
            text: total.toLocaleString("vi-VN"),
            x: "50%",
            y: "46%",
            textAlign: "center",
            fontSize: 24,
            fontWeight: 700,
          },
        },
        {
          type: "text",
          style: {
            text: "Tổng đối tượng",
            x: "50%",
            y: "56%",
            textAlign: "center",
            fontSize: 12,
            fill: "#64748b",
          },
        },
      ]}
    />
  );
}
