import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, FolderOpen, GraduationCap, Zap, CheckCircle2,
  Clock, ChevronRight, BarChart2, Target, Award, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { historyService } from '@/services/history.service'
import { Skeleton } from '@/components/Skeleton'

const LANG_FLAG = { en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', fr: '🇫🇷', de: '🇩🇪' }
const PAGE_SIZE = 15

function fmtTime(s) {
  if (!s) return null
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function fmtDate(iso) {
  const d = new Date(typeof iso === 'string' && !iso.endsWith('Z') ? iso + 'Z' : iso)
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ScoreBadge({ score }) {
  const cls = score >= 80 ? 'bg-[#58CC02] text-white'
            : score >= 60 ? 'bg-yellow-300 text-black'
            :               'bg-red-400 text-white'
  return (
    <span className={cn('text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-black', cls)}>
      {score}%
    </span>
  )
}

function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className={cn('rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-4 flex items-center gap-3', bg)}>
      <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-black/60 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-extrabold text-black">{value}</p>
      </div>
    </div>
  )
}

function SessionRow({ session }) {
  const navigate  = useNavigate()
  const isPackage = session.source_type === 'quiz_package'
  const isExam    = session.source_type === 'exam'
  const Icon      = isExam ? GraduationCap : isPackage ? FolderOpen : BookOpen
  const iconBg    = isExam ? 'bg-yellow-100' : isPackage ? 'bg-emerald-100' : 'bg-violet-100'
  const iconColor = isExam ? 'text-yellow-700' : isPackage ? 'text-emerald-700' : 'text-violet-700'
  const typeBg    = isExam ? 'bg-yellow-300'  : isPackage ? 'bg-emerald-300'  : 'bg-violet-300'
  const typeLabel = isExam ? 'Ujian'          : isPackage ? 'Paket Soal'      : 'Learning Path'

  return (
    <div
      onClick={() => navigate(`/history/${session.id}`)}
      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 border-transparent hover:border-black hover:bg-white hover:shadow-[3px_3px_0px_#000] cursor-pointer transition-all duration-150 group"
    >
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]', iconBg)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-extrabold text-black truncate">{session.source_name}</p>
          <span className="text-base shrink-0">{LANG_FLAG[session.language_code] || '🌐'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className={cn('px-2 py-0.5 rounded-full border border-black text-black text-[10px] font-extrabold', typeBg)}>
            {typeLabel}
          </span>
          <span className="text-gray-400">{fmtDate(session.played_at)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#58CC02]" />
          <span>{session.correct}/{session.total}</span>
        </div>
        {session.time_taken && (
          <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{fmtTime(session.time_taken)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 bg-yellow-100 border border-black rounded-full px-2 py-0.5">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="text-xs font-extrabold text-black">+{session.xp_earned}</span>
        </div>
        <ScoreBadge score={session.score} />
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
      </div>
    </div>
  )
}

export default function History() {
  const [sessions, setSessions] = useState([])
  const [stats,    setStats]    = useState(null)
  const [total,    setTotal]    = useState(0)
  const [offset,   setOffset]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    Promise.all([
      historyService.list({ limit: PAGE_SIZE, offset: 0 }),
      historyService.stats(),
    ]).then(([histRes, statsRes]) => {
      setSessions(histRes.data.data.sessions)
      setTotal(histRes.data.data.total)
      setStats(statsRes.data.data)
      setOffset(PAGE_SIZE)
    }).finally(() => setLoading(false))
  }, [])

  const loadMore = () => {
    setLoadingMore(true)
    historyService.list({ limit: PAGE_SIZE, offset })
      .then((res) => {
        setSessions((p) => [...p, ...res.data.data.sessions])
        setOffset((o) => o + PAGE_SIZE)
      })
      .finally(() => setLoadingMore(false))
  }

  const hasMore = sessions.length < total

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Riwayat Latihan</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Semua sesi belajar yang pernah kamu selesaikan</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
            <StatCard icon={BarChart2} label="Total Sesi"     value={stats.total_sessions}  bg="bg-violet-100" iconColor="text-violet-600" />
            <StatCard icon={Target}    label="Rata-rata Skor" value={`${stats.avg_score}%`} bg="bg-blue-100"   iconColor="text-blue-600"   />
            <StatCard icon={Zap}       label="Total XP"       value={stats.total_xp}         bg="bg-yellow-100" iconColor="text-yellow-600" />
            <StatCard icon={Award}     label="Soal Dijawab"   value={stats.total_questions}  bg="bg-green-100"  iconColor="text-green-600"  />
          </div>
        )}

        {/* Session List */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-violet-100">
            <p className="font-extrabold text-black">Semua Sesi</p>
            <span className="text-xs font-extrabold bg-white border-2 border-black px-2.5 py-1 rounded-full shadow-[2px_2px_0px_#000]">{total} sesi</span>
          </div>

          <div className="px-3 py-3">
            {loading ? (
              <div className="flex flex-col gap-1 px-3 py-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-6" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-3.5 w-20 rounded-full" />
                        <Skeleton className="h-3.5 w-28" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Skeleton className="h-6 w-12 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                  <BookOpen className="w-7 h-7 text-gray-400" />
                </div>
                <p className="font-extrabold text-black">Belum ada riwayat latihan</p>
                <p className="text-xs font-medium text-gray-400">Selesaikan quiz pertamamu untuk mulai mencatat progres</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {sessions.map((s) => <SessionRow key={s.id} session={s} />)}
                {hasMore && (
                  <div className="flex justify-center pt-3">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 text-xs font-extrabold px-5 py-2 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150 disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Muat lebih banyak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
