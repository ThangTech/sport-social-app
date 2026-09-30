import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  MetricCard,
  PageHeader,
  PageState,
  Panel,
  StatusBadge,
} from "../components/ui";
import { api, formatDate } from "../lib/api";
import type { DashboardData, HealthData } from "../lib/types";

const quickActions = [
  ["/reports", "Xử lý báo cáo", "Xem nội dung bị báo cáo trước khi quyết định"],
  ["/copyright", "Duyệt bản quyền", "Đối chiếu reference và video nghi ngờ"],
  ["/sports", "Quản lý thẻ thể thao", "Danh mục đang hiển thị trên Mobile"],
  ["/incidents", "Sự cố hệ thống", "Điều phối incident và phương án dự phòng"],
];

export function DashboardPage() {
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
        description="Một điểm nhìn cho sức khỏe hệ thống, cộng đồng, nội dung cần xử lý và hoạt động quản trị gần đây."
        action={
          <button
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            onClick={() => void load()}
          >
            Làm mới dữ liệu
          </button>
        }
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        {data && health ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Người dùng"
                value={data.totals.users}
                helper={`+${data.activity.newUsers7d} trong 7 ngày`}
              />
              <MetricCard
                label="Nhóm"
                value={data.totals.groups}
                helper={`+${data.activity.newGroups7d} trong 7 ngày`}
              />
              <MetricCard
                label="Bài viết"
                value={data.totals.posts}
                helper={`+${data.activity.newPosts7d} trong 7 ngày`}
              />
              <MetricCard
                label="Cần xử lý"
                value={
                  data.totals.reportsPending + data.totals.copyrightPending
                }
                helper={`${data.totals.reportsPending} report · ${data.totals.copyrightPending} bản quyền`}
                tone="amber"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
              <Panel
                title="Phân bổ hệ thống"
                subtitle="Quy mô hiện tại của các khu vực dữ liệu chính."
              >
                <SystemOverview data={data} />
              </Panel>
              <Panel
                title="Trạng thái dịch vụ"
                subtitle={`Kiểm tra ${formatDate(health.checkedAt)}`}
              >
                <div className="space-y-3">
                  {health.services.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                      <StatusBadge
                        tone={item.status === "healthy" ? "green" : "red"}
                      >
                        {item.status === "healthy" ? "Ổn định" : "Suy giảm"}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <Panel
                title="Thao tác nhanh"
                subtitle="Đi thẳng tới hàng đợi hoặc danh mục cần quản lý."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {quickActions.map(([to, title, description]) => (
                    <Link
                      className="group rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
                      key={to}
                      to={to}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700">
                          {title}
                        </p>
                        <span className="text-brand-600">→</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                      </p>
                    </Link>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Hoạt động quản trị gần đây"
                subtitle="Mỗi thay đổi quan trọng đều có actor và thời điểm."
              >
                <div className="space-y-1">
                  {data.recentAudit.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-400">
                      Chưa có hoạt động quản trị.
                    </p>
                  ) : (
                    data.recentAudit.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 border-b border-slate-100 py-3 last:border-0"
                      >
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-brand-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {item.summary}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.action} · {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </PageState>
    </>
  );
}

function SystemOverview({ data }: { data: DashboardData }) {
  const segments = useMemo(
    () => [
      {
        label: "Người dùng",
        value: data.totals.users,
        color: "#23865b",
      },
      {
        label: "Nhóm",
        value: data.totals.groups,
        color: "#38bdf8",
      },
      {
        label: "Bài viết",
        value: data.totals.posts,
        color: "#f59e0b",
      },
      {
        label: "Thẻ thể thao",
        value: data.totals.sports,
        color: "#8b5cf6",
      },
    ],
    [data],
  );
  const total = Math.max(
    1,
    segments.reduce((sum, segment) => sum + segment.value, 0),
  );
  let cursor = 0;
  const gradient = segments
    .map((segment) => {
      const start = cursor;
      cursor += (segment.value / total) * 100;
      return `${segment.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <div className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
      <div
        className="relative mx-auto grid size-52 place-items-center rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="grid size-36 place-items-center rounded-full bg-white text-center shadow-inner">
          <div>
            <p className="text-3xl font-black text-slate-900">{total}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              tổng đối tượng
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {segments.map((segment) => (
          <div
            className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
            key={segment.label}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <p className="text-xs font-semibold text-slate-500">
                {segment.label}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {segment.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
