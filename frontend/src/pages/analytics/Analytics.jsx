import { useState, useEffect } from 'react'
import {
  BarChart2, CheckCircle2, TrendingUp, Target,
  Clock, HelpCircle, Globe,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import { analyticsService } from '@/services/analytics.service'
import { Skeleton } from '@/components/Skeleton'

const LANG_LABELS = { en: 'English', ja: 'Japanese', ko: 'Korean', fr: 'French', de: 'German', zh: 'Chinese', ru: 'Russian', es: 'Spanish' }
const TYPE_LABELS = { multiple_choice: 'Pilihan Ganda', translate: 'Terjemahan', word_arrange: 'Susun Kata' }
const BAR_COLORS = ['#58CC02', '#FFD700', '#FF6B6B', '#7C3AED', '#3B82F6', '#F97316', '#06B6D4', '#EC4899']

function fmtTime(s) {
  if (!s) return '00:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className={cn('rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-4 flex flex-col gap-2', bg)}>
      <div className="w-9 h-9 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
      <p className="text-2xl font-extrabold text-black leading-none">{value}</p>
      <p className="text-[10px] font-bold text-black/60 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-extrabold text-black/50 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-[2px] bg-black/10 rounded-full" />
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService.get()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-4 flex flex-col gap-2 bg-white">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 mb-8">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </div>
        {/* Bar charts skeleton */}
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ))}
        </div>
        {/* Weekly skeleton */}
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="w-full aspect-square rounded-xl" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const { summary, scoreTrend, perLanguage, perType, weeklyActivity } = data

  const trendData = scoreTrend.map((d) => ({
    date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    score: d.avg_score,
  }))

  const langData = perLanguage.map((d) => ({
    name: LANG_LABELS[d.language_code] || d.language_code,
    score: d.avg_score,
    sessions: d.sessions,
  }))

  const typeData = perType.map((d) => ({
    name: TYPE_LABELS[d.type] || d.type,
    accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
    total: d.total,
  }))

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Analitik</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Pantau perkembangan dan identifikasi area untuk ditingkatkan</p>
        </div>

        {/* Ringkasan */}
        <SectionTitle>Ringkasan</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard icon={BarChart2}     label="Total Latihan"  value={summary.total_sessions}  bg="bg-violet-100" iconColor="text-violet-600" />
          <StatCard icon={CheckCircle2}  label="Selesai"        value={summary.passed_sessions} bg="bg-green-100"  iconColor="text-green-600" />
          <StatCard icon={TrendingUp}    label="Rata-rata Skor" value={`${summary.avg_score}%`} bg="bg-blue-100"   iconColor="text-blue-600" />
          <StatCard icon={Target}        label="Akurasi"        value={`${summary.accuracy}%`}  bg="bg-yellow-100" iconColor="text-yellow-600" />
          <StatCard icon={Clock}         label="Waktu Total"    value={fmtTime(summary.total_time)} bg="bg-cyan-100" iconColor="text-cyan-600" />
          <StatCard icon={HelpCircle}    label="Soal Dijawab"   value={summary.total_questions} bg="bg-rose-100"   iconColor="text-rose-600" />
        </div>

        {/* Tren Skor */}
        <SectionTitle>Tren Skor</SectionTitle>
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 mb-8">
          <p className="font-extrabold text-black mb-4">Tren Skor (30 Hari)</p>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium text-center py-12">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Skor']} />
                <Line type="monotone" dataKey="score" stroke="#58CC02" strokeWidth={3} dot={{ r: 4, fill: '#58CC02' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performa */}
        <SectionTitle>Performa</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Per Bahasa */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <p className="font-extrabold text-black mb-4">Performa per Bahasa</p>
            {langData.length === 0 ? (
              <p className="text-sm text-gray-400 font-medium text-center py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={langData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} width={80} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Skor']} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {langData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per Jenis Soal */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <p className="font-extrabold text-black mb-4">Performa per Jenis Soal</p>
            {typeData.length === 0 ? (
              <p className="text-sm text-gray-400 font-medium text-center py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} width={100} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Akurasi']} />
                  <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                    {typeData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Aktivitas Mingguan */}
        <SectionTitle>Aktivitas Minggu Ini</SectionTitle>
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
          {weeklyActivity.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium text-center py-8">Belum ada aktivitas minggu ini</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weeklyActivity.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-full aspect-square rounded-xl border-2 border-black flex items-center justify-center font-extrabold text-lg',
                    d.sessions > 0 ? 'bg-[#58CC02] text-white shadow-[2px_2px_0px_#000]' : 'bg-gray-100 text-gray-300'
                  )}>
                    {d.sessions}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">
                    {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
