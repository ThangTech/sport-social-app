import { useState, type FormEvent } from "react";
import { api, tokenKey } from "../lib/api";
import { inputClass, primaryButton } from "../components/ui";
export function LoginPage({ done }: { done: () => void }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{
        accessToken: string;
        user: {
          roles: string[];
        };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!result.user.roles.includes("ADMIN"))
        throw new Error("Tài khoản không có quyền System Admin.");
      localStorage.setItem(tokenKey, result.accessToken);
      done();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể đăng nhập.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#edf2ef] p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white bg-white p-7 shadow-[0_24px_80px_rgba(16,36,28,.14)] md:p-10"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#10241c] text-xl font-black text-white">
            S
          </div>
          <div>
            <p className="text-sm font-bold text-brand-700">SocialSport</p>
            <h1 className="text-2xl font-bold">System Admin</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-500">
          Đăng nhập bằng tài khoản có role ADMIN. Mọi thay đổi quản trị quan
          trọng được ghi nhật ký.
        </p>
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <label className="mb-4 block text-sm font-semibold text-slate-700">
          Email
          <input
            className={`${inputClass} mt-2`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="mb-6 block text-sm font-semibold text-slate-700">
          Mật khẩu
          <input
            className={`${inputClass} mt-2`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className={`${primaryButton} w-full`} disabled={loading}>
          {loading ? "Đang xác thực…" : "Đăng nhập an toàn"}
        </button>
      </form>
    </main>
  );
}
