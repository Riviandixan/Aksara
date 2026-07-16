import { useState, useEffect } from 'react'
import { Flame, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'
import { Skeleton } from '@/components/Skeleton'

const RANK_CONFIG = {
  1: { emoji: '🥇', podiumBg: 'bg-yellow-300', height: 80 },
  2: { emoji: '🥈', podiumBg: 'bg-slate-200',  height: 60 },
  3: { emoji: '🥉', podiumBg: 'bg-orange-200', height: 48 },
}

// ── Podium card (rank 1, 2, 3) ────────────────────────────────
function PodiumCard({ entry }) {
  const cfg = RANK_CONFIG[entry.rank]
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      {/* Avatar */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-black shadow-[3px_3px_0px_#000] shrink-0">
        <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-base leading-none">{cfg.emoji}</span>
      </div>
      <p className={cn('text-xs font-extrabold truncate max-w-[80px] text-center mt-1', entry.isMe ? 'text-[#58CC02]' : 'text-black')}>
        {entry.username}{entry.isMe && ' 👈'}
      </p>
      <div className="flex items-center gap-0.5 bg-yellow-100 border border-black rounded-full px-2 py-0.5">
        <Zap className="w-3 h-3 text-yellow-500" />
        <span className="text-xs font-extrabold text-black">{entry.xp.toLocaleString()}</span>
      </div>
      {/* Podium block */}
      <div
        className={cn('w-full rounded-t-xl border-2 border-black border-b-0 flex items-center justify-center font-black text-2xl text-black shadow-[3px_0px_0px_#000]', cfg.podiumBg)}
        style={{ height: cfg.height }}
      >
        {entry.rank}
      </div>
    </div>
  )
}

// ── Regular row (rank 4–10) ───────────────────────────────────
function LeaderRow({ entry }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-150',
      entry.isMe
        ? 'bg-green-100 border-black shadow-[3px_3px_0px_#000]'
        : 'border-transparent hover:border-black hover:bg-white hover:shadow-[2px_2px_0px_#000]',
      entry.outOfTop && 'border-dashed border-black'
    )}>
      {/* Rank */}
      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
        <span className="text-xs font-extrabold text-black">{entry.rank}</span>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-black shrink-0 shadow-[2px_2px_0px_#000]">
        <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-extrabold truncate', entry.isMe ? 'text-[#58CC02]' : 'text-black')}>
          {entry.username}
          {entry.isMe && <span className="ml-2 text-[10px] font-extrabold bg-[#58CC02] text-white px-1.5 py-0.5 rounded-full border border-black">Kamu</span>}
        </p>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 bg-orange-100 border border-black rounded-full px-2 py-0.5 shrink-0">
        <Flame className="w-3 h-3 text-orange-500" />
        <span className="text-xs font-extrabold text-black">{entry.streak}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 bg-yellow-100 border border-black rounded-full px-2 py-0.5 shrink-0">
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-sm font-extrabold text-black">{entry.xp.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const { user }              = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leaderboard')
      .then((res) => setEntries(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const top3       = entries.filter((e) => !e.outOfTop && e.rank <= 3)
  const rest       = entries.filter((e) => !e.outOfTop && e.rank > 3)
  const myOutOfTop = entries.find((e) => e.outOfTop)

  const podiumOrder = [top3.find(e => e.rank === 2), top3.find(e => e.rank === 1), top3.find(e => e.rank === 3)].filter(Boolean)

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-6 py-8 w-full max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-black">Papan Peringkat</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Top 10 pelajar paling rajin</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-5">
            {/* Podium skeleton */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
              <Skeleton className="h-3 w-20 mx-auto mb-6" />
              <div className="flex items-end gap-3 px-2">
                {[60, 80, 48].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="w-full rounded-t-xl" style={{ height: h }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Rows skeleton */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
              <Skeleton className="h-10 w-full rounded-none" />
              <div className="flex flex-col gap-1 p-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <Skeleton className="flex-1 h-4" />
                    <Skeleton className="w-14 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Podium top 3 ── */}
            {podiumOrder.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
                <p className="text-xs font-extrabold text-black/40 uppercase tracking-widest text-center mb-4">🏆 Top 3</p>
                <div className="flex items-end gap-3 px-2">
                  {podiumOrder.map((e) => (
                    <PodiumCard key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Rank 4–10 ── */}
            {rest.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
                <div className="px-5 py-3 border-b-2 border-black bg-blue-100">
                  <p className="text-xs font-extrabold text-black uppercase tracking-widest">Rank 4 – 10</p>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  {rest.map((e) => <LeaderRow key={e.id} entry={e} />)}
                </div>
              </div>
            )}

            {/* ── User di luar top 10 ── */}
            {myOutOfTop && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t-2 border-dashed border-black/30" />
                  <span className="text-xs font-extrabold text-black/40 uppercase tracking-widest">posisimu</span>
                  <div className="flex-1 border-t-2 border-dashed border-black/30" />
                </div>
                <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-3">
                  <LeaderRow entry={myOutOfTop} />
                </div>
                <p className="text-center text-xs font-extrabold text-gray-400">Terus belajar untuk masuk Top 10! 🚀</p>
              </div>
            )}

            {entries.length === 0 && (
              <p className="text-center text-sm font-bold text-gray-400 py-12">Belum ada data</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
