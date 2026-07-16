import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, BookOpen, Zap, Trophy } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'

const FEATURES = [
  { icon: Sparkles, text: 'Jalur belajar personal dari AI', bg: 'bg-violet-100' },
  { icon: Zap, text: 'Kuis interaktif setiap hari', bg: 'bg-yellow-100' },
  { icon: Trophy, text: 'Sistem XP & streak harian', bg: 'bg-orange-100' },
  { icon: BookOpen, text: '5 bahasa asing tersedia', bg: 'bg-green-100' },
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authService.register(form)
      const { token, user } = res.data.data
      login(token, user)
      navigate('/avatar', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FAF9F6]">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12 relative overflow-hidden border-r-4 border-black">
        {/* Decorative blocks */}
        <div className="absolute top-8 right-8 w-24 h-24 bg-violet-400 border-2 border-white/20 rounded-2xl rotate-12 opacity-30" />
        <div className="absolute bottom-16 right-16 w-16 h-16 bg-yellow-300 border-2 border-white/20 rounded-xl -rotate-6 opacity-20" />
        <div className="absolute top-1/2 left-8 w-10 h-10 bg-[#58CC02] border-2 border-white/20 rounded-lg rotate-45 opacity-20" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-400 border-2 border-white flex items-center justify-center shadow-[3px_3px_0px_#fff]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">AksaraAI</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Mulai perjalanan<br />belajarmu hari ini
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
            Bergabung dengan ribuan pelajar yang sudah merasakan manfaat belajar dengan AI.
          </p>
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, text, bg }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${bg} border-2 border-white/20 flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4 text-black" />
                </div>
                <span className="text-gray-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-gray-600 text-xs font-medium">© 2026 AksaraAI. Semua hak dilindungi.</p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-violet-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-black text-lg">AksaraAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-black">Buat akun baru ✨</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Gratis selamanya, mulai sekarang</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-extrabold text-black">Username</label>
              <input
                name="username" placeholder="contoh: budi123"
                value={form.username} onChange={handleChange} required
                className="h-11 px-4 rounded-xl border-2 border-black bg-white font-medium text-sm
                           shadow-[3px_3px_0px_#000] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px]
                           focus:shadow-[2px_2px_0px_#000] transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-extrabold text-black">Email</label>
              <input
                name="email" type="email" placeholder="nama@email.com"
                value={form.email} onChange={handleChange} required
                className="h-11 px-4 rounded-xl border-2 border-black bg-white font-medium text-sm
                           shadow-[3px_3px_0px_#000] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px]
                           focus:shadow-[2px_2px_0px_#000] transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-extrabold text-black">Password</label>
              <input
                name="password" type="password" placeholder="Minimal 8 karakter"
                value={form.password} onChange={handleChange} required
                className="h-11 px-4 rounded-xl border-2 border-black bg-white font-medium text-sm
                           shadow-[3px_3px_0px_#000] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px]
                           focus:shadow-[2px_2px_0px_#000] transition-all placeholder:text-gray-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm font-bold text-black bg-red-100 border-2 border-black px-3 py-2.5 rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl mt-1 font-extrabold text-sm text-white bg-violet-400
                         border-2 border-black shadow-[4px_4px_0px_#000]
                         hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]
                         active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0
                         transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Akun'}
            </button>
          </form>

          <p className="text-xs font-medium text-gray-400 text-center mt-4">
            Dengan mendaftar, kamu menyetujui syarat & ketentuan kami.
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black/10" />
            </div> 
            <div className="relative flex justify-center">
              <span className="bg-[#FAF9F6] px-3 text-xs font-bold text-gray-400">atau</span>
            </div>
          </div>

          <p className="text-center text-sm font-medium text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-extrabold text-black underline underline-offset-2 hover:text-violet-500 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
