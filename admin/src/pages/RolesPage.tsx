import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";
import type { Administrator, RoleData } from "../lib/types";
import {
  inputClass,
  PageHeader,
  PageState,
  Panel,
  primaryButton,
  secondaryButton,
  StatusBadge,
} from "../components/ui";
export function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]),
    [admins, setAdmins] = useState<Administrator[]>([]),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, a] = await Promise.all([
        api<RoleData[]>("/admin/roles"),
        api<Administrator[]>("/admin/administrators"),
      ]);
      setRoles(r);
      setAdmins(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải quyền.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const grant = async () => {
    if (!userId.trim()) return;
    try {
      await api(`/admin/administrators/${userId.trim()}`, { method: "POST" });
      setUserId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cấp quyền.");
    }
  };
  const revoke = async (admin: Administrator) => {
    if (
      !confirm(
        `Thu hồi quyền System Admin của ${admin.displayName || admin.email}?`,
      )
    )
      return;
    try {
      await api(`/admin/administrators/${admin.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể thu hồi quyền.");
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Roles & permissions"
        title="Vai trò và quản trị viên"
        description="Quyền hệ thống hoàn toàn tách biệt với Owner, Group Admin và Moderator trong từng nhóm."
      />
      <PageState loading={loading} error={error} retry={() => void load()}>
        <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-6">
            {roles.map((role) => (
              <Panel
                key={role.name}
                title={role.displayName}
                subtitle={role.accessLevel}
              >
                <div className="mb-5 flex items-center justify-between">
                  <StatusBadge tone="green">{role.name}</StatusBadge>
                  <span className="text-sm font-semibold text-slate-500">
                    {role.userCount} quản trị viên
                  </span>
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Trách nhiệm
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {role.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-brand-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {role.permissions.map((item) => (
                    <code
                      key={item}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    >
                      {item}
                    </code>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
          <Panel
            title="System Administrators"
            subtitle="Cấp quyền bằng User ID; Backend chặn tự thu hồi và chặn xóa admin cuối cùng."
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row">
              <input
                className={inputClass}
                placeholder="User ID cần cấp quyền"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <button
                className={`${primaryButton} shrink-0`}
                onClick={() => void grant()}
              >
                Cấp quyền
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {admin.displayName || "Chưa đặt tên"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {admin.email} · từ {formatDate(admin.createdAt)}
                    </p>
                  </div>
                  <button
                    className={`${secondaryButton} !min-h-9 text-red-600`}
                    onClick={() => void revoke(admin)}
                  >
                    Thu hồi
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </PageState>
    </>
  );
}
