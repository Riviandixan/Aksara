import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, ArrowLeft, ChevronRight, Trophy, RotateCcw,
  Timer, Zap, AlertCircle, CheckCircle2, XCircle,
  TrendingUp, Globe, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { examService } from '@/services/quiz.service'
import { languageService } from '@/services/learning.service'
import { useAuth } from '@/hooks/useAuth'
import Certificate from '@/components/Certificate'

const LANG_COLORS = {
  en: 'bg-blue-100', ja: 'bg-red-100', ko: 'bg-violet-100',
  fr: 'bg-indigo-100', de: 'bg-slate-100', zh: 'bg-rose-100',
  ru: 'bg-sky-100', es: 'bg-orange-100',
}
const LANG_ABBR = { en: 'EN', ja: 'JA', ko: 'KO', fr: 'FR', de: 'DE', zh: 'ZH', ru: 'RU', es: 'ES' }
const EXAM_DURATION = 10 * 60

function getGrade(score) {
  if (score >= 90) return { label: 'A', color: 'bg-[#58CC02]', text: 'Luar Biasa! 🏆' }
  if (score >= 80) return { label: 'B', color: 'bg-blue-400', text: 'Bagus Sekali! 🎉' }
  if (score >= 70) return { label: 'C', color: 'bg-yellow-400', text: 'Cukup Baik 👍' }
  if (score >= 60) return { label: 'D', color: 'bg-orange-400', text: 'Perlu Latihan 📚' }
  return { label: 'E', color: 'bg-red-400', text: 'Terus Semangat! 💪' }
}

