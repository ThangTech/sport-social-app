import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { PageHeader, PageState, Panel, StatusBadge } from "../components/ui";
import { api, apiBlob, formatDate } from "../lib/api";
import { inputClass, primaryButton } from "../lib/styles";
import type { PageData } from "../lib/types";

type CopyrightCase = {
  id: string;
  postId: string;
  mediaUrl: string;
  referenceMediaUrl: string;
  mediaType: number;
  assetTitle: string;
  rightsOwnerName: string;
  confidence: number;
  status: number;
  appealReason?: string;
  createdAt: string;
};

type ExternalScan = {
  id: string;
  postId: string;
  provider: string;
  status: number;
  matchSummary?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
};

type DecisionTarget =
  | {
      kind: "case";
      id: string;
      status: number;
      title: string;
    }
  | {
      kind: "scan";
      id: string;
      isViolation: boolean;
      title: string;
    };

const caseStatusNames: Record<number, string> = {
  1: "Chờ duyệt",
  2: "Đã xác nhận",
  3: "Đã bác bỏ",
  4: "Kháng nghị",
  5: "Chấp nhận kháng nghị",
  6: "Bác kháng nghị",
};

const scanStatusNames: Record<number, string> = {
  1: "Đang quét",
  2: "Không phát hiện",
  3: "Cần Admin review",
  4: "Admin đã cho phép",
  5: "Xác nhận vi phạm",
  6: "Quét lỗi",
};

function ProtectedMedia({
  path,
  mediaType,
  label,
}: {
  path: string;
  mediaType: number;
  label: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void apiBlob(path)
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
  }, [path]);

  if (error) {
    return <p className="p-4 text-xs text-red-600">{error}</p>;
  }

  if (!url) {
    return <p className="p-4 text-xs text-slate-400">Đang tải {label}…</p>;
  }

  return mediaType === 2 ? (
    <video
      className="h-52 w-full bg-slate-950 object-contain"
      controls
      src={url}
    />
  ) : (
    <img
      className="h-52 w-full bg-slate-100 object-contain"
      src={url}
      alt={label}
    />
  );
}

export function CopyrightPage() {
  const [cases, setCases] = useState<PageData<CopyrightCase> | null>(null);
  const [scans, setScans] = useState<PageData<ExternalScan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<DecisionTarget | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [caseData, scanData] = await Promise.all([
        api<PageData<CopyrightCase>>("/copyright/cases?page=1&pageSize=100"),
        api<PageData<ExternalScan>>(
          "/copyright/external-scans?page=1&pageSize=100",
        ),
      ]);
      setCases(caseData);
      setScans(scanData);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể tải trung tâm bản quyền.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    try {
      await api("/copyright/assets", {
        method: "POST",
        body,
      });
      form.reset();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể đăng ký reference.",
      );
    }
  };

  const refreshScan = async (item: ExternalScan) => {
    try {
      await api(`/copyright/external-scans/${item.id}/refresh`, {
        method: "POST",
      });
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể đồng bộ kết quả quét.",
      );
    }
  };

  const submitDecision = async () => {
    if (!decision || notes.trim().length < 3) {
      return;
    }

    setSaving(true);
    try {
      if (decision.kind === "case") {
        await api(`/copyright/cases/${decision.id}/decision`, {
          method: "PATCH",
          body: JSON.stringify({
            status: decision.status,
            notes: notes.trim(),
          }),
        });
      } else {
        await api(`/copyright/external-scans/${decision.id}/decision`, {
          method: "PATCH",
          body: JSON.stringify({
            isViolation: decision.isViolation,
            notes: notes.trim(),
          }),
        });
      }

      setDecision(null);
      setNotes("");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể lưu quyết định.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Rights protection"
        title="Trung tâm bản quyền ảnh và video"
        description="Đối chiếu reference nội bộ, quét âm thanh video bằng ACRCloud và quyết định cuối bởi System Admin."
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Panel
            title="Đăng ký reference"
            subtitle="Chỉ tải nội dung có bằng chứng quyền hợp lệ."
          >
            <form className="space-y-3" onSubmit={register}>
              <input
                className={inputClass}
                name="title"
                placeholder="Tên tác phẩm"
                required
              />
              <input
                className={inputClass}
                name="rightsOwnerName"
                placeholder="Chủ sở hữu quyền"
                required
              />
              <textarea
                className={`${inputClass} min-h-24 py-3`}
                name="evidenceNotes"
                placeholder="Bằng chứng / phạm vi quyền"
              />
              <input
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
                type="file"
                name="file"
                accept="image/*,video/*"
                required
              />
              <button className={`${primaryButton} w-full`}>
                Đăng ký reference
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              SHA-256 phát hiện bản sao byte giống hệt. ACRCloud chỉ hỗ trợ nhận
              diện nhạc/âm thanh trong video; Admin vẫn phải xem bằng chứng trước
              khi gỡ nội dung.
            </p>
          </Panel>

          <div className="space-y-6">
            <ExternalScanQueue
              data={scans}
              refreshScan={refreshScan}
              setDecision={setDecision}
            />
            <ReferenceCaseQueue data={cases} setDecision={setDecision} />
          </div>
        </div>
      </PageState>

      {decision ? (
        <DecisionModal
          decision={decision}
          notes={notes}
          saving={saving}
          setNotes={setNotes}
          close={() => {
            setDecision(null);
            setNotes("");
          }}
          submit={submitDecision}
        />
      ) : null}
    </>
  );
}

