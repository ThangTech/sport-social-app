import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, apiFileUrl, formatDate } from "../lib/api";
import type { PageData } from "../lib/types";
import { PageHeader, PageState, Panel, StatusBadge } from "../components/ui";
import { inputClass, primaryButton } from "../lib/styles";
type CopyrightCase = {
  id: string;
  postId: string;
  mediaUrl: string;
  assetTitle: string;
  rightsOwnerName: string;
  uploaderId: string;
  confidence: number;
  status: number;
  appealReason?: string;
  createdAt: string;
};
const statusNames: Record<number, string> = {
  1: "Chờ duyệt",
  2: "Đã xác nhận",
  3: "Đã bác bỏ",
  4: "Kháng nghị",
  5: "Chấp nhận kháng nghị",
  6: "Bác kháng nghị",
};
export function CopyrightPage() {
  const [data, setData] = useState<PageData<CopyrightCase> | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api("/copyright/cases?page=1&pageSize=100"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không thể tải hồ sơ bản quyền.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const register = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      body = new FormData(form);
    try {
      await api("/copyright/assets", { method: "POST", body });
      form.reset();
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Không thể đăng ký reference.");
    }
  };
  const decide = async (item: CopyrightCase, status: number) => {
    const notes = prompt("Ghi rõ căn cứ quyết định (tối thiểu 3 ký tự):");
    if (!notes || notes.trim().length < 3) return;
    try {
      await api(`/copyright/cases/${item.id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      });
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Không thể lưu quyết định.");
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Rights protection"
        title="Bản quyền ảnh và video"
        description="Exact SHA-256 matching tạo hàng đợi review; System Admin ra quyết định có căn cứ, người đăng có quyền kháng nghị."
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Panel
            title="Đăng ký reference"
            subtitle="Chỉ tải nội dung khi chủ thể có quyền hợp lệ."
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
              Cơ chế hiện tại phát hiện bản sao byte giống hệt. Perceptual
              fingerprinting và nguồn dữ liệu từ đối tác quyền là lớp tích hợp
              tiếp theo, không được giả là đã có.
            </p>
          </Panel>
          <Panel title="Hàng đợi review" subtitle={`${data?.total ?? 0} hồ sơ`}>
            <div className="space-y-4">
              {data?.items.length === 0 && (
                <p className="py-12 text-center text-sm text-slate-400">
                  Không có hồ sơ.
                </p>
              )}
              {data?.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
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
                      {statusNames[item.status]}
                    </StatusBadge>
                  </div>
                  {item.appealReason && (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      Kháng nghị: {item.appealReason}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a
                      className="text-xs font-semibold text-brand-700 underline"
                      href={apiFileUrl(item.mediaUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem media
                    </a>
                    {(item.status === 1 || item.status === 4) && (
                      <>
                        <button
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                          onClick={() =>
                            void decide(item, item.status === 4 ? 6 : 2)
                          }
                        >
                          Xác nhận vi phạm
                        </button>
                        <button
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                          onClick={() =>
                            void decide(item, item.status === 4 ? 5 : 3)
                          }
                        >
                          Bác hồ sơ
                        </button>
                      </>
                    )}
                    <span className="ml-auto text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      </PageState>
    </>
  );
}
