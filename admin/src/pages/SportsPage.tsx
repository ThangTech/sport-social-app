import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader, PageState, Panel, StatusBadge } from "../components/ui";
import { api, formatDate } from "../lib/api";
import { inputClass, primaryButton, secondaryButton } from "../lib/styles";

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

export function SportsPage() {
  const [items, setItems] = useState<SportItem[]>([]);
  const [editing, setEditing] = useState<SportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const body = {
      name: String(values.get("name") ?? "").trim(),
      slug: String(values.get("slug") ?? "").trim(),
      iconUrl: String(values.get("iconUrl") ?? "").trim() || null,
      isActive: editing?.isActive ?? true,
    };
    setSaving(true);
    setError("");
    try {
      await api(editing ? `/admin/sports/${editing.id}` : "/admin/sports", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setEditing(null);
      form.reset();
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
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Community taxonomy"
        title="Thẻ môn thể thao"
        description="Quản lý danh mục xuất hiện trong bộ lọc và trình tạo bài viết trên Mobile. Thẻ tắt sẽ không còn được API công khai trả về."
        action={
          <span className="text-sm font-semibold text-slate-500">
            {items.filter((item) => item.isActive).length} đang hoạt động
          </span>
        }
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Panel
            title={editing ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"}
            subtitle="Slug chỉ gồm chữ thường, số và dấu gạch ngang."
          >
            <form className="space-y-4" key={editing?.id ?? "new"} onSubmit={submit}>
              <label className="block text-sm font-semibold text-slate-700">
                Tên hiển thị
                <input
                  className={`${inputClass} mt-2`}
                  name="name"
                  defaultValue={editing?.name}
                  placeholder="Ví dụ: Bóng đá"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Slug
                <input
                  className={`${inputClass} mt-2`}
                  name="slug"
                  defaultValue={editing?.slug}
                  placeholder="bong-da"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                URL icon
                <input
                  className={`${inputClass} mt-2`}
                  name="iconUrl"
                  defaultValue={editing?.iconUrl ?? ""}
                  placeholder="Không bắt buộc"
                />
              </label>
              <div className="flex gap-3">
                <button className={`${primaryButton} flex-1`} disabled={saving}>
                  {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo thẻ"}
                </button>
                {editing ? (
                  <button
                    className={secondaryButton}
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    Hủy
                  </button>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Môn thể thao</th>
                    <th className="px-5 py-4">Bài viết</th>
                    <th className="px-5 py-4">Trạng thái</th>
                    <th className="px-5 py-4">Cập nhật</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr className="hover:bg-slate-50/70" key={item.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {item.slug}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.postCount}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={item.isActive ? "green" : "slate"}>
                          {item.isActive ? "Đang hiện" : "Đã ẩn"}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(item.updatedAt ?? item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                            onClick={() => setEditing(item)}
                          >
                            Sửa
                          </button>
                          <button
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${item.isActive ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                            onClick={() => void toggle(item)}
                          >
                            {item.isActive ? "Ẩn khỏi Mobile" : "Bật lại"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </PageState>
    </>
  );
}
