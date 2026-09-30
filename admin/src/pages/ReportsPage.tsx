import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageState, Panel, StatusBadge } from "../components/ui";
import { api, apiBlob, appUrl, formatDate } from "../lib/api";
import type { PageData } from "../lib/types";
import { secondaryButton } from "../lib/styles";

type ReportItem = {
  id: string;
  reporterId: string;
  targetType: number;
  targetId: string;
  reason: string;
  description?: string | null;
  status: number;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
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

const statusNames: Record<number, string> = {
  1: "Chờ xử lý",
  2: "Đang xem xét",
  3: "Đã giải quyết",
  4: "Đã từ chối",
};

const targetNames: Record<number, string> = {
  1: "Người dùng",
  2: "Bài viết",
  3: "Bình luận",
  4: "Nhóm",
};

export function ReportsPage() {
  const [data, setData] = useState<PageData<ReportItem> | null>(null);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [targetLoading, setTargetLoading] = useState(false);
  const [error, setError] = useState("");

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

  const update = async (status: number) => {
    if (!selected) {
      return;
    }

    setError("");
    try {
      await api(`/admin/reports/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSelected((current) => (current ? { ...current, status } : null));
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể cập nhật báo cáo.",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Trust & safety"
        title="Hàng đợi báo cáo"
        description="Chọn một báo cáo để xem nội dung, trạng thái đối tượng và liên kết SocialSport trước khi đưa ra quyết định."
        action={
          <span className="text-sm font-semibold text-slate-500">
            {data?.total ?? 0} báo cáo
          </span>
        }
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        <div className="grid min-h-[650px] gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <Panel className="overflow-hidden !p-0">
            <div className="divide-y divide-slate-100">
              {data?.items.map((item) => (
                <button
                  className={`w-full p-5 text-left transition ${selected?.id === item.id ? "bg-brand-50" : "hover:bg-slate-50"}`}
                  key={item.id}
                  onClick={() => void inspect(item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {item.reason}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {targetNames[item.targetType]} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        item.status === 1
                          ? "amber"
                          : item.status === 3
                            ? "green"
                            : "slate"
                      }
                    >
                      {statusNames[item.status]}
                    </StatusBadge>
                  </div>
                  {item.description ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
            {data ? (
              <div className="flex items-center justify-between border-t border-slate-100 p-4">
                <button
                  className={secondaryButton}
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Trang trước
                </button>
                <span className="text-xs text-slate-500">Trang {page}</span>
                <button
                  className={secondaryButton}
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Chi tiết xử lý"
            subtitle="Quyết định chỉ nên thực hiện sau khi đã xem đối tượng."
          >
            {!selected ? (
              <div className="grid min-h-[480px] place-items-center text-center">
                <div>
                  <p className="text-4xl text-slate-300">◎</p>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Chọn một báo cáo bên trái
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Nội dung bị báo cáo sẽ hiển thị tại đây.
                  </p>
                </div>
              </div>
            ) : targetLoading ? (
              <div className="grid min-h-[480px] place-items-center text-sm text-slate-500">
                Đang tải nội dung bị báo cáo…
              </div>
            ) : target ? (
              <ReportInspection
                report={selected}
                target={target}
                update={update}
              />
            ) : null}
          </Panel>
        </div>
      </PageState>
    </>
  );
}

function ReportInspection({
  report,
  target,
  update,
}: {
  report: ReportItem;
  target: ReportTarget;
  update: (status: number) => Promise<void>;
}) {
  const externalUrl = appUrl(target.appPath);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
              {target.kind}
            </p>
            <h2 className="mt-1 whitespace-pre-wrap text-lg font-bold text-slate-900">
              {target.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{target.subtitle}</p>
          </div>
          {externalUrl ? (
            <a
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Mở trong SocialSport ↗
            </a>
          ) : null}
        </div>
      </div>

      {target.media.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {target.media.map((media) => (
            <ProtectedReportMedia item={media} key={media.id} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Lý do báo cáo
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {report.reason}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
            {report.description || "Người gửi không cung cấp mô tả bổ sung."}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Thông tin hồ sơ
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Người gửi</dt>
              <dd className="font-mono text-xs text-slate-700">
                {report.reporterId.slice(0, 8)}…
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Đối tượng</dt>
              <dd className="font-mono text-xs text-slate-700">
                {report.targetId.slice(0, 8)}…
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ngày gửi</dt>
              <dd className="text-xs text-slate-700">
                {formatDate(report.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">Quyết định xử lý</p>
        <p className="mt-1 text-xs leading-5 text-amber-700">
          Trạng thái report không tự gỡ nội dung. Nếu xác định vi phạm, hãy xử lý
          đối tượng tại trang Bài viết, Nhóm hoặc Người dùng tương ứng.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(statusNames).map(([value, label]) => (
            <button
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${report.status === Number(value) ? "bg-slate-900 text-white" : "border border-amber-200 bg-white text-slate-700"}`}
              key={value}
              onClick={() => void update(Number(value))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
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
    return <p className="rounded-xl bg-red-50 p-4 text-xs text-red-600">{error}</p>;
  }

  if (!url) {
    return (
      <p className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        Đang tải media…
      </p>
    );
  }

  return item.mediaType === 2 ? (
    <video
      className="h-64 w-full rounded-xl bg-slate-950 object-contain"
      controls
      src={url}
    />
  ) : (
    <img
      className="h-64 w-full rounded-xl bg-slate-100 object-contain"
      src={url}
      alt="Media bị báo cáo"
    />
  );
}
