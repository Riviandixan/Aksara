import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle,
  Zap, Clock, BookOpen, FolderOpen, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { historyService } from '@/services/history.service'

const LANG_FLAG = { en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', fr: '🇫🇷', de: '🇩🇪' }

function fmtTime(s) {
  if (!s) return null
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
function fmtDate(iso) {
  const d = new Date(typeof iso === 'string' && !iso.endsWith('Z') ? iso + 'Z' : iso)
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function QuestionReview({ answer, index }) {
  const data    = answer.question_data
  const preview = data.question || data.sentence || (data.words?.join(' ')) || '—'

  const TYPE_COLORS = {
    multiple_choice: 'bg-blue-100 text-black',
    translate:       'bg-violet-100 text-black',
    word_arrange:    'bg-yellow-100 text-black',
  }
  const TYPE_LABELS = {
    multiple_choice: 'Pilihan Ganda',
    translate:       'Terjemahkan',
    word_arrange:    'Susun Kata',
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl border-2 border-black p-5 shadow-[3px_3px_0px_#000]',
      answer.is_correct ? 'border-l-4 border-l-[#58CC02]' : 'border-l-4 border-l-red-400'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shrink-0 mt-0.5',
          answer.is_correct ? 'bg-[#58CC02]' : 'bg-red-400'
        )}>
          {answer.is_correct
            ? <CheckCircle2 className="w-4 h-4 text-white" />
            : <XCircle className="w-4 h-4 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-gray-400">Soal {index + 1}</span>
            <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full border-2 border-black', TYPE_COLORS[answer.question_type])}>
              {TYPE_LABELS[answer.question_type]}
            </span>
          </div>

          <p className="text-sm font-bold text-black mb-3 leading-relaxed">{preview}</p>

          {/* MC options */}
          {answer.question_type === 'multiple_choice' && data.options && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.options.map((opt) => (
                <span key={opt} className={cn(
                  'text-xs font-extrabold px-3 py-1.5 rounded-lg border-2 border-black',
                  opt === answer.correct_answer
                    ? 'bg-[#58CC02] text-white shadow-[2px_2px_0px_#000]'
                    : opt === answer.user_answer && !answer.is_correct
                      ? 'bg-red-400 text-white shadow-[2px_2px_0px_#000]'
                      : 'bg-gray-50 text-gray-400 shadow-[1px_1px_0px_#000]'
                )}>
                  {opt}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5 mt-1 bg-gray-50 rounded-xl border-2 border-black/10 p-3">
            <div className="flex items-start gap-2">
              <span className="text-xs font-extrabold text-gray-400 w-28 shrink-0 pt-0.5">Jawabanmu:</span>
              <span className={cn('text-xs font-bold', answer.is_correct ? 'text-[#58CC02]' : 'text-red-500')}>
                {answer.user_answer || <span className="italic text-gray-300">Tidak dijawab</span>}
              </span>
            </div>
            {!answer.is_correct && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-extrabold text-gray-400 w-28 shrink-0 pt-0.5">Jawaban benar:</span>
                <span className="text-xs font-extrabold text-[#58CC02]">{answer.correct_answer}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HistoryDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    historyService.detail(id)
      .then((res) => setSession(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat detail'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#FAF9F6]">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-4 py-20 bg-[#FAF9F6] h-full justify-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-bold text-red-500">{error}</p>
      <button onClick={() => navigate('/history')}
        className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
        Kembali
      </button>
    </div>
  )

  const isPackage  = session.source_type === 'quiz_package'
  const passed     = session.score >= (isPackage ? 60 : 70)
  const SourceIcon = isPackage ? FolderOpen : BookOpen

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-sm font-extrabold text-black mb-6 border-2 border-black bg-white px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Riwayat
        </button>

        {/* Session summary card */}
        <div className={cn(
          'rounded-2xl border-2 border-black p-6 mb-6 flex items-center gap-5 shadow-[4px_4px_0px_#000]',
          passed ? 'bg-[#58CC02]' : 'bg-orange-400'
        )}>
          <div className="w-20 h-20 rounded-full bg-white border-2 border-black flex flex-col items-center justify-center shrink-0 shadow-[3px_3px_0px_#000]">
            <p className="text-3xl font-extrabold text-black">{session.score}%</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SourceIcon className="w-4 h-4 text-white/80 shrink-0" />
              <p className="text-white font-extrabold truncate">{session.source_name}</p>
              <span className="text-lg shrink-0">{LANG_FLAG[session.language_code] || '🌐'}</span>
            </div>
            <p className="text-white/90 font-bold text-sm">{session.correct} dari {session.total} jawaban benar</p>
            <p className="text-white/70 font-medium text-xs mt-1">{fmtDate(session.played_at)}</p>
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1 shadow-[2px_2px_0px_#000]">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-black text-xs font-extrabold">+{session.xp_earned} XP</span>
              </div>
              {session.time_taken && (
                <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1 shadow-[2px_2px_0px_#000]">
                  <Clock className="w-3.5 h-3.5 text-black" />
                  <span className="text-black text-xs font-extrabold">{fmtTime(session.time_taken)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-question review */}
        {session.answers?.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h3 className="font-extrabold text-black text-lg">Review Soal</h3>
            {session.answers.map((a, i) => (
              <QuestionReview key={i} answer={a} index={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-12 text-center">
            <p className="text-sm font-bold text-gray-400">Detail jawaban tidak tersedia untuk sesi ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
