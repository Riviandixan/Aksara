import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, ChevronRight,
  Zap, Trophy, RotateCcw, Home, Sparkles, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { quizService } from '@/services/quiz.service'
import { useAuth } from '@/hooks/useAuth'
import { useStreakToast, StreakToast } from '@/components/StreakToast'

// ── Multiple Choice ───────────────────────────────────────────
function MultipleChoice({ data, answer, onAnswer, submitted, correct }) {
  const userIsCorrect = submitted && answer?.toLowerCase() === correct?.toLowerCase()
  const labels = ['A', 'B', 'C', 'D']

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-extrabold text-black mb-2">{data.question}</p>
      {(data.options || []).map((opt, i) => {
        const isSelected = answer === opt
        const isCorrect  = submitted && opt.toLowerCase() === correct?.toLowerCase()
        const isWrong    = submitted && isSelected && !isCorrect

        return (
          <button key={`${i}-${opt}`} disabled={submitted} onClick={() => onAnswer(opt)}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 flex items-center gap-3',
              !submitted && !isSelected && 'border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]',
              !submitted && isSelected  && 'border-black bg-violet-400 text-white shadow-none translate-x-[2px] translate-y-[2px]',
              submitted  && isCorrect   && 'border-black bg-[#58CC02] text-white shadow-none',
              submitted  && isWrong     && 'border-black bg-red-400 text-white shadow-none',
              submitted  && !isSelected && !isCorrect && 'border-black/20 bg-gray-50 text-gray-300 shadow-none opacity-50',
              submitted && 'cursor-default',
            )}>
            <span className={cn(
              'w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-extrabold shrink-0',
              (isCorrect || (!submitted && isSelected)) ? 'bg-white text-black' : 'bg-gray-100 text-black'
            )}>{labels[i] || i + 1}</span>
            <span className="flex-1">{opt}</span>
            {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
            {submitted && isWrong   && <XCircle      className="w-4 h-4 text-white shrink-0" />}
          </button>
        )
      })}
      {submitted && (
        <div className={cn(
          'flex items-start gap-2 px-4 py-3 rounded-xl border-2 border-black text-sm font-bold shadow-[2px_2px_0px_#000]',
          userIsCorrect ? 'bg-[#58CC02] text-white' : 'bg-red-400 text-white'
        )}>
          {userIsCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{userIsCorrect ? 'Benar! 🎉' : <>Jawaban benar: <strong>{correct}</strong></>}</span>
        </div>
      )}
    </div>
  )
}

// ── Translate ─────────────────────────────────────────────────
function Translate({ data, answer, onAnswer, submitted, correct }) {
  const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '')
  const isCorrect = submitted && normalize(answer) === normalize(correct)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-yellow-50 border-2 border-black rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000]">
        <p className="text-xs font-extrabold text-black/50 uppercase tracking-wide mb-1">Terjemahkan kalimat ini:</p>
        <p className="text-lg font-extrabold text-black">{data.sentence}</p>
      </div>
      <textarea disabled={submitted} value={answer || ''} onChange={(e) => onAnswer(e.target.value)}
        placeholder="Ketik terjemahanmu di sini..." rows={3}
        className={cn(
          'w-full px-4 py-3 rounded-xl border-2 text-sm font-medium resize-none outline-none transition-all duration-150',
          !submitted && 'border-black bg-white shadow-[3px_3px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_#000]',
          submitted && isCorrect  && 'border-black bg-[#58CC02] text-white shadow-none cursor-default',
          submitted && !isCorrect && 'border-black bg-red-100 text-red-700 shadow-none cursor-default',
        )} />
      {submitted && (
        <div className={cn(
          'flex items-start gap-2 px-4 py-3 rounded-xl border-2 border-black text-sm font-bold shadow-[2px_2px_0px_#000]',
          isCorrect ? 'bg-[#58CC02] text-white' : 'bg-red-400 text-white'
        )}>
          {isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{isCorrect ? 'Benar! 🎉' : <>Jawaban benar: <strong>{correct}</strong></>}</span>
        </div>
      )}
    </div>
  )
}

