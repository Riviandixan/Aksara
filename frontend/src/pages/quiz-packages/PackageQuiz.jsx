import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, X, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Zap, Trophy, RotateCcw, FolderOpen, AlertCircle, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { packageService } from '@/services/package.service'
import { useAuth } from '@/hooks/useAuth'
import { useStreakToast, StreakToast } from '@/components/StreakToast'

function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    ref.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(ref.current)
  }, [])
  const stop = () => clearInterval(ref.current)
  const fmt  = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return { seconds, fmt, stop }
}

// ── Question components ───────────────────────────────────────
function MultipleChoice({ data, answer, onAnswer, locked }) {
  const labels = ['A', 'B', 'C', 'D']
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-extrabold text-black leading-relaxed mb-2">{data.question}</p>
      {data.options.map((opt, i) => {
        const isSelected = answer === opt
        return (
          <button key={opt} disabled={locked} onClick={() => onAnswer(opt)}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 flex items-center gap-3',
              !isSelected && 'border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]',
              isSelected  && 'border-black bg-[#58CC02] text-white shadow-none translate-x-[2px] translate-y-[2px]',
              locked && 'cursor-default',
            )}>
            <span className={cn(
              'w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-extrabold shrink-0',
              isSelected ? 'bg-white text-black' : 'bg-gray-100 text-black'
            )}>{labels[i] || i + 1}</span>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function Translate({ data, answer, onAnswer, locked }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-yellow-50 border-2 border-black rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000]">
        <p className="text-xs font-extrabold text-black/50 uppercase tracking-wide mb-1">Terjemahkan kalimat ini:</p>
        <p className="text-xl font-extrabold text-black">{data.sentence}</p>
      </div>
      <textarea disabled={locked} value={answer || ''} onChange={(e) => onAnswer(e.target.value)}
        placeholder="Ketik terjemahanmu di sini..." rows={3}
        className="w-full px-4 py-3 rounded-xl border-2 border-black text-sm font-medium resize-none outline-none bg-white shadow-[3px_3px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_#000] disabled:bg-gray-50 disabled:cursor-default transition-all" />
    </div>
  )
}

function WordArrange({ data, answer, onAnswer, locked }) {
  const [usedIdx, setUsedIdx] = useState([])
  const selected  = answer ? answer.split(' ').filter(Boolean) : []
  const available = data.words.map((w, i) => ({ w, i })).filter(({ i }) => !usedIdx.includes(i))

  const addWord = (word, idx) => {
    if (locked) return
    setUsedIdx((p) => [...p, idx])
    onAnswer([...selected, word].join(' '))
  }
  const removeWord = (pos) => {
    if (locked) return
    const newSel = selected.filter((_, i) => i !== pos)
    setUsedIdx((p) => p.filter((_, i) => i !== pos))
    onAnswer(newSel.join(' '))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-extrabold text-black">Susun kata-kata berikut menjadi kalimat yang benar:</p>
      <div className="min-h-[56px] flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed border-black bg-gray-50">
        {selected.length === 0 && <span className="text-xs font-medium text-gray-400 self-center">Klik kata di bawah untuk menyusun...</span>}
        {selected.map((word, i) => (
          <button key={i} disabled={locked} onClick={() => removeWord(i)}
            className="px-3 py-1.5 bg-black text-white text-sm font-extrabold rounded-lg border-2 border-black hover:bg-gray-800 transition-colors disabled:cursor-default">
            {word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map(({ w, i }) => (
          <button key={i} disabled={locked} onClick={() => addWord(w, i)}
            className="px-3 py-1.5 bg-white border-2 border-black text-sm font-extrabold rounded-lg shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50">
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Evaluation Screen ─────────────────────────────────────────
function EvaluationScreen({ questions, answers, results, timeTaken, onRetry, packageId }) {
  const navigate = useNavigate()
  const correct  = results.filter((r) => r.is_correct).length
  const score    = Math.round((correct / questions.length) * 100)
  const passed   = score >= 60
  const xp       = results.reduce((s, r) => s + (r.is_correct ? 5 : 0), 0)
  const fmt      = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const resultMap = Object.fromEntries(results.map((r) => [r.question_id, r]))

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#FAF9F6]">
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b-2 border-black shrink-0">
        <h2 className="font-extrabold text-black">Hasil Latihan</h2>
        <button onClick={() => navigate(`/quiz-packages/${packageId}`)}
          className="p-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
          <X className="w-5 h-5 text-black" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-5">
        {/* Score card */}
        <div className={cn('rounded-2xl border-2 border-black p-6 flex items-center gap-6 shadow-[4px_4px_0px_#000]',
          passed ? 'bg-[#58CC02]' : 'bg-orange-400')}>
          <div className="w-20 h-20 rounded-full bg-white border-2 border-black flex flex-col items-center justify-center shrink-0 shadow-[3px_3px_0px_#000]">
            <p className="text-3xl font-extrabold text-black">{score}%</p>
          </div>
          <div className="flex-1">
            <p className="text-xl font-extrabold text-white">{passed ? 'Luar Biasa! 🎉' : 'Hampir Berhasil!'}</p>
            <p className="text-white/90 text-sm font-bold mt-1">{correct} dari {questions.length} jawaban benar</p>
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1 shadow-[2px_2px_0px_#000]">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-black text-xs font-extrabold">+{xp} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-3 py-1 shadow-[2px_2px_0px_#000]">
                <Clock className="w-3.5 h-3.5 text-black" />
                <span className="text-black text-xs font-extrabold">{fmt(timeTaken)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Per-question review */}
        <div className="flex flex-col gap-3">
          <h3 className="font-extrabold text-black">Evaluasi Soal</h3>
          {questions.map((q, i) => {
            const data    = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
            const res     = resultMap[q.id]
            const userAns = answers[q.id] || '—'
            const preview = data.question || data.sentence || data.words?.join(' ') || '—'
            return (
              <div key={q.id} className={cn('bg-white rounded-2xl border-2 border-black p-4 shadow-[3px_3px_0px_#000]',
                res?.is_correct ? 'border-l-4 border-l-[#58CC02]' : 'border-l-4 border-l-red-400')}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shrink-0 mt-0.5',
                    res?.is_correct ? 'bg-[#58CC02]' : 'bg-red-400')}>
                    {res?.is_correct
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <XCircle      className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-gray-400 mb-1">Soal {i + 1}</p>
                    <p className="text-sm font-bold text-black mb-2 line-clamp-2">{preview}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-400 w-24 shrink-0">Jawabanmu:</span>
                        <span className={cn('text-xs font-bold', res?.is_correct ? 'text-[#58CC02]' : 'text-red-500')}>{userAns}</span>
                      </div>
                      {!res?.is_correct && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-gray-400 w-24 shrink-0">Jawaban benar:</span>
                          <span className="text-xs font-extrabold text-[#58CC02]">{res?.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-4">
          <button onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
            <RotateCcw className="w-4 h-4" /> Coba Lagi
          </button>
          <button onClick={() => navigate(`/quiz-packages/${packageId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-black text-white shadow-[3px_3px_0px_#555] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#555] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
            <FolderOpen className="w-4 h-4" /> Ke Paket
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function PackageQuiz() {
  const { id }         = useParams()
  const navigate       = useNavigate()
  const { user, updateUser } = useAuth()
  const { seconds, fmt, stop } = useTimer()
  const { toast, showStreakToast, dismiss } = useStreakToast()

  const [questions,  setQuestions]  = useState([])
  const [current,    setCurrent]    = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [result,     setResult]     = useState(null)
  const [timeTaken,  setTimeTaken]  = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const loadQuestions = useCallback(() => {
    setLoading(true)
    packageService.getQuestions(id)
      .then((res) => setQuestions(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat soal'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const q           = questions[current]
  const currentAns  = answers[q?.id] || ''
  const answered    = Object.keys(answers).length
  const allAnswered = answered === questions.length

  const handleAnswer = (val) => setAnswers((p) => ({ ...p, [q.id]: val }))

  const handleSubmit = async () => {
    stop(); setTimeTaken(seconds); setSubmitting(true)
    try {
      const payload = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || '' }))
      const res  = await packageService.submit(id, { answers: payload, time_taken: seconds })
      const data = res.data.data
      updateUser({ xp: data.user.xp, streak: data.user.streak })
      if (data.user.streak > (user?.streak || 0)) showStreakToast(data.user.streak)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal submit jawaban')
    } finally { setSubmitting(false) }
  }

  const handleRetry = () => {
    setAnswers({}); setResult(null); setTimeTaken(0); setCurrent(0); loadQuestions()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#FAF9F6]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p className="text-sm font-bold text-gray-400">Memuat soal...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-4 py-20 bg-[#FAF9F6] h-full justify-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-bold text-red-500">{error}</p>
      <button onClick={() => navigate(`/quiz-packages/${id}`)}
        className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
        Kembali
      </button>
    </div>
  )

  if (result) return (
    <>
      <StreakToast toast={toast} onDismiss={dismiss} />
      <EvaluationScreen questions={questions} answers={answers} results={result.results}
        timeTaken={timeTaken} onRetry={handleRetry} packageId={id} />
    </>
  )

  return (
    <>
      <StreakToast toast={toast} onDismiss={dismiss} />
      <div className="flex flex-col h-full bg-[#FAF9F6]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b-2 border-black bg-white shrink-0">
          <button onClick={() => navigate(`/quiz-packages/${id}`)}
            className="p-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <X className="w-5 h-5 text-black" />
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-yellow-100 border-2 border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_#000]">
            <Clock className="w-4 h-4 text-black" />
            <span className="text-sm font-extrabold text-black tabular-nums">{fmt(seconds)}</span>
          </div>

          {/* Progress + Submit */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 h-3 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                <div className="h-full bg-[#58CC02] rounded-full transition-all"
                  style={{ width: `${(answered / questions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-extrabold text-black">{answered}/{questions.length}</span>
            </div>
            <button disabled={submitting} onClick={handleSubmit}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-extrabold border-2 border-black transition-all duration-150',
                allAnswered
                  ? 'bg-[#58CC02] text-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                  : 'bg-gray-100 text-gray-400 cursor-default shadow-none'
              )}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Selesai Test'}
            </button>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#555]">
                <span className="text-xs font-extrabold text-white">{current + 1}</span>
              </div>
              <span className={cn('text-sm font-extrabold px-3 py-1 rounded-full border-2 border-black',
                q?.type === 'multiple_choice' && 'bg-blue-100 text-black',
                q?.type === 'translate'       && 'bg-violet-100 text-black',
                q?.type === 'word_arrange'    && 'bg-yellow-100 text-black',
              )}>
                {q?.type === 'multiple_choice' && 'Multiple Choice'}
                {q?.type === 'translate'       && 'Terjemahkan'}
                {q?.type === 'word_arrange'    && 'Susun Kata'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
              {q?.type === 'multiple_choice' && <MultipleChoice data={q.question_data} answer={currentAns} onAnswer={handleAnswer} locked={false} />}
              {q?.type === 'translate'       && <Translate      data={q.question_data} answer={currentAns} onAnswer={handleAnswer} locked={false} />}
              {q?.type === 'word_arrange'    && <WordArrange     data={q.question_data} answer={currentAns} onAnswer={handleAnswer} locked={false} />}
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="shrink-0 border-t-2 border-black bg-white px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
              className="p-2 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-30 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all">
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm">
              {questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrent(i)}
                  className={cn(
                    'w-8 h-8 rounded-full text-xs font-extrabold border-2 border-black transition-all shrink-0',
                    i === current    ? 'bg-black text-white shadow-none scale-110'
                    : answers[q.id] ? 'bg-[#58CC02] text-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                                    : 'bg-white text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                  )}>
                  {i + 1}
                </button>
              ))}
            </div>

            <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}
              className="p-2 rounded-full border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-30 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all">
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