function ExternalScanQueue({
  data,
  refreshScan,
  setDecision,
}: {
  data: PageData<ExternalScan> | null;
  refreshScan: (item: ExternalScan) => Promise<void>;
  setDecision: (target: DecisionTarget) => void;
}) {
  return (
    <Panel
      title="Kết quả quét video bên thứ ba"
      subtitle={`${data?.total ?? 0} lượt quét`}
    >
      <div className="space-y-4">
        {data?.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Chưa có video gửi sang nhà cung cấp.
          </p>
        ) : null}
        {data?.items.map((item) => (
          <article
            className="rounded-xl border border-slate-200 p-4"
            key={item.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {item.provider} · bài {item.postId.slice(0, 8)}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {item.matchSummary ??
                    item.errorMessage ??
                    "Đang chờ kết quả từ nhà cung cấp."}
                </p>
              </div>
              <StatusBadge
                tone={
                  item.status === 1 || item.status === 3
                    ? "amber"
                    : item.status === 5 || item.status === 6
                      ? "red"
                      : "green"
                }
              >
                {scanStatusNames[item.status]}
              </StatusBadge>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <ProtectedMedia
                path={`/copyright/external-scans/${item.id}/media`}
                mediaType={2}
                label="video cần kiểm tra"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === 1 ? (
                <button
                  className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                  onClick={() => void refreshScan(item)}
                >
                  Đồng bộ kết quả
                </button>
              ) : null}
              {item.status === 3 || item.status === 6 ? (
                <>
                  <button
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    onClick={() => {
                      setDecision({
                        kind: "scan",
                        id: item.id,
                        isViolation: true,
                        title: "Xác nhận vi phạm từ lượt quét",
                      });
                    }}
                  >
                    Xác nhận vi phạm
                  </button>
                  <button
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                    onClick={() => {
                      setDecision({
                        kind: "scan",
                        id: item.id,
                        isViolation: false,
                        title: "Cho phép nội dung",
                      });
                    }}
                  >
                    Cho phép nội dung
                  </button>
                </>
              ) : null}
              <span className="ml-auto text-xs text-slate-400">
                {formatDate(item.updatedAt ?? item.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ReferenceCaseQueue({
  data,
  setDecision,
}: {
  data: PageData<CopyrightCase> | null;
  setDecision: (target: DecisionTarget) => void;
}) {
  return (
    <Panel
      title="Đối chiếu reference nội bộ"
      subtitle={`${data?.total ?? 0} hồ sơ`}
    >
      <div className="space-y-4">
        {data?.items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Không có hồ sơ.
          </p>
        ) : null}
        {data?.items.map((item) => (
          <article
            className="rounded-xl border border-slate-200 p-4"
            key={item.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {item.assetTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Chủ quyền: {item.rightsOwnerName} · độ khớp{" "}
                  {(item.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <StatusBadge
                tone={
                  item.status === 1 || item.status === 4
                    ? "amber"
                    : item.status === 2 || item.status === 6
                      ? "red"
                      : "green"
                }
              >
                {caseStatusNames[item.status]}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MediaCard
                title="Reference đã đăng ký"
                path={item.referenceMediaUrl}
                mediaType={item.mediaType}
              />
              <MediaCard
                title="Nội dung người dùng đăng"
                path={item.mediaUrl}
                mediaType={item.mediaType}
              />
            </div>
            {item.appealReason ? (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Kháng nghị: {item.appealReason}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {item.status === 1 || item.status === 4 ? (
                <>
                  <button
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    onClick={() => {
                      setDecision({
                        kind: "case",
                        id: item.id,
                        status: item.status === 4 ? 6 : 2,
                        title: "Xác nhận vi phạm bản quyền",
                      });
                    }}
                  >
                    Xác nhận vi phạm
                  </button>
                  <button
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                    onClick={() => {
                      setDecision({
                        kind: "case",
                        id: item.id,
                        status: item.status === 4 ? 5 : 3,
                        title: "Bác hồ sơ bản quyền",
                      });
                    }}
                  >
                    Bác hồ sơ
                  </button>
                </>
              ) : null}
              <span className="ml-auto text-xs text-slate-400">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MediaCard({
  title,
  path,
  mediaType,
}: {
  title: string;
  path: string;
  mediaType: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <p className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        {title}
      </p>
      <ProtectedMedia path={path} mediaType={mediaType} label={title} />
    </div>
  );
}

function DecisionModal({
  decision,
  notes,
  saving,
  setNotes,
  close,
  submit,
}: {
  decision: DecisionTarget;
  notes: string;
  saving: boolean;
  setNotes: (value: string) => void;
  close: () => void;
  submit: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">
          {decision.title}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Ghi căn cứ cụ thể. Quyết định và người xử lý được lưu trong audit log.
        </p>
        <textarea
          className={`${inputClass} mt-4 min-h-32 py-3`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Căn cứ quyết định (tối thiểu 3 ký tự)"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600"
            disabled={saving}
            onClick={close}
          >
            Hủy
          </button>
          <button
            className={primaryButton}
            disabled={saving || notes.trim().length < 3}
            onClick={() => void submit()}
          >
            {saving ? "Đang lưu…" : "Lưu quyết định"}
          </button>
        </div>
      </div>
    </div>
  );
}
