import { useCallback, useEffect, useState } from 'react'
import { api, formatDate } from '../lib/api'
import type { AdminRow, PageData } from '../lib/types'
import { PageHeader, PageState, Panel, secondaryButton } from '../components/ui'

export type Resource = 'users' | 'groups' | 'posts' | 'reports'
const settings: Record<Resource, { title: string; description: string; states: [number, string][] }> = {
  users: { title: 'Người dùng', description: 'Kiểm soát trạng thái tài khoản ở cấp hệ thống.', states: [[1, 'Hoạt động'], [2, 'Tạm khóa'], [3, 'Đã xóa']] },
  groups: { title: 'Nhóm', description: 'Xử lý nhóm vi phạm độc lập với quyền Owner hoặc Group Admin.', states: [[1, 'Hoạt động'], [2, 'Tạm ẩn'], [3, 'Đã gỡ']] },
  posts: { title: 'Bài viết', description: 'Kiểm duyệt nội dung toàn hệ thống, không thay thế moderation trong nhóm.', states: [[1, 'Đã đăng'], [2, 'Đã ẩn'], [3, 'Đã gỡ'], [4, 'Đã xóa']] },
  reports: { title: 'Báo cáo', description: 'Hàng đợi báo cáo của người dùng và kết quả xử lý.', states: [[1, 'Chờ xử lý'], [2, 'Đang xem'], [3, 'Đã giải quyết'], [4, 'Từ chối']] },
}

export function ResourcePage({ resource }: { resource: Resource }) {
  const config = settings[resource], [page, setPage] = useState(1), [data, setData] = useState<PageData<AdminRow> | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await api(`/admin/${resource}?page=${page}&pageSize=20`)) } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu.') } finally { setLoading(false) } }, [page, resource])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  const update = async (row: AdminRow, status: number) => { setError(''); try { await api(`/admin/${resource}/${row.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật.') } }
  return <><PageHeader eyebrow="System management" title={config.title} description={config.description} action={<span className="text-sm font-semibold text-slate-500">{data?.total ?? 0} mục</span>} /><PageState loading={loading} error={error} empty={data?.items.length === 0} retry={() => void load()}>{data && <Panel className="overflow-hidden !p-0"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Nội dung</th><th className="px-5 py-4">Mã</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Ngày tạo</th></tr></thead><tbody className="divide-y divide-slate-100">{data.items.map(row => <tr key={row.id} className="hover:bg-slate-50/60"><td className="max-w-xl px-5 py-4"><p className="line-clamp-2 text-sm font-semibold text-slate-800">{String(row.displayName ?? row.name ?? row.reason ?? row.content ?? row.userName ?? '—')}</p>{row.description ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{String(row.description)}</p> : null}</td><td className="px-5 py-4 font-mono text-xs text-slate-400">{row.id.slice(0, 8)}…</td><td className="px-5 py-4"><select className="rounded-lg border border-slate-200 bg-white p-2 text-sm" value={row.status} onChange={e => void update(row, Number(e.target.value))}>{config.states.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(row.createdAt as string)}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><button className={secondaryButton} disabled={page === 1} onClick={() => setPage(x => x - 1)}>Trang trước</button><span className="text-sm text-slate-500">Trang {page}</span><button className={secondaryButton} disabled={page * data.pageSize >= data.total} onClick={() => setPage(x => x + 1)}>Trang sau</button></div></Panel>}</PageState></>
}
