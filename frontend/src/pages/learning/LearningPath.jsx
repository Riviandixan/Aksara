import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, CheckCircle2, PlayCircle, ArrowLeft, Zap, Star, Languages, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { learningPathService } from '@/services/learning.service'
import { Skeleton } from '@/components/Skeleton'

const STATUS_CONFIG = {
  locked: {
    icon: Lock, dotBg: 'bg-gray-100 border-2 border-black/20',
    iconColor: 'text-gray-300', cardClass: 'opacity-40 cursor-not-allowed',
  },
  unlocked: {
    icon: PlayCircle, dotBg: 'bg-[#58CC02] border-2 border-black shadow-[2px_2px_0px_#000]',
    iconColor: 'text-white', cardClass: 'cursor-pointer',
  },
  completed: {
    icon: CheckCircle2, dotBg: 'bg-violet-400 border-2 border-black shadow-[2px_2px_0px_#000]',
    iconColor: 'text-white', cardClass: 'cursor-pointer',
  },
}

export default function LearningPath() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [path,    setPath]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    learningPathService.getOne(id)
      .then((res) => setPath(res.data.data))
      .catch(() => setError('Gagal memuat jalur belajar'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">
        <Skeleton className="h-9 w-44 mb-6" />
        {/* Header card skeleton */}
        <div className="rounded-2xl bg-black/10 border-2 border-black p-6 mb-6 shadow-[6px_6px_0px_#555]">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="w-16 h-10 rounded-xl shrink-0" />
          </div>
          <Skeleton className="mt-4 h-4 w-full rounded-full" />
        </div>
        {/* Level cards skeleton */}
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-3 shrink-0">
                <Skeleton className="w-8 h-8 rounded-full" />
                {i < 4 && <Skeleton className="w-0.5 h-8 mt-1 rounded-none" />}
              </div>
              <div className="flex-1 mb-2 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-3.5 w-14" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="w-16 h-8 rounded-xl shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#FAF9F6]">
      <p className="text-red-500 font-bold text-sm">{error}</p>
      <button onClick={() => navigate('/dashboard')}
        className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
        Kembali
      </button>
    </div>
  )

  const completed = path?.levels?.filter((l) => l.status === 'completed').length || 0
  const total     = path?.levels?.length || 0
  const progress  = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-extrabold text-black mb-6 border-2 border-black bg-white px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        {/* Header Card */}
        <div className="rounded-2xl bg-black border-2 border-black p-6 mb-6 shadow-[6px_6px_0px_#555] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#58CC02] border-2 border-white flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#fff]">
              <Languages className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-white">{path?.language_name}</h1>
                <span className="text-xs font-extrabold bg-yellow-300 text-black px-2 py-0.5 rounded-full border border-black capitalize">
                  {path?.base_level}
                </span>
              </div>
              <p className="text-gray-400 font-medium text-sm">{completed} dari {total} level selesai</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-white">{progress}%</p>
              <p className="text-gray-400 text-xs font-bold">Progress</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="relative mt-4 h-4 bg-white/10 border-2 border-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#58CC02] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Completion Banner */}
        {progress === 100 && (
          <div className="mb-6 rounded-2xl border-2 border-black bg-yellow-300 shadow-[4px_4px_0px_#000] p-5 flex items-center gap-4">
            <PartyPopper className="w-8 h-8 text-black shrink-0" />
            <div className="flex-1">
              <p className="font-extrabold text-black text-base">🎉 Semua level selesai!</p>
              <p className="text-sm font-bold text-black/70 mt-0.5">
                Kamu telah menyelesaikan semua level di jalur ini. Coba bahasa atau level baru!
              </p>
            </div>
            <button
              onClick={() => navigate('/language-select')}
              className="shrink-0 text-xs font-extrabold px-4 py-2 rounded-xl bg-black text-white border-2 border-black shadow-[2px_2px_0px_#555] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              Jalur Baru
            </button>
          </div>
        )}

        {/* Levels */}
        <div className="flex flex-col gap-2">
          {path?.levels?.map((level, idx) => {
            const cfg      = STATUS_CONFIG[level.status]
            const Icon     = cfg.icon
            const isActive = level.status === 'unlocked'

            return (
              <div key={level.id} className="flex items-start gap-3">
                {/* Connector */}
                <div className="flex flex-col items-center pt-3 shrink-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', cfg.dotBg)}>
                    <Icon className={cn('w-4 h-4', cfg.iconColor)} />
                  </div>
                  {idx < path.levels.length - 1 && (
                    <div className={cn('w-0.5 h-8 mt-1', level.status === 'completed' ? 'bg-violet-300' : 'bg-black/10')} />
                  )}
                </div>

                {/* Level Card */}
                <div
                  className={cn(
                    'group flex-1 mb-2 bg-white rounded-2xl border-2 border-black p-4 transition-all duration-150',
                    level.status === 'locked'
                      ? 'opacity-40 cursor-not-allowed shadow-none'
                      : 'shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] cursor-pointer'
                  )}
                  onClick={() => (isActive || level.status === 'completed') && navigate(`/quiz/${level.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Level {level.order_index}</span>
                        {level.status === 'unlocked' && (
                          <span className="text-xs font-extrabold bg-[#58CC02] text-white px-2 py-0.5 rounded-full border border-black">Siap Dimulai</span>
                        )}
                        {level.status === 'completed' && (
                          <span className="text-xs font-extrabold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-black">Selesai</span>
                        )}
                        {level.status === 'completed' && (
                          <span className="flex items-center gap-0.5 text-xs font-extrabold text-yellow-600">
                            <Star className="w-3 h-3 fill-yellow-400" />+{10 * 5} XP
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-black">{level.title}</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5 line-clamp-1">{level.description}</p>
                    </div>

                    {isActive && (
                      <button className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-[#58CC02] text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                        Mulai
                      </button>
                    )}
                    {level.status === 'completed' && (
                      <button className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                        Ulangi
                      </button>
                    )}
                    {level.status === 'locked' && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-black/20 flex items-center justify-center shrink-0">
                        <Lock className="w-3 h-3 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
