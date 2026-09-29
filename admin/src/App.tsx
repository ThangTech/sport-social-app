import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL as string | undefined
type Section = 'users' | 'groups' | 'posts' | 'reports'
type Row = Record<string, unknown> & { id: string; status: number }
type PageData = { items: Row[]; total: number; page: number; pageSize: number }
const labels: Record<Section, string> = { users: 'Người dùng', groups: 'Nhóm', posts: 'Bài viết', reports: 'Báo cáo' }
const states: Record<Section, [number, string][]> = { users: [[1,'Active'],[2,'Suspended'],[3,'Deleted']], groups: [[1,'Active'],[2,'Suspended'],[3,'Removed']], posts: [[1,'Published'],[2,'Hidden'],[3,'Removed'],[4,'Deleted']], reports: [[1,'Pending'],[2,'Reviewing'],[3,'Resolved'],[4,'Rejected']] }

async function api<T>(path: string, options: RequestInit = {}) {
  if (!API_URL) throw new Error('VITE_API_URL chưa được cấu hình.')
  const token = localStorage.getItem('adminAccessToken')
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.detail || (response.status === 403 ? 'Tài khoản không có quyền System Admin.' : 'Yêu cầu thất bại.')) }
  return response.status === 204 ? undefined as T : await response.json() as T
}

function Login({ done }: { done: () => void }) {
  const [account, setAccount] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const submit = async (e: FormEvent) => { e.preventDefault(); setLoading(true); setError(''); try { const result = await api<{ accessToken: string; user: { roles: string[] } }>('/auth/login', { method: 'POST', body: JSON.stringify({ emailOrUserName: account, password }) }); if (!result.user.roles.includes('ADMIN')) throw new Error('Tài khoản không có quyền System Admin.'); localStorage.setItem('adminAccessToken', result.accessToken); done() } catch (value) { setError(value instanceof Error ? value.message : 'Không thể đăng nhập.') } finally { setLoading(false) } }
  return <main className="login"><form className="card" onSubmit={submit}><div><p className="eyebrow">SocialSport</p><h1>System Admin</h1><p className="muted">Chỉ tài khoản có role ADMIN.</p></div>{error && <div className="error">{error}</div>}<label>Tài khoản<input value={account} onChange={e => setAccount(e.target.value)} required /></label><label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button></form></main>
}

function Dashboard({ logout }: { logout: () => void }) {
  const [section, setSection] = useState<Section>('users'), [page, setPage] = useState(1), [data, setData] = useState<PageData>({ items: [], total: 0, page: 1, pageSize: 20 }), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await api<PageData>(`/admin/${section}?page=${page}&pageSize=20`)) } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu.') } finally { setLoading(false) } }, [page, section])
  // The request callback owns the loading state for each section/page change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  const select = (value: Section) => { setSection(value); setPage(1) }
  const update = async (row: Row, status: number) => { try { await api(`/admin/${section}/${row.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật.') } }
  return <div className="shell"><aside><div><p className="eyebrow">SocialSport</p><h2>Quản trị hệ thống</h2></div><nav>{(Object.keys(labels) as Section[]).map(key => <button className={section === key ? 'active' : ''} onClick={() => select(key)} key={key}>{labels[key]}</button>)}</nav><button className="logout" onClick={logout}>Đăng xuất</button></aside><main className="dashboard"><header><div><p className="eyebrow">System Admin</p><h1>{labels[section]}</h1></div><span>{data.total} mục</span></header>{error && <div className="error">{error} <button className="link" onClick={() => void load()}>Thử lại</button></div>}{loading ? <div className="state">Đang tải…</div> : data.items.length === 0 ? <div className="state">Không có dữ liệu.</div> : <div className="table"><table><thead><tr><th>Nội dung</th><th>ID</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>{data.items.map(row => <tr key={row.id}><td><strong>{String(row.displayName ?? row.name ?? row.reason ?? row.content ?? row.userName ?? '—').slice(0,100)}</strong>{row.description ? <small>{String(row.description).slice(0,120)}</small> : null}</td><td><code>{row.id.slice(0,8)}…</code></td><td><select value={row.status} onChange={e => void update(row, Number(e.target.value))}>{states[section].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></td><td>{row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString('vi-VN') : '—'}</td></tr>)}</tbody></table></div>}<footer><button disabled={page === 1} onClick={() => setPage(x => x - 1)}>Trang trước</button><span>Trang {page}</span><button disabled={page * data.pageSize >= data.total} onClick={() => setPage(x => x + 1)}>Trang sau</button></footer></main></div>
}

export default function App() { const [auth, setAuth] = useState(Boolean(localStorage.getItem('adminAccessToken'))); const logout = () => { localStorage.removeItem('adminAccessToken'); setAuth(false) }; return auth ? <Dashboard logout={logout} /> : <Login done={() => setAuth(true)} /> }