// ── Word Arrange ──────────────────────────────────────────────
function WordArrange({ data, answer, onAnswer, submitted, correct }) {
  const [usedIdx, setUsedIdx] = useState([])
  const selected       = answer ? answer.split(' ').filter(Boolean) : []
  const availableWords = data.words.map((w, i) => ({ w, i })).filter(({ i }) => !usedIdx.includes(i))
  const normalize      = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '')
  const isCorrect      = submitted && normalize(answer) === normalize(correct)

  const addWord = (word, idx) => {
    if (submitted) return
    setUsedIdx((prev) => [...prev, idx])
    onAnswer([...selected, word].join(' '))
  }
  const removeWord = (pos) => {
    if (submitted) return
    const newSelected = selected.filter((_, i) => i !== pos)
    setUsedIdx((prev) => prev.filter((_, i) => i !== pos))
    onAnswer(newSelected.join(' '))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-extrabold text-black">Susun kata-kata berikut menjadi kalimat yang benar:</p>
      <div className={cn(
        'min-h-[56px] flex flex-wrap gap-2 p-3 rounded-xl border-2 transition-all',
        !submitted && 'border-dashed border-black bg-gray-50',
        submitted && isCorrect  && 'border-black bg-[#58CC02]',
        submitted && !isCorrect && 'border-black bg-red-100',
      )}>
        {selected.length === 0 && <span className="text-xs font-medium text-gray-400 self-center">Klik kata di bawah untuk menyusun...</span>}
        {selected.map((word, i) => (
          <button key={i} disabled={submitted} onClick={() => removeWord(i)}
            className="px-3 py-1.5 bg-black text-white text-sm font-extrabold rounded-lg border-2 border-black hover:bg-gray-800 transition-colors disabled:cursor-default">
            {word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableWords.map(({ w, i }) => (
          <button key={i} disabled={submitted} onClick={() => addWord(w, i)}
            className="px-3 py-1.5 bg-white border-2 border-black text-sm font-extrabold rounded-lg shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-default">
            {w}
          </button>
        ))}
      </div>
      {submitted && (
        <div className={cn(
          'flex items-start gap-2 px-4 py-3 rounded-xl border-2 border-black text-sm font-bold shadow-[2px_2px_0px_#000]',
          isCorrect ? 'bg-[#58CC02] text-white' : 'bg-red-400 text-white'
        )}>
          {isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{isCorrect ? 'Benar! 🎉' : <>Jawaban benar: <strong>{correct}</strong></>}</span>
        </div>
      )}
    </div>
  )
}

// ── Result Screen ─────────────────────────────────────────────
function ResultScreen({ result, onRetry, onContinue }) {
  const navigate = useNavigate()
  const { score, correct, total, xp_earned, passed, next_level_unlocked, all_completed } = result

  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className={cn(
        'w-32 h-32 rounded-full border-2 border-black flex flex-col items-center justify-center shadow-[6px_6px_0px_#000]',
        passed ? 'bg-[#58CC02]' : 'bg-orange-400'
      )}>
        <p className="text-4xl font-extrabold text-white">{score}%</p>
        <p className="text-xs text-white/80 font-extrabold">Skor</p>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-black">{passed ? 'Luar Biasa! 🎉' : 'Hampir Berhasil!'}</h2>
        <p className="text-gray-500 font-medium text-sm mt-1">{correct} dari {total} jawaban benar</p>
      </div>

      <div className="flex gap-4 w-full">
        <div className="flex-1 bg-yellow-100 border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-extrabold text-black">XP Didapat</span>
          </div>
          <p className="text-2xl font-extrabold text-black">+{xp_earned}</p>
        </div>
        <div className={cn('flex-1 rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_#000]',
          passed ? 'bg-green-100' : 'bg-red-100')}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Status</span>
          </div>
          <p className="text-lg font-extrabold text-black">{passed ? 'Lulus ✓' : 'Belum Lulus'}</p>
        </div>
      </div>

      {all_completed && (
        <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black rounded-xl px-4 py-3 w-full shadow-[3px_3px_0px_#000]">
          <span className="text-lg">🎊</span>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-black">Semua level selesai!</p>
            <p className="text-xs font-bold text-black/70">Coba jalur belajar baru untuk terus berkembang</p>
          </div>
        </div>
      )}
      {next_level_unlocked && !all_completed && (
        <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black rounded-xl px-4 py-3 w-full shadow-[3px_3px_0px_#000]">
          <Sparkles className="w-4 h-4 text-black shrink-0" />
          <p className="text-sm font-extrabold text-black">Level berikutnya telah terbuka! 🔓</p>
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
          <RotateCcw className="w-4 h-4" /> Coba Lagi
        </button>
        {all_completed ? (
          <button onClick={() => navigate('/language-select')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-[#58CC02] text-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
            <Sparkles className="w-4 h-4" /> Jalur Baru
          </button>
        ) : (
          <button onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-black text-white shadow-[3px_3px_0px_#555] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#555] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
            <Home className="w-4 h-4" /> Ke Jalur Belajar
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Quiz Page ────────────────────────────────────────────
export default function Quiz() {
  const { levelId } = useParams()
  const navigate    = useNavigate()
  const { user, updateUser } = useAuth()
  const { toast, showStreakToast, dismiss } = useStreakToast()

  const [total,      setTotal]      = useState(0)
  const [current,    setCurrent]    = useState(1)   // order_index, mulai dari 1
  const [quiz,       setQuiz]       = useState(null) // soal saat ini saja
  const [answers,    setAnswers]    = useState({})   // { [quiz_id]: answer }
  const [submitted,  setSubmitted]  = useState(false)
  const [correct,    setCorrect]    = useState(null) // correct_answer soal saat ini
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [checking,   setChecking]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  // Load soal pertama (sekaligus generate jika belum ada)
  useEffect(() => {
    quizService.getQuizzes(levelId)
      .then((res) => {
        const { total, first_question } = res.data.data
        setTotal(total)
        setQuiz(first_question)
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat soal'))
      .finally(() => setLoading(false))
  }, [levelId])

  const progress   = total ? (current / total) * 100 : 0
  const currentAns = quiz ? (answers[quiz.id] || '') : ''

  const handleAnswer = useCallback((val) => {
    if (submitted || !quiz) return
    setAnswers((prev) => ({ ...prev, [quiz.id]: val }))
  }, [quiz, submitted])

  const handleCheck = async () => {
    if (!currentAns.trim() || checking) return
    setChecking(true)
    try {
      const res = await quizService.check(levelId, quiz.id, currentAns)
      const { correct_answer } = res.data.data
      setSubmitted(true)
      setCorrect(correct_answer)
    } catch {
      setError('Gagal memeriksa jawaban')
    } finally {
      setChecking(false)
    }
  }

  const handleNext = async () => {
    setSubmitted(false)
    setCorrect(null)

    if (current < total) {
      // Fetch soal berikutnya dari server
      const nextIndex = current + 1
      setLoading(true)
      try {
        const res = await quizService.question(levelId, nextIndex)
        setQuiz(res.data.data)
        setCurrent(nextIndex)
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat soal')
      } finally {
        setLoading(false)
      }
      return
    }

    // Soal terakhir — submit semua jawaban
    setSubmitting(true)
    try {
      const payload = Object.entries(answers).map(([quiz_id, answer]) => ({ quiz_id: Number(quiz_id), answer: answer || '' }))
      const res  = await quizService.submit(levelId, payload)
      const data = res.data.data
      updateUser({ xp: data.user.xp, streak: data.user.streak })
      if (data.user.streak > (user?.streak || 0)) showStreakToast(data.user.streak)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal submit jawaban')
    } finally { setSubmitting(false) }
  }

  const handleRetry = () => {
    setAnswers({}); setSubmitted(false); setCorrect(null)
    setResult(null); setCurrent(1); setLoading(true)
    quizService.getQuizzes(levelId)
      .then((res) => {
        const { total, first_question } = res.data.data
        setTotal(total)
        setQuiz(first_question)
      })
      .finally(() => setLoading(false))
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
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#FAF9F6]">
      <div className="w-14 h-14 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-bold text-red-500 text-center">{error}</p>
      <button onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
        Kembali
      </button>
    </div>
  )

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <StreakToast toast={toast} onDismiss={dismiss} />
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {!result && (
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-extrabold text-black mb-6 border-2 border-black bg-white px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        )}

        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
          {result ? (
            <ResultScreen result={result} onRetry={handleRetry} onContinue={() => navigate(-1)} />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-black">Soal {current}</span>
                  <span className="text-xs text-gray-300">/</span>
                  <span className="text-xs font-bold text-gray-400">{total}</span>
                </div>
                <span className={cn(
                  'text-xs font-extrabold px-2.5 py-1 rounded-full border-2 border-black',
                  quiz?.type === 'multiple_choice' && 'bg-blue-100 text-black',
                  quiz?.type === 'translate'       && 'bg-violet-100 text-black',
                  quiz?.type === 'word_arrange'    && 'bg-yellow-100 text-black',
                )}>
                  {quiz?.type === 'multiple_choice' && 'Pilihan Ganda'}
                  {quiz?.type === 'translate'       && 'Terjemahkan'}
                  {quiz?.type === 'word_arrange'    && 'Susun Kata'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden mb-6 shadow-[2px_2px_0px_#000]">
                <div className="h-full bg-[#58CC02] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="min-h-[200px] mb-6">
                {quiz?.type === 'multiple_choice' && <MultipleChoice data={quiz.question_data} answer={currentAns} onAnswer={handleAnswer} submitted={submitted} correct={correct} />}
                {quiz?.type === 'translate'       && <Translate      data={quiz.question_data} answer={currentAns} onAnswer={handleAnswer} submitted={submitted} correct={correct} />}
                {quiz?.type === 'word_arrange'    && <WordArrange     data={quiz.question_data} answer={currentAns} onAnswer={handleAnswer} submitted={submitted} correct={correct} />}
              </div>

              {!submitted ? (
                <button
                  className={cn(
                    'w-full h-11 rounded-xl font-extrabold text-sm border-2 border-black transition-all duration-150',
                    currentAns.trim() && !checking
                      ? 'bg-black text-white shadow-[4px_4px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#555] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  )}
                  disabled={!currentAns.trim() || checking} onClick={handleCheck}>
                  {checking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Periksa Jawaban'}
                </button>
              ) : (
                <button
                  className="w-full h-11 rounded-xl font-extrabold text-sm border-2 border-black bg-[#58CC02] text-white shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={submitting} onClick={handleNext}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : current < total ? (
                    <><span>Soal Berikutnya</span><ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <><span>Lihat Hasil</span><Trophy className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
