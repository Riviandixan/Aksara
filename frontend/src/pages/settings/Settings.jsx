import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Shield, Palette, LogOut, ChevronRight,
  Check, Loader2, AlertTriangle, Camera, X, Eye, EyeOff, KeyRound,
} from 'lucide-react'
import { Input }  from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import api from '@/services/api'

function SectionHeader({ icon: Icon, title, desc, bg }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn('w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]', bg)}>
        <Icon className="w-4 h-4 text-black" />
      </div>
      <div>
        <h2 className="font-extrabold text-black text-sm">{title}</h2>
        <p className="text-xs font-medium text-gray-500">{desc}</p>
      </div>
    </div>
  )
}

function SettingRow({ label, value, action }) {
  return (
    <div className="flex items-center justify-between py-3 border-b-2 border-black/10 last:border-0">
      <div>
        <p className="text-sm font-extrabold text-black">{label}</p>
        <p className="text-xs font-medium text-gray-400 mt-0.5">{value}</p>
      </div>
      {action}
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-extrabold text-black">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 text-sm font-medium border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose }) {
  const [current,     setCurrent]     = useState('')
  const [next,        setNext]        = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (next.length < 6)  return setError('Password baru minimal 6 karakter')
    if (next !== confirm)  return setError('Konfirmasi password tidak cocok')
    if (next === current)  return setError('Password baru tidak boleh sama dengan yang lama')

    setLoading(true)
    try {
      await api.patch('/auth/password', { current_password: current, new_password: next })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000] w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <KeyRound className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-extrabold text-black text-sm">Ubah Password</h3>
              <p className="text-xs font-medium text-gray-500">Pastikan password baru kuat dan mudah diingat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border-2 border-black bg-gray-100 hover:bg-gray-200 transition-colors shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-[#58CC02] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
              <Check className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-extrabold text-black">Password berhasil diubah!</p>
            <p className="text-xs font-medium text-gray-400">Modal akan tertutup otomatis...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordField label="Password Saat Ini" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} placeholder="Masukkan password saat ini" />
            <PasswordField label="Password Baru" value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext((v) => !v)} placeholder="Minimal 6 karakter" />
            <PasswordField label="Konfirmasi Password Baru" value={confirm} onChange={setConfirm} show={showNext} onToggle={() => setShowNext((v) => !v)} placeholder="Ulangi password baru" />

            {error && (
              <p className="text-xs font-bold text-red-700 bg-red-100 border-2 border-black rounded-xl px-3 py-2 shadow-[2px_2px_0px_#000]">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150">
                Batal
              </button>
              <button type="submit" disabled={loading || !current || !next || !confirm}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-sm border-2 border-black bg-[#58CC02] text-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 flex items-center justify-center gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate         = useNavigate()
  const { user, logout, updateUser } = useAuth()

  const [username,     setUsername]     = useState(user?.username || '')
  const [savingName,   setSavingName]   = useState(false)
  const [savedName,    setSavedName]    = useState(false)
  const [nameError,    setNameError]    = useState('')
  const [showPwdModal, setShowPwdModal] = useState(false)

  const handleSaveUsername = async () => {
    if (!username.trim() || username === user?.username) return
    setSavingName(true)
    setNameError('')
    try {
      await api.patch('/auth/profile', { username })
      updateUser({ username })
      setSavedName(true)
      setTimeout(() => setSavedName(false), 2000)
    } catch (err) {
      setNameError(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSavingName(false)
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {showPwdModal && <ChangePasswordModal onClose={() => setShowPwdModal(false)} />}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Pengaturan</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Kelola akun dan preferensi kamu</p>
        </div>

        <div className="flex flex-col gap-5">

          {/* ── Profile Card ── */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
            <SectionHeader icon={User} title="Profil" desc="Informasi akun kamu" bg="bg-violet-100" />

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black shadow-[3px_3px_0px_#000]" style={{ backgroundColor: '#b6e3f4' }}>
                  <img src={user?.avatar_url} alt="avatar" className="w-full h-full" />
                </div>
                <button
                  onClick={() => navigate('/avatar')}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-black">{user?.username}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate('/avatar')}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-violet-100 border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-150"
              >
                <Palette className="w-3.5 h-3.5" />
                Ganti Avatar
              </button>
            </div>

            {/* Username edit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-extrabold text-black">Username</label>
              <div className="flex gap-2">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username kamu"
                  className="flex-1 px-4 py-2.5 text-sm font-medium border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={savingName || username === user?.username || !username.trim()}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-sm border-2 border-black transition-all duration-150 shrink-0',
                    savedName
                      ? 'bg-[#58CC02] text-white shadow-none'
                      : 'bg-black text-white shadow-[3px_3px_0px_#555] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#555] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
                    (savingName || username === user?.username || !username.trim()) && 'opacity-40 cursor-not-allowed shadow-none translate-x-0 translate-y-0'
                  )}
                >
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   savedName  ? <><Check className="w-4 h-4" />Tersimpan</> :
                                'Simpan'}
                </button>
              </div>
              {nameError && <p className="text-xs font-bold text-red-600">{nameError}</p>}
            </div>
          </div>

          {/* ── Account Info Card ── */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
            <SectionHeader icon={Mail} title="Informasi Akun" desc="Detail akun yang tidak bisa diubah" bg="bg-blue-100" />
            <SettingRow
              label="Email" value={user?.email}
              action={<span className="text-xs font-extrabold bg-gray-100 border-2 border-black px-2 py-1 rounded-lg shadow-[1px_1px_0px_#000]">Tidak bisa diubah</span>}
            />
            <SettingRow
              label="Total XP" value={`${user?.xp || 0} poin`}
              action={<span className="text-xs font-extrabold bg-yellow-100 border-2 border-black px-2 py-1 rounded-full shadow-[1px_1px_0px_#000]">⚡ {user?.xp || 0} XP</span>}
            />
            <SettingRow
              label="Streak Aktif" value={`${user?.streak || 0} hari berturut-turut`}
              action={<span className="text-xs font-extrabold bg-orange-100 border-2 border-black px-2 py-1 rounded-full shadow-[1px_1px_0px_#000]">🔥 {user?.streak || 0} hari</span>}
            />
          </div>

          {/* ── Security Card ── */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
            <SectionHeader icon={Shield} title="Keamanan" desc="Kelola keamanan akun kamu" bg="bg-emerald-100" />
            <button
              className="w-full flex items-center justify-between py-3 px-3 rounded-xl border-2 border-transparent hover:border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_#000] transition-all duration-150 group"
              onClick={() => setShowPwdModal(true)}
            >
              <div className="text-left">
                <p className="text-sm font-extrabold text-black">Ubah Password</p>
                <p className="text-xs font-medium text-gray-400 mt-0.5">Perbarui password akun kamu</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
            </button>
          </div>

          {/* ── Danger Zone ── */}
          <div className="bg-white rounded-2xl border-2 border-red-400 shadow-[4px_4px_0px_#f87171] p-6">
            <SectionHeader icon={AlertTriangle} title="Zona Berbahaya" desc="Tindakan yang tidak bisa dibatalkan" bg="bg-red-100" />
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-extrabold text-black">Keluar dari Akun</p>
                <p className="text-xs font-medium text-gray-400 mt-0.5">Kamu perlu login kembali setelahnya</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-red-100 text-red-700 border-2 border-red-400 shadow-[2px_2px_0px_#f87171] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-150"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
