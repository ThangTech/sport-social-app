import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";
import type { AuditItem, PageData } from "../lib/types";
import { PageHeader, PageState, Panel, StatusBadge } from "../components/ui";
export function AuditPage() {
  const [data, setData] = useState<PageData<AuditItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api("/admin/audit?page=1&pageSize=100"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote synchronization is intentionally owned by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Trách nhiệm quản trị"
        title="Nhật ký hệ thống"
        description="Theo dõi người thực hiện, hành động và nội dung bị tác động bằng thông tin dễ đọc."
      />
      <PageState
        loading={loading}
        error={error}
        empty={data?.items.length === 0}
        retry={() => void load()}
      >
        {data && (
          <Panel>
            <div className="space-y-1">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 border-b border-slate-100 py-4 last:border-0 md:grid-cols-[180px_1fr_auto]"
                >
                  <div>
                    <StatusBadge tone="blue">{item.actionLabel}</StatusBadge>
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      {item.actorDisplayName || "System Admin"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.actorEmail || `${item.actorId.slice(0, 8)}…`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {item.displaySummary}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.targetTypeLabel}: {item.targetLabel}
                    </p>
                  </div>
                  <time className="text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </PageState>
    </>
  );
}
