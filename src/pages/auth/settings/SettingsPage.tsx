import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, X, Eye, EyeOff, Shield, Users, Key } from 'lucide-react'
import { usersAPI } from '@/services/administration/usersAPI'
import { rolesAPI } from '@/services/administration/rolesAPI'
import { permissionsAPI } from '@/services/administration/permissionsAPI'
import type { SystemUser, Role } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'users' | 'roles' | 'permissions'

interface UserForm {
  firstName: string; lastName: string; username: string
  email: string; password: string; roles: string[]; officeId: string
}

const EMPTY_FORM: UserForm = {
  firstName: '', lastName: '', username: '',
  email: '', password: '', roles: [], officeId: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: active ? '#ECFDF5' : '#FEF2F2',
      color: active ? '#059669' : '#DC2626',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#059669' : '#DC2626' }} />
      {active ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab]                   = useState<Tab>('users')
  const [users, setUsers]               = useState<SystemUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError]     = useState('')
  const [roles, setRoles]               = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [permissions, setPermissions]   = useState<string[]>([])
  const [permsLoading, setPermsLoading] = useState(false)
  const [showDialog, setShowDialog]     = useState(false)
  const [editingUser, setEditingUser]   = useState<SystemUser | null>(null)
  const [form, setForm]                 = useState<UserForm>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [formError, setFormError]       = useState('')

  const skip = { _skipAuthRedirect: true } as object

  useEffect(() => {
    setUsersLoading(true)
    usersAPI.getAll(skip as never)
      .then(res => {
        const data = res.data
        const arr = Array.isArray(data) ? data : ((data as { content?: SystemUser[] }).content ?? [])
        setUsers(arr)
      })
      .catch(() => setUsersError('Failed to load users'))
      .finally(() => setUsersLoading(false))
  }, [])

  useEffect(() => {
    if (tab !== 'roles') return
    setRolesLoading(true)
    rolesAPI.getAll()
      .then(res => setRoles(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setRolesLoading(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'permissions') return
    setPermsLoading(true)
    permissionsAPI.getAll()
      .then(res => setPermissions(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setPermsLoading(false))
  }, [tab])

  const openCreate = () => {
    setEditingUser(null); setForm(EMPTY_FORM)
    setFormError(''); setShowPassword(false); setShowDialog(true)
  }

  const openEdit = (user: SystemUser) => {
    setEditingUser(user)
    setForm({ firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, password: '', roles: user.roles ?? [], officeId: user.officeId ?? '' })
    setFormError(''); setShowPassword(false); setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return
    try { await usersAPI.delete(id); setUsers(p => p.filter(u => u.id !== id)) } catch { /* silent */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('')
    if (!form.firstName.trim()) { setFormError('First name is required'); return }
    if (!form.lastName.trim())  { setFormError('Last name is required');  return }
    if (!form.email.trim())     { setFormError('Email is required');      return }
    if (!editingUser && !form.password.trim()) { setFormError('Password is required'); return }
    setSaving(true)
    try {
      const payload: Partial<SystemUser & { password?: string }> = {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        username: form.username.trim(), email: form.email.trim(),
        roles: form.roles, officeId: form.officeId || undefined,
        ...(form.password ? { password: form.password } : {}),
      }
      if (editingUser) {
        const res = await usersAPI.update(editingUser.id, payload)
        setUsers(p => p.map(u => u.id === editingUser.id ? res.data : u))
      } else {
        const res = await usersAPI.create(payload)
        setUsers(p => [...p, res.data])
      }
      setShowDialog(false)
    } catch { setFormError('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: 13, color: '#0D1B3E',
    background: '#F8FAFF', border: '1px solid #DDE4EF',
    borderRadius: 8, outline: 'none', width: '100%',
    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users',       label: 'Users',       icon: <Users style={{ width: 14, height: 14 }} /> },
    { id: 'roles',       label: 'Roles',       icon: <Shield style={{ width: 14, height: 14 }} /> },
    { id: 'permissions', label: 'Permissions', icon: <Key style={{ width: 14, height: 14 }} /> },
  ]

  return (
    <div style={{ minHeight: '100%', background: '#EEF2F8', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .sp, .sp * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .sp .sora  { font-family: 'Sora', sans-serif !important; }
        .sp .mono  { font-family: 'DM Mono', monospace !important; }
        .sp input:focus, .sp select:focus { border-color: #002663 !important; outline: none !important; }
      `}</style>

      <div className="sp" style={{ padding: '24px 24px 40px' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)',
          borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 20,
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #1a4080, #002663, #1a4080)' }} />
          <div style={{
            position: 'absolute', inset: 0, top: 3, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }} />
          <div style={{ padding: '24px 28px 0', position: 'relative' }}>
            <div style={{ marginBottom: 20 }}>
              <h1 className="sora" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                Settings
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                Manage users, roles and permissions
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: '8px 8px 0 0', border: 'none',
                    fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                    cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                    background: tab === t.id ? '#EEF2F8' : 'transparent',
                    color: tab === t.id ? '#002663' : 'rgba(255,255,255,0.55)',
                  }}
                  onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Users Tab ───────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={openCreate}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, color: '#fff', background: '#002663',
                  border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#001844')}
                onMouseLeave={e => (e.currentTarget.style.background = '#002663')}
              >
                <Plus style={{ width: 14, height: 14 }} />Add User
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DDE4EF', overflow: 'hidden' }}>
              {usersLoading ? (
                <p style={{ padding: '48px', textAlign: 'center', fontSize: 13, color: '#8A9ABB' }}>Loading users...</p>
              ) : usersError ? (
                <p style={{ padding: '48px', textAlign: 'center', fontSize: 13, color: '#EF4444' }}>{usersError}</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #002663' }}>
                      {['Name', 'Username', 'Email', 'Roles', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#6B7A99' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '56px', textAlign: 'center', fontSize: 13, color: '#8A9ABB' }}>No users found</td></tr>
                    ) : users.map(user => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: '1px solid #F0F3F8', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F7FAFF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E9FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="sora" style={{ fontSize: 11, fontWeight: 700, color: '#002663' }}>
                                {getInitials(user.firstName, user.lastName)}
                              </span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0D1B3E' }}>{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <span className="mono" style={{ fontSize: 12, color: '#6B7A99' }}>{user.username}</span>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <span className="mono" style={{ fontSize: 12, color: '#374151' }}>{user.email}</span>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(user.roles ?? []).length === 0
                              ? <span style={{ fontSize: 12, color: '#8A9ABB' }}>—</span>
                              : (user.roles ?? []).map(r => (
                                <span key={r} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: '#EEF3FF', color: '#002663' }}>{r}</span>
                              ))}
                          </div>
                        </td>
                        <td style={{ padding: '13px 20px' }}><StatusBadge status={user.status} /></td>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[
                              { Icon: Edit,   action: () => openEdit(user),      hover: { border: '#002663', bg: '#F0F4F9' }, icon: '#6B7A99' },
                              { Icon: Trash2, action: () => handleDelete(user.id), hover: { border: '#FCA5A5', bg: '#FEF2F2' }, icon: '#EF4444' },
                            ].map(({ Icon, action, hover, icon }, i) => (
                              <button
                                key={i}
                                onClick={action}
                                style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #DDE4EF', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = hover.border; e.currentTarget.style.background = hover.bg }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDE4EF'; e.currentTarget.style.background = '#fff' }}
                              >
                                <Icon style={{ width: 13, height: 13, color: icon }} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {!usersLoading && users.length > 0 && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#8A9ABB' }}>{users.length} user{users.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        )}

        {/* ── Roles Tab ───────────────────────────────────────────────────── */}
        {tab === 'roles' && (
          rolesLoading ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DDE4EF', padding: '48px', textAlign: 'center', fontSize: 13, color: '#8A9ABB' }}>Loading roles...</div>
          ) : roles.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DDE4EF', padding: '56px', textAlign: 'center', fontSize: 13, color: '#8A9ABB' }}>No roles found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {roles.map(role => (
                <div key={role.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #DDE4EF', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield style={{ width: 16, height: 16, color: '#002663' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0D1B3E' }}>{role.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#8A9ABB' }}>{role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div style={{ padding: '14px 20px' }}>
                    {(role.permissions ?? []).length === 0 ? (
                      <p style={{ fontSize: 12, color: '#8A9ABB', margin: 0 }}>No permissions assigned</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {role.permissions.slice(0, 8).map(p => (
                          <span key={p} style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: '#F0F3F8', color: '#4A5878' }}>{p}</span>
                        ))}
                        {role.permissions.length > 8 && (
                          <span style={{ fontSize: 11, color: '#8A9ABB', padding: '3px 0' }}>+{role.permissions.length - 8} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Permissions Tab ─────────────────────────────────────────────── */}
        {tab === 'permissions' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DDE4EF', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #DDE4EF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: '#002663' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0D1B3E' }}>All Permissions</span>
              {!permsLoading && permissions.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8A9ABB' }}>{permissions.length} total</span>
              )}
            </div>
            <div style={{ padding: '20px 22px' }}>
              {permsLoading ? (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#8A9ABB', padding: '32px 0', margin: 0 }}>Loading permissions...</p>
              ) : permissions.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#8A9ABB', padding: '32px 0', margin: 0 }}>No permissions found</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {permissions.map(p => (
                    <span key={p} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: '#EEF3FF', color: '#002663', border: '1px solid #C7D7FF',
                    }}>
                      <Key style={{ width: 10, height: 10, flexShrink: 0 }} />{p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── User Dialog ─────────────────────────────────────────────────────── */}
      {showDialog && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,24,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDialog(false) }}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,38,99,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0D1B3E', fontFamily: "'Sora', sans-serif" }}>
                  {editingUser ? 'Edit User' : 'Add User'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8A9ABB' }}>
                  {editingUser ? 'Update user information' : 'Create a new system user'}
                </p>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #DDE4EF', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X style={{ width: 14, height: 14, color: '#6B7A99' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'First Name', key: 'firstName', placeholder: 'First name' },
                    { label: 'Last Name',  key: 'lastName',  placeholder: 'Last name'  },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5878' }}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
                      <input style={inputStyle} value={form[key as keyof UserForm] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
                {[
                  { label: 'Username',      key: 'username', type: 'text',  placeholder: 'username',                  required: false },
                  { label: 'Email Address', key: 'email',    type: 'email', placeholder: 'user@chelseabank.com',       required: true  },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5878' }}>
                      {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                    </label>
                    <input type={type} style={inputStyle} value={form[key as keyof UserForm] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5878' }}>
                    {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                    {!editingUser && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 38 }}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8A9ABB', display: 'flex', padding: 0 }}>
                      {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4A5878' }}>Office ID</label>
                  <input style={inputStyle} value={form.officeId} onChange={e => setForm(p => ({ ...p, officeId: e.target.value }))} placeholder="e.g. 1" />
                </div>
                {formError && (
                  <p style={{ fontSize: 12, color: '#EF4444', margin: 0, padding: '8px 12px', background: '#FEF2F2', borderRadius: 7 }}>{formError}</p>
                )}
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #EEF2F8', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowDialog(false)}
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#4A5878', background: '#fff', border: '1px solid #DDE4EF', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: saving ? '#8A9ABB' : '#002663', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#001844' }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = saving ? '#8A9ABB' : '#002663' }}
                >
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
