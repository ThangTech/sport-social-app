import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

type NavigationItem = {
  to: string;
  label: string;
  icon: string;
  description: string;
};

const navigationGroups: {
  label: string;
  items: NavigationItem[];
}[] = [
  {
    label: "Tổng quan",
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: "▦",
        description: "Sức khỏe và chỉ số hệ thống",
      },
    ],
  },
  {
    label: "Cộng đồng",
    items: [
      {
        to: "/users",
        label: "Người dùng",
        icon: "◎",
        description: "Tài khoản và trạng thái",
      },
      {
        to: "/groups",
        label: "Nhóm",
        icon: "◉",
        description: "Nhóm công khai và riêng tư",
      },
      {
        to: "/sports",
        label: "Thẻ thể thao",
        icon: "◇",
        description: "Danh mục hiển thị trên Mobile",
      },
    ],
  },
  {
    label: "Nội dung & an toàn",
    items: [
      {
        to: "/posts",
        label: "Bài viết",
        icon: "▤",
        description: "Nội dung toàn hệ thống",
      },
      {
        to: "/reports",
        label: "Báo cáo",
        icon: "△",
        description: "Xem đối tượng trước khi xử lý",
      },
      {
        to: "/copyright",
        label: "Bản quyền",
        icon: "©",
        description: "Reference và quét video",
      },
    ],
  },
  {
    label: "Quản trị hệ thống",
    items: [
      {
        to: "/roles",
        label: "Vai trò & quyền",
        icon: "♙",
        description: "System Administrator",
      },
      {
        to: "/operations",
        label: "Vận hành & thay đổi",
        icon: "↻",
        description: "Task và change request",
      },
      {
        to: "/incidents",
        label: "Sự cố & dự phòng",
        icon: "!",
        description: "Incident và contingency",
      },
      {
        to: "/audit",
        label: "Nhật ký hệ thống",
        icon: "≡",
        description: "Truy vết thao tác quản trị",
      },
    ],
  },
];

const allItems = navigationGroups.flatMap((group) => group.items);

export function AdminLayout({ logout }: { logout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const current = allItems.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to),
  );
  const matches = useMemo(() => {
    const value = search.trim().toLocaleLowerCase("vi");
    if (!value) {
      return [];
    }

    return allItems.filter((item) =>
      `${item.label} ${item.description}`.toLocaleLowerCase("vi").includes(value),
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] lg:grid lg:grid-cols-[280px_1fr]">
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-[#202832] text-white shadow-2xl transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-10 place-items-center rounded-lg bg-brand-500 text-lg font-black text-white">
            S
          </div>
          <div>
            <p className="font-bold tracking-wide">SocialSport</p>
            <p className="text-xs text-slate-400">System administration</p>
          </div>
        </div>
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/6 px-3 py-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-100">
              SA
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">System Admin</p>
              <p className="text-xs text-emerald-300">● Đang hoạt động</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group) => (
            <section className="mb-5" key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? "bg-brand-500 text-white shadow-lg shadow-brand-950/20" : "text-slate-300 hover:bg-white/7 hover:text-white"}`
                    }
                  >
                    <span className="grid size-7 place-items-center rounded-md bg-white/7 text-sm font-bold group-hover:bg-white/10">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <button
          className="m-4 rounded-lg border border-red-300/15 px-4 py-3 text-left text-sm font-semibold text-red-200 hover:bg-red-400/10"
          onClick={logout}
        >
          Đăng xuất
        </button>
      </aside>

      <main className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm md:px-7">
          <button
            className="grid size-10 place-items-center rounded-lg border border-slate-200 text-xl text-slate-600 lg:hidden"
            aria-label="Mở menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden min-w-44 md:block">
            <p className="text-sm font-bold text-slate-900">
              {current?.label ?? "Quản trị hệ thống"}
            </p>
            <p className="text-xs text-slate-400">
              {current?.description ?? "SocialSport"}
            </p>
          </div>
          <div className="relative max-w-xl flex-1">
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm nhanh chức năng quản trị…"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
              ⌕
            </span>
            {matches.length > 0 ? (
              <div className="absolute inset-x-0 top-12 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {matches.map((item) => (
                  <button
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      setSearch("");
                    }}
                  >
                    <span className="text-brand-600">{item.icon}</span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {item.label}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 sm:block">
            ADMIN
          </div>
        </header>
        <div className="mx-auto max-w-[1560px] p-4 md:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