// ── Phase 1: Language Select ──────────────────────────────────
function LangSelect({ onStart }) {
  const [languages, setLanguages] = useState([])
  const [selected, setSelected] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    languageService.getAll()
      .then((res) => setLanguages(res.data.data))
      .catch(() => setError('Gagal memuat daftar bahasa'))
      .finally(() => setFetching(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-black">Ujian Bahasa</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Pilih bahasa yang ingin diuji. Waktu: 10 menit.</p>
      </div>

      {fetching ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : error ? (
        <p className="text-sm font-bold text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {languages.map((lang) => {
            const isActive = selected?.id === lang.id
            return (
              <button key={lang.id} onClick={() => setSelected(lang)}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-black transition-all duration-150 font-bold',
                  isActive
                    ? 'bg-black text-white shadow-none translate-x-[3px] translate-y-[3px]'
                    : `${LANG_COLORS[lang.code] || 'bg-gray-100'} text-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]`
                )}>
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center font-extrabold text-lg text-black shadow-[2px_2px_0px_#000]">
                  {LANG_ABBR[lang.code] || lang.code.toUpperCase()}
                </div>
                <span className="text-sm font-extrabold">{lang.name}</span>
                {isActive && <span className="text-lg">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      <button disabled={!selected} onClick={() => onStart(selected)}
        className={cn(
          'w-full h-12 text-sm font-extrabold rounded-xl border-2 border-black flex items-center justify-center gap-2 transition-all duration-150',
          selected
            ? 'bg-black text-white shadow-[4px_4px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#555]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
        )}>
        <Timer className="w-4 h-4" /> Mulai Ujian
      </button>
    </div>
  )
}

// ── Phase 2: Countdown ────────────────────────────────────────
function Countdown({ language, loading, onDone }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count === 0) { onDone(); return }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <p className="text-sm font-extrabold text-gray-500 uppercase tracking-widest">Ujian dimulai dalam</p>
      <div className="w-32 h-32 rounded-full border-2 border-black bg-black flex items-center justify-center shadow-[6px_6px_0px_#555]">
        <span className="text-6xl font-extrabold text-white">{count || '🚀'}</span>
      </div>
      <p className="text-base font-extrabold text-black">{language.name}</p>
      {loading && (
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyiapkan soal...
        </div>
      )}
    </div>
  )
}

// ── Question renderers (no feedback) ─────────────────────────
function MultipleChoice({ data, answer, onAnswer }) {
  const labels = ['A', 'B', 'C', 'D']
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-yellow-50 border-2 border-black rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000] mb-2">
        <p className="text-xs font-extrabold text-black/50 uppercase tracking-wide mb-1">Terjemahkan ke Bahasa Indonesia:</p>
        <p className="text-xl font-extrabold text-black">{data.question}</p>
      </div>
      {(data.options || []).map((opt, i) => {
        const isSelected = answer === opt
        return (
          <button key={i} onClick={() => onAnswer(opt)}
            className={cn(
              'w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 flex items-center gap-3',
              isSelected
                ? 'border-black bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                : 'border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]'
            )}>
            <span className={cn(
              'w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-extrabold shrink-0',
              isSelected ? 'bg-white text-black' : 'bg-gray-100 text-black'
            )}>{labels[i]}</span>
            <span className="flex-1">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function Translate({ data, answer, onAnswer }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-yellow-50 border-2 border-black rounded-xl px-5 py-4 shadow-[3px_3px_0px_#000]">
        <p className="text-xs font-extrabold text-black/50 uppercase tracking-wide mb-1">Terjemahkan kalimat ini:</p>
        <p className="text-lg font-extrabold text-black">{data.sentence}</p>
      </div>
      <textarea value={answer || ''} onChange={(e) => onAnswer(e.target.value)}
        placeholder="Ketik terjemahanmu di sini..." rows={3}
        className="w-full px-4 py-3 rounded-xl border-2 border-black bg-white text-sm font-medium resize-none outline-none shadow-[3px_3px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_#000] transition-all" />
    </div>
  )
}

function WordArrange({ data, answer, onAnswer }) {
  const selected = answer ? answer.split(' ').filter(Boolean) : []

  // track which word indices are used by matching selected words to available words
  const getUsedIndices = () => {
    const used = []
    const pool = [...data.words.map((w, i) => ({ w, i }))]
    for (const word of selected) {
      const idx = pool.findIndex(({ w }) => w === word)
      if (idx !== -1) { used.push(pool[idx].i); pool.splice(idx, 1) }
    }
    return used
  }
  const usedIndices = getUsedIndices()
  const availableWords = data.words.map((w, i) => ({ w, i })).filter(({ i }) => !usedIndices.includes(i))

  const addWord = (word) => onAnswer([...selected, word].join(' '))
  const removeWord = (pos) => onAnswer(selected.filter((_, i) => i !== pos).join(' '))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-extrabold text-black">Susun kata-kata berikut menjadi kalimat yang benar:</p>
      <div className="min-h-[56px] flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed border-black bg-gray-50">
        {selected.length === 0 && <span className="text-xs font-medium text-gray-400 self-center">Klik kata di bawah untuk menyusun...</span>}
        {selected.map((word, i) => (
          <button key={i} onClick={() => removeWord(i)}
            className="px-3 py-1.5 bg-black text-white text-sm font-extrabold rounded-lg border-2 border-black hover:bg-gray-800 transition-colors">
            {word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableWords.map(({ w, i }) => (
          <button key={i} onClick={() => addWord(w)}
            className="px-3 py-1.5 bg-white border-2 border-black text-sm font-extrabold rounded-lg shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Phase 3: Quiz (no feedback, just answer & next) ───────────
function ExamQuiz({ questions, totalQuestions, onFetchNext, onFinish }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION)
  const [fetching, setFetching] = useState(false)
  const timerRef = useRef(null)
  const answersRef = useRef({})

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          onFinish(answersRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [onFinish])

  const q = questions[current]
  const key = q.order_index
  const currentAns = answers[key] || ''
  const progress = ((current + 1) / totalQuestions) * 100
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const isUrgent = timeLeft <= 60

  const handleAnswer = (val) => {
    const next = { ...answersRef.current, [key]: val }
    answersRef.current = next
    setAnswers(next)
  }

  const handleNext = async () => {
    const nextIndex = current + 1
    if (nextIndex < totalQuestions) {
      // fetch soal berikutnya kalau belum ada
      if (!questions[nextIndex]) {
        setFetching(true)
        try {
          await onFetchNext(nextIndex + 1) // order_index mulai dari 1
        } finally {
          setFetching(false)
        }
      }
      setCurrent(nextIndex)
    } else {
      clearInterval(timerRef.current)
      onFinish(answersRef.current)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">Soal {current + 1} / {totalQuestions}</span>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black text-sm font-extrabold',
          isUrgent ? 'bg-red-400 text-white animate-pulse' : 'bg-white text-black'
        )}>
          <Timer className="w-3.5 h-3.5" />{mins}:{secs}
        </div>
      </div>

      <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_#000]">
        <div className="h-full bg-[#58CC02] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="min-h-[200px]">
        {q.type === 'multiple_choice' && <MultipleChoice data={q.question_data} answer={currentAns} onAnswer={handleAnswer} />}
        {q.type === 'translate' && <Translate data={q.question_data} answer={currentAns} onAnswer={handleAnswer} />}
        {q.type === 'word_arrange' && <WordArrange data={q.question_data} answer={currentAns} onAnswer={handleAnswer} />}
      </div>

      <button onClick={handleNext} disabled={!currentAns.trim() || fetching}
        className={cn(
          'w-full h-11 rounded-xl font-extrabold text-sm border-2 border-black transition-all duration-150 flex items-center justify-center gap-2',
          currentAns.trim() && !fetching
            ? 'bg-black text-white shadow-[4px_4px_0px_#555] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#555]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
        )}>
        {fetching
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Memuat soal...</>
          : current < totalQuestions - 1
            ? <><span>Soal Berikutnya</span><ChevronRight className="w-4 h-4" /></>
            : <><span>Selesai & Lihat Hasil</span><Trophy className="w-4 h-4" /></>}
      </button>
    </div>
  )
}

// ── Phase 4: Result with evaluation ──────────────────────────
function ExamResult({ result, language, baseLevel, onRetry }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { score, correct_count, total, xp_earned, evaluations } = result
  const grade = getGrade(score)
  const isPerfect = score === 100
  const isGood = score >= 80  // grade A atau B

  // Rekomendasi berdasarkan grade + base_level
  const recommendation = isGood
    ? baseLevel === 'beginner'
      ? {
        icon: TrendingUp,
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-400',
        title: 'Siap Naik Level! 🚀',
        desc: `Nilaimu bagus di level beginner. Coba tantang dirimu dengan level intermediate ${language.name}!`,
        actions: [
          { label: 'Mulai Intermediate', color: 'bg-blue-400 text-white', onClick: (nav) => nav(`/language-select?lang_id=${language.id}&level=intermediate`) },
        ],
      }
      : {
        icon: Globe,
        bg: 'bg-emerald-50',
        iconBg: 'bg-[#58CC02]',
        title: 'Kuasai Bahasa Baru! 🌍',
        desc: `Luar biasa! Kamu sudah menguasai ${language.name} level intermediate. Saatnya eksplorasi bahasa baru!`,
        actions: [
          { label: 'Coba Bahasa Baru', color: 'bg-[#58CC02] text-white', onClick: (nav) => nav('/language-select') },
        ],
      }
    : {
      icon: BookOpen,
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-400',
      title: 'Perkuat Materimu 📚',
      desc: 'Masih ada beberapa materi yang perlu diperkuat. Kembali ke learning path untuk latihan lebih banyak sebelum ujian lagi.',
      actions: [
        { label: 'Ke Learning Path', color: 'bg-orange-400 text-white', onClick: (nav) => nav('/dashboard') },
      ],
    }

  return (
    <div className="flex flex-col gap-5">
      {/* Grade circle */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className={cn('w-32 h-32 rounded-full border-2 border-black flex flex-col items-center justify-center shadow-[6px_6px_0px_#000]', grade.color)}>
          <p className="text-5xl font-extrabold text-white">{grade.label}</p>
          <p className="text-xs text-white/80 font-extrabold mt-1">{score}%</p>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-black">{grade.text}</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">{correct_count} dari {total} jawaban benar · {language.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-yellow-100 border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-extrabold text-black">XP Didapat</span>
          </div>
          <p className="text-2xl font-extrabold text-black">+{xp_earned ?? 0}</p>
        </div>
        <div className="flex-1 bg-gray-100 border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-black" />
            <span className="text-xs font-extrabold text-black">Grade</span>
          </div>
          <p className="text-2xl font-extrabold text-black">{grade.label}</p>
        </div>
      </div>

      {/* Certificate — hanya untuk grade A, B, C */}
      {'ABC'.includes(grade.label) && (
        <Certificate
          username={user?.username || 'Pengguna'}
          language={language.name}
          grade={grade.label}
          score={score}
          baseLevel={baseLevel}
        />
      )}

      {/* Recommendation */}
      {(() => {
        const Icon = recommendation.icon
        return (
          <div className={cn('rounded-2xl border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex items-start gap-4', recommendation.bg)}>
            <div className={cn('w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]', recommendation.iconBg)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-black text-sm">{recommendation.title}</p>
              <p className="text-xs font-medium text-black/60 mt-0.5 leading-relaxed">{recommendation.desc}</p>
              <div className="flex gap-2 mt-3">
                {recommendation.actions.map((action, i) => (
                  <button key={i} onClick={() => action.onClick(navigate)}
                    className={cn('text-xs font-extrabold px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all', action.color)}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Evaluations */}
      {evaluations?.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-extrabold text-black uppercase tracking-widest">Evaluasi Jawaban</p>
          {evaluations.map((ev, i) => {
            const isCorrect = ev.is_correct
            return (
              <div key={i} className={cn(
                'rounded-xl border-2 border-black p-4 shadow-[2px_2px_0px_#000]',
                isCorrect ? 'bg-green-50' : 'bg-red-50'
              )}>
                <div className="flex items-start gap-2">
                  {isCorrect
                    ? <CheckCircle2 className="w-4 h-4 text-[#58CC02] shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-black/50 uppercase mb-1">Soal {ev.order_index}</p>
                    <p className="text-sm font-bold text-black">{ev.question_summary}</p>
                    {!isCorrect && (
                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-xs font-bold text-red-600">Jawabanmu: <span className="font-medium">{ev.user_answer || '(kosong)'}</span></p>
                        <p className="text-xs font-bold text-[#58CC02]">Jawaban benar: <span className="font-medium">{ev.correct_answer}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3">
        {!isPerfect && (
          <button onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
            <RotateCcw className="w-4 h-4" /> Ujian Lagi
          </button>
        )}
        <button onClick={() => navigate('/dashboard')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm border-2 border-black bg-black text-white shadow-[3px_3px_0px_#555] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#555] transition-all">
          Dashboard
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Exam() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('lang-select')
  const [language, setLanguage] = useState(null)
  const [questions, setQuestions] = useState([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [attemptId, setAttemptId] = useState(null)
  const [result, setResult] = useState(null)
  const [baseLevel, setBaseLevel] = useState('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdownDone, setCountdownDone] = useState(false)

  const handleStart = async (lang) => {
    setLanguage(lang)
    setPhase('countdown')
    setCountdownDone(false)
    setQuestions([])
    setLoading(true)
    setError('')
    try {
      const res = await examService.generate(lang.id)
      const d = res.data.data
      setAttemptId(d.attempt_id)
      setBaseLevel(d.base_level || 'beginner')
      // simpan hanya metadata + soal pertama
      setQuestions([{ ...d.first_question, _total: d.total }])
      setTotalQuestions(d.total)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat soal ujian')
      setPhase('lang-select')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (countdownDone && questions.length > 0) setPhase('quiz')
  }, [countdownDone, questions])

  const handleCountdownDone = useCallback(() => setCountdownDone(true), [])

  const handleFinish = async (answers) => {
    setPhase('submitting')
    setError('')
    try {
      const payload = questions.map((q) => ({
        order_index: q.order_index,
        answer: answers[q.order_index] || '',
      }))
      const res = await examService.submit({ attempt_id: attemptId, answers: payload })
      setResult(res.data.data)
      setPhase('result')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal submit ujian')
      setPhase('submit-error')
    }
  }

  const handleRetry = () => {
    setPhase('lang-select')
    setQuestions([])
    setTotalQuestions(0)
    setAttemptId(null)
    setResult(null)
    setLanguage(null)
    setError('')
    setCountdownDone(false)
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {phase !== 'result' && (
          <button onClick={() => phase === 'lang-select' ? navigate('/dashboard') : handleRetry()}
            className="flex items-center gap-2 text-sm font-extrabold text-black mb-6 border-2 border-black bg-white px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <ArrowLeft className="w-4 h-4" />
            {phase === 'lang-select' ? 'Kembali ke Dashboard' : 'Batalkan Ujian'}
          </button>
        )}

        {error && phase === 'lang-select' && (
          <div className="flex items-center gap-2 text-sm font-bold text-red-700 bg-red-100 border-2 border-black px-3 py-2.5 rounded-xl mb-4 shadow-[2px_2px_0px_#000]">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
          {phase === 'lang-select' && <LangSelect onStart={handleStart} />}

          {phase === 'countdown' && (
            <Countdown language={language} loading={loading} onDone={handleCountdownDone} />
          )}

          {phase === 'quiz' && questions.length > 0 && (
            <ExamQuiz
              questions={questions}
              totalQuestions={totalQuestions}
              attemptId={attemptId}
              onFetchNext={async (orderIndex) => {
                const res = await examService.question(attemptId, orderIndex)
                setQuestions((prev) => [...prev, res.data.data])
              }}
              onFinish={handleFinish}
            />
          )}

          {phase === 'submitting' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <p className="text-sm font-bold text-gray-400">Menghitung hasil ujian...</p>
            </div>
          )}

          {phase === 'submit-error' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm font-bold text-red-500 text-center">{error}</p>
              <button onClick={handleRetry}
                className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
                Coba Lagi
              </button>
            </div>
          )}

          {phase === 'result' && result && (
            <ExamResult result={result} language={language} baseLevel={baseLevel} onRetry={handleRetry} />
          )}
        </div>
      </div>
    </div>
  )
}
