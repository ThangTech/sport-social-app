import { NavLink, Outlet } from 'react-router'

const navigation = [
  ['/', 'Tổng quan'], ['/users', 'Người dùng'], ['/groups', 'Nhóm'], ['/posts', 'Bài viết'], ['/reports', 'Báo cáo'],
  ['/copyright', 'Bản quyền'], ['/roles', 'Vai trò & quyền'], ['/operations', 'Vận hành & thay đổi'], ['/incidents', 'Sự cố & dự phòng'], ['/audit', 'Nhật ký hệ thống'],
]

export function AdminLayout({ logout }: { logout: () => void }) {
  return <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="flex flex-col bg-[#10241c] px-4 py-5 text-white lg:fixed lg:inset-y-0 lg:w-[260px] lg:px-5 lg:py-7">
      <div className="flex items-center gap-3 px-2"><div className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black text-brand-700">S</div><div><p className="text-sm font-bold">SocialSport</p><p className="text-xs text-emerald-100/60">System control</p></div></div>
      <nav className="mt-7 grid grid-cols-2 gap-1 lg:grid-cols-1">{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white text-[#10241c]' : 'text-emerald-50/70 hover:bg-white/8 hover:text-white'}`}>{label}</NavLink>)}</nav>
      <button className="mt-5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-200 hover:bg-white/8 lg:mt-auto" onClick={logout}>Đăng xuất</button>
    </aside>
    <main className="min-w-0 lg:col-start-2"><div className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8"><div><p className="text-sm font-semibold text-slate-900">Trung tâm quản trị</p><p className="text-xs text-slate-400">Dữ liệu trực tiếp từ SocialSport API</p></div><div className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">SYSTEM ADMIN</div></div><div className="mx-auto max-w-[1500px] p-5 md:p-8"><Outlet /></div></main>
  </div>
}
