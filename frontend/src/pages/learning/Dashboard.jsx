import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Flame, Zap, BookOpen, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, Globe, Trophy, Target, Languages,
} from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import { useAuth }  from '@/hooks/useAuth'
import { learningPathService } from '@/services/learning.service'
import { authService } from '@/services/auth.service'
import { leaderboardService } from '@/services/quiz.service'
import { cn } from '@/lib/utils'

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className={cn('rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 flex items-center gap-4', bg)}>
      <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
        <Icon className={cn('w-6 h-6', iconColor)} />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-black leading-none">{value}</p>
        <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
}

// ── Path Card ────────────────────────────────────────────────
function PathCard({ path, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 cursor-pointer
                 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]
                 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                 transition-all duration-150"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-violet-100 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
          <Languages className="w-6 h-6 text-violet-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-extrabold text-black">{path.language_name}</p>
            <span className="text-xs bg-yellow-300 text-black px-2 py-0.5 rounded-full font-bold border border-black capitalize">
              {path.base_level}
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-4 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
                style={{ width: `${path.total_levels ? Math.round((Number(path.completed_levels) / Number(path.total_levels)) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-black shrink-0">
              {path.total_levels ? Math.round((Number(path.completed_levels) / Number(path.total_levels)) * 100) : 0}%
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-black shrink-0 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

const RANK_EMOJI = ['🥇', '🥈', '🥉']

// ── Leaderboard Widget ───────────────────────────────────────
function LeaderboardWidget() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])

  useEffect(() => {
    leaderboardService.get()
      .then((res) => setRows(res.data.data.slice(0, 3)))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b-2 border-black bg-yellow-300">
        <Trophy className="w-5 h-5 text-black" />
        <p className="text-sm font-extrabold text-black">Papan Peringkat</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-1">
        {rows.map((u) => (
          <div key={u.rank} className={cn('flex items-center gap-3 p-2.5 rounded-xl transition-colors', u.isMe ? 'bg-yellow-50' : 'hover:bg-gray-50')}>
            <span className="text-lg leading-none">{RANK_EMOJI[u.rank - 1] ?? `#${u.rank}`}</span>
            <span className="text-sm font-bold text-black flex-1 truncate">{u.username}{u.isMe && ' (kamu)'}</span>
            <div className="flex items-center gap-1 bg-yellow-100 border border-black rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-black">{u.xp}</span>
            </div>
          </div>
        ))}
        <button
          onClick={() => navigate('/leaderboard')}
          className="mt-2 w-full text-xs font-bold text-black bg-gray-100 border-2 border-black rounded-xl py-2
                     hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[2px_2px_0px_#000]
                     transition-all duration-150"
        >
          Lihat semua →
        </button>
      </div>
    </div>
  )
}

// ── Daily Target Widget ──────────────────────────────────────
function DailyTargetWidget({ dailyXp = 0 }) {
  const target  = 200
  const percent = Math.min(100, Math.round((dailyXp / target) * 100))
  const done    = dailyXp >= target

  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b-2 border-black bg-green-300">
        <Target className="w-5 h-5 text-black" />
        <p className="text-sm font-extrabold text-black">Target Harian</p>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-end justify-between mb-3">
          <p className="text-2xl font-extrabold text-black">
            {dailyXp} <span className="text-sm font-bold text-gray-400">/ {target} XP</span>
          </p>
          <span className={cn(
            'text-xs font-extrabold px-2 py-1 rounded-full border-2 border-black',
            done ? 'bg-[#58CC02] text-white' : 'bg-yellow-300 text-black'
          )}>{percent}%</span>
        </div>
        <div className="h-5 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs font-bold text-gray-500 mt-2">
          {done ? '🎉 Target hari ini tercapai!' : `${target - dailyXp} XP lagi untuk mencapai target`}
        </p>
      </div>
    </div>
  )
}

// ── Path List with Show More ─────────────────────────────────
const INITIAL_SHOW = 4

function PathList({ paths, navigate }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? paths : paths.slice(0, INITIAL_SHOW)

  return (
    <div className="flex flex-col gap-3">
      {visible.map((path) => (
        <PathCard key={path.id} path={path} onClick={() => navigate(`/learning-path/${path.id}`)} />
      ))}
      {paths.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-extrabold text-sm
                     border-2 border-black bg-gray-100 shadow-[3px_3px_0px_#000]
                     hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]
                     active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                     transition-all duration-150"
        >
          {showAll ? <><ChevronUp className="w-4 h-4" /> Tampilkan lebih sedikit</> : <><ChevronDown className="w-4 h-4" /> Lihat semua ({paths.length})</>}
        </button>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const navigate         = useNavigate()
  const { user, updateUser } = useAuth()
  const [paths,    setPaths]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [dailyXp,  setDailyXp]  = useState(0)

  useEffect(() => {
    learningPathService.getAll()
      .then((res) => setPaths(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    authService.me()
      .then((res) => {
        const fresh = res.data.data
        setDailyXp(fresh.daily_xp ?? 0)
        updateUser({ xp: fresh.xp, streak: fresh.streak })
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">
            Halo, {user?.username}! 👋
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Lanjutkan perjalanan belajar bahasa asingmu hari ini
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={Flame} label="Hari Streak"  value={user?.streak || 0} bg="bg-orange-100" iconColor="text-orange-500" />
          <StatCard icon={Zap}   label="Total XP"     value={user?.xp || 0}     bg="bg-yellow-100" iconColor="text-yellow-500" />
          <StatCard icon={Globe} label="Bahasa Aktif" value={paths.length}      bg="bg-violet-100" iconColor="text-violet-600" />
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-[1fr_300px] gap-6">

          {/* LEFT — Learning Paths */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-black text-lg">Jalur Belajarku</h2>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Pilih bahasa untuk melanjutkan</p>
              </div>
              <button
                onClick={() => navigate('/language-select')}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#58CC02] text-white
                           border-2 border-black shadow-[3px_3px_0px_#000]
                           hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#000]
                           active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                           transition-all duration-150"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahasa
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full rounded-full" />
                      </div>
                      <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paths.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black bg-white p-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-violet-600" />
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-black text-lg">Belum ada jalur belajar</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">Pilih bahasa dan biarkan AI membuat jalur belajar untukmu</p>
                </div>
                <button
                  onClick={() => navigate('/language-select')}
                  className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl bg-[#58CC02] text-white
                             border-2 border-black shadow-[4px_4px_0px_#000]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                             transition-all duration-150"
                >
                  <Sparkles className="w-4 h-4" />
                  Mulai Belajar
                </button>
              </div>
            ) : (
              <PathList paths={paths} navigate={navigate} />
            )}
          </div>

          {/* RIGHT — Widgets */}
          <div className="flex flex-col gap-4">
            <DailyTargetWidget dailyXp={dailyXp} />
            <LeaderboardWidget />
          </div>

        </div>
      </div>
    </div>
  )
}
