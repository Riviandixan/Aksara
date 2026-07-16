import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, BookOpen, Loader2, Trash2,
  Lock, Users, ChevronRight, X, Sparkles, FolderOpen, PlayCircle,
} from 'lucide-react'
import { cn }       from '@/lib/utils'
import { useAuth }  from '@/hooks/useAuth'
import { packageService } from '@/services/package.service'
import api from '@/services/api'

const LANG_COLORS = {
  en: 'bg-blue-100 text-blue-800',
  ja: 'bg-red-100 text-red-800',
  ko: 'bg-violet-100 text-violet-800',
  fr: 'bg-indigo-100 text-indigo-800',
  de: 'bg-yellow-100 text-yellow-800',
}

// ── Package Card ──────────────────────────────────────────────
function PackageCard({ pkg, onDelete, onClick }) {
  const navigate = useNavigate()
  const colorCls = LANG_COLORS[pkg.language_code] || 'bg-slate-100 text-slate-700'

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 cursor-pointer
                 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]
                 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                 transition-all duration-150"
    >
      {/* Language badge + actions */}
      <div className="flex items-start justify-between mb-3">
        <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full border-2 border-black', colorCls)}>
          {pkg.language_name}
        </span>
        <div className="flex items-center gap-1.5">
          {!pkg.is_public && <Lock className="w-3.5 h-3.5 text-gray-400" />}
          {pkg.is_mine && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pkg.id) }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border-2 border-black bg-red-100 hover:bg-red-200 text-red-600 transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-extrabold text-black text-sm leading-snug mb-1 line-clamp-2">{pkg.title}</h3>
      {pkg.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 font-medium">{pkg.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-black/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{pkg.question_count} soal</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
            {pkg.is_public ? <Users className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{pkg.is_public ? 'Publik' : 'Privat'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full overflow-hidden border-2 border-black shrink-0">
            <img src={pkg.author_avatar} alt={pkg.author} className="w-full h-full" />
          </div>
          <span className="text-[11px] font-bold text-gray-500 truncate max-w-[80px]">{pkg.author}</span>
        </div>
      </div>

      {/* Mulai Latihan button */}
      {pkg.question_count > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/quiz-packages/${pkg.id}/play`) }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#58CC02] text-white text-xs font-extrabold border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-150"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Mulai Latihan
        </button>
      )}
    </div>
  )
}

// ── Onboarding Banner ─────────────────────────────────────────
function OnboardingBanner({ onClose }) {
  const steps = [
    { num: 1, icon: Sparkles,   bg: 'bg-emerald-400', title: 'Buat Bank Soal', desc: 'Tambahkan soal ke bank soal pribadimu' },
    { num: 2, icon: FolderOpen, bg: 'bg-blue-400',    title: 'Buat Paket',     desc: 'Kumpulkan soal dari bank soal jadi satu paket' },
    { num: 3, icon: PlayCircle, bg: 'bg-yellow-400',  title: 'Mulai Latihan',  desc: 'Kerjakan paket soal dan pantau perkembanganmu' },
  ]
  return (
    <div className="relative rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 mb-6">
      <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg border-2 border-black bg-gray-100 hover:bg-gray-200 transition-colors">
        <X className="w-3.5 h-3.5 text-black" />
      </button>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#555]">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold text-black">Mulai Belajar</p>
          <p className="text-sm font-medium text-gray-500">Ikuti 3 langkah mudah untuk memulai latihan.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.num} className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className={cn('w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-black text-xs font-extrabold shrink-0', s.bg)}>
                {s.num}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 text-black" />
                  <p className="text-sm font-extrabold text-black">{s.title}</p>
                </div>
                <p className="text-xs font-medium text-gray-500">{s.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function QuizPackages() {
  const navigate                      = useNavigate()
  const { user }                      = useAuth()
  const [packages, setPackages]       = useState([])
  const [languages, setLanguages]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('all')
  const [search, setSearch]           = useState('')
  const [langFilter, setLangFilter]   = useState('')
  const [showBanner, setShowBanner]   = useState(true)

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await packageService.list({
        mine: tab === 'mine' || undefined,
        language_id: langFilter || undefined,
        search: search || undefined,
      })
      setPackages(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [tab, langFilter, search])

  useEffect(() => { fetchPackages() }, [fetchPackages])
  useEffect(() => {
    api.get('/languages').then((r) => setLanguages(r.data.data))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Hapus paket ini?')) return
    await packageService.remove(id)
    setPackages((p) => p.filter((x) => x.id !== id))
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-black">Paket Soal</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Kumpulan paket latihan dari komunitas.</p>
          </div>
          <button
            onClick={() => navigate('/quiz-packages/create')}
            className="flex items-center gap-2 font-extrabold px-4 py-2.5 rounded-xl bg-black text-white border-2 border-black shadow-[4px_4px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#555] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Buat Paket
          </button>
        </div>

        {/* Onboarding Banner */}
        {showBanner && <OnboardingBanner onClose={() => setShowBanner(false)} />}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {[{ key: 'all', label: 'Semua Paket' }, { key: 'mine', label: 'Paket Saya' }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-extrabold border-2 border-black transition-all duration-150',
                tab === t.key
                  ? 'bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]'
                  : 'bg-white text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari paket..."
              className="w-full pl-9 pr-4 py-2 text-sm font-medium border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all"
            />
          </div>
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-2 text-sm font-bold border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] transition-all"
          >
            <option value="">Semua Bahasa</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-extrabold text-black text-lg">Belum ada paket soal</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Jadilah yang pertama membuat paket soal!</p>
            </div>
            <button
              onClick={() => navigate('/quiz-packages/create')}
              className="flex items-center gap-2 font-extrabold px-6 py-3 rounded-xl bg-[#58CC02] text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Buat Paket Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onDelete={handleDelete}
                onClick={() => navigate(`/quiz-packages/${pkg.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
