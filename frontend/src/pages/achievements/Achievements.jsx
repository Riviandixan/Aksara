import { useState, useEffect } from 'react'
import {
  Medal, Zap, BatteryMedium, BatteryFull, Crown,
  Flame, CalendarCheck, Trophy, MapPin, BookOpen, Map,
  ClipboardList, GraduationCap, Swords, Shield, Globe, Globe2, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { achievementService } from '@/services/achievement.service'
import { Skeleton } from '@/components/Skeleton'

// Map nama icon string (dari DB) ke komponen Lucide
const ICON_MAP = {
  Zap, BatteryMedium, BatteryFull, Crown,
  Flame, CalendarCheck, Trophy, MapPin, BookOpen, Map,
  ClipboardList, GraduationCap, Swords, Medal, Shield, Globe, Globe2,
}

const CATEGORY_LABEL = {
  xp:       { label: 'XP',     bg: 'bg-yellow-100', border: 'border-yellow-400', iconColor: 'text-yellow-600' },
  streak:   { label: 'Streak', bg: 'bg-orange-100', border: 'border-orange-400', iconColor: 'text-orange-500' },
  level:    { label: 'Level',  bg: 'bg-violet-100', border: 'border-violet-400', iconColor: 'text-violet-600' },
  exam:     { label: 'Ujian',  bg: 'bg-blue-100',   border: 'border-blue-400',   iconColor: 'text-blue-600'   },
  battle:   { label: 'Battle', bg: 'bg-red-100',    border: 'border-red-400',    iconColor: 'text-red-500'    },
  language: { label: 'Bahasa', bg: 'bg-green-100',  border: 'border-green-400',  iconColor: 'text-green-600'  },
}

const CATEGORIES = Object.keys(CATEGORY_LABEL)

function BadgeCard({ ach }) {
  const cat     = CATEGORY_LABEL[ach.category]
  const AchIcon = ICON_MAP[ach.icon] ?? Medal

  return (
    <div className={cn(
      'relative rounded-2xl border-2 border-black p-4 flex flex-col items-center gap-2 text-center transition-all',
      ach.unlocked
        ? `${cat.bg} shadow-[4px_4px_0px_#000]`
        : 'bg-gray-100 opacity-50 shadow-[2px_2px_0px_#000]'
    )}>
      {ach.unlocked && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#58CC02] border-2 border-black" />
      )}
      <div className={cn(
        'w-14 h-14 rounded-2xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]',
        ach.unlocked ? 'bg-white' : 'bg-gray-200'
      )}>
        {ach.unlocked
          ? <AchIcon className={cn('w-7 h-7', cat.iconColor)} />
          : <Lock className="w-6 h-6 text-gray-400" />
        }
      </div>
      <p className="font-extrabold text-black text-sm leading-tight">{ach.title}</p>
      <p className="text-[11px] font-medium text-black/60 leading-snug">{ach.description}</p>
      {ach.unlocked && ach.unlocked_at && (
        <p className="text-[10px] font-bold text-black/40">
          {new Date(ach.unlocked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-xs font-extrabold text-black/50 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-[2px] bg-black/10 rounded-full" />
    </div>
  )
}

export default function Achievements() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    achievementService.getAll()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const unlocked = data.filter((a) => a.unlocked).length

  if (loading) return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-4xl mx-auto">
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Pencapaian</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            {unlocked} dari {data.length} badge berhasil diraih
          </p>
        </div>

        {/* Progress bar total */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] shrink-0">
            <Medal className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <p className="text-sm font-extrabold text-black">Total Badge</p>
              <p className="text-sm font-extrabold text-black">{unlocked}/{data.length}</p>
            </div>
            <div className="h-4 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
                style={{ width: `${data.length ? Math.round((unlocked / data.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per kategori */}
        {CATEGORIES.map((cat) => {
          const items   = data.filter((a) => a.category === cat)
          if (!items.length) return null
          const catInfo = CATEGORY_LABEL[cat]
          return (
            <div key={cat} className="mb-8">
              <SectionTitle>
                <span className={cn('px-2 py-0.5 rounded-md border-2 border-black text-[10px]', catInfo.bg, catInfo.border)}>
                  {catInfo.label}
                </span>
              </SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((ach) => <BadgeCard key={ach.id} ach={ach} />)}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
