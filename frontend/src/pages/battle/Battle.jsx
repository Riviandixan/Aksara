import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Swords, Copy, Check, Users, Crown, Loader2,
  Wifi, WifiOff, ChevronRight, Trophy, Zap, Star,
  Timer, CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getSocket, destroySocket,
  createRoom, joinRoom, startBattle, submitAnswer,
} from '@/services/battle.service'
import { packageService } from '@/services/quiz.service'

// ── Phase constants ───────────────────────────────────────────
const PHASE = {
  ENTRY:      'entry',      // pick create / join
  SETUP:      'setup',      // create: choose settings
  LOBBY:      'lobby',      // waiting for players
  GENERATING: 'generating', // AI building questions
  COUNTDOWN:  'countdown',  // 3-2-1
  QUESTION:   'question',   // answering
  REVEAL:     'reveal',     // correct answer shown
  RESULT:     'result',     // final leaderboard
}

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
const RANK_ICONS  = ['🥇', '🥈', '🥉']

// ── Utility sub-components ────────────────────────────────────
function Avatar({ url, username, size = 10 }) {
  return (
    <div
      className={cn(`w-${size} h-${size} rounded-full overflow-hidden border-2 border-black shrink-0`)}
      style={{ backgroundColor: '#b6e3f4' }}
    >
      {url
        ? <img src={url} alt={username} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-sm">
            {username?.[0]?.toUpperCase()}
          </div>
      }
    </div>
  )
}

function ScoreRow({ p, rank, isMe }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300',
      isMe ? 'border-black bg-yellow-50 shadow-[3px_3px_0px_#000]' : 'border-gray-200 bg-white',
    )}>
      <span className="text-xl w-7 text-center shrink-0">{RANK_ICONS[rank] ?? `#${rank + 1}`}</span>
      <Avatar url={p.avatar_url} username={p.username} size={9} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-sm truncate', isMe && 'text-black')}>{p.username}</p>
        <p className="text-xs text-gray-500">{p.correct ?? 0} benar</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-lg text-black">{p.score ?? 0}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">pts</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Battle() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const socketRef      = useRef(null)

  // ── State ─────────────────────────────────────────────────
  const [phase,        setPhase]        = useState(PHASE.ENTRY)
  const [connected,    setConnected]    = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [copied,       setCopied]       = useState(false)

  // Entry / Setup
  const [tab,          setTab]          = useState('create') // 'create' | 'join'
  const [joinCode,     setJoinCode]     = useState('')
  const [setup, setSetup] = useState({ source_type: 'ai', language_id: '', source_id: '', question_count: 10, time_per_question: 15 })
  const [languages,    setLanguages]    = useState([])
  const [packages,     setPackages]     = useState([])

  // Room
  const [room,         setRoom]         = useState(null)   // { code, host_id, participants, ... }
  const [isHost,       setIsHost]       = useState(false)

  // Countdown
  const [countdownSec, setCountdownSec] = useState(3)

  // Question
  const [question,     setQuestion]     = useState(null)  // { order_index, total, time, question_data }
  const [timeLeft,     setTimeLeft]     = useState(0)
  const [selected,     setSelected]     = useState(null)  // chosen option string
  const [answered,     setAnswered]     = useState(false)
  const [ansResult,    setAnsResult]    = useState(null)  // { ok, is_correct }

  // Reveal
  const [revealData,   setRevealData]   = useState(null)  // { order_index, correct_answer }

  // Scores (live)
  const [participants, setParticipants] = useState([])

  // Result
  const [finalResult,  setFinalResult]  = useState(null)

  // ── Load languages for AI source ──────────────────────────
  useEffect(() => {
    import('@/services/learning.service').then(({ languageService }) => {
      languageService.getAll()
        .then((r) => setLanguages(r.data.data || []))
        .catch(() => {})
    })
    packageService.list()
      .then((r) => setPackages(r.data.data || []))
      .catch(() => {})
  }, [])

  // ── Socket setup ──────────────────────────────────────────
  useEffect(() => {
    const s = getSocket()
    socketRef.current = s

    s.connect()
    s.on('connect',    () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    s.on('battle:lobby', (data) => {
      setRoom(data)
      setParticipants(data.participants || [])
      setIsHost(data.host_id === user?.id)
      setPhase(PHASE.LOBBY)
    })

    s.on('battle:generating', () => setPhase(PHASE.GENERATING))

    s.on('battle:error', ({ message }) => {
      setError(message || 'Terjadi kesalahan')
      setPhase(PHASE.LOBBY)
    })

    s.on('battle:countdown', ({ seconds }) => {
      setPhase(PHASE.COUNTDOWN)
      setCountdownSec(seconds || 3)
    })

    s.on('battle:question', (data) => {
      setQuestion(data)
      setTimeLeft(data.time)
      setSelected(null)
      setAnswered(false)
      setAnsResult(null)
      setRevealData(null)
      setPhase(PHASE.QUESTION)
    })

    s.on('battle:reveal', (data) => {
      setRevealData(data)
      setPhase(PHASE.REVEAL)
    })

    s.on('battle:scores', ({ participants: p }) => {
      setParticipants(p || [])
    })

    s.on('battle:result', ({ participants: p }) => {
      setFinalResult(p || [])
      setPhase(PHASE.RESULT)
    })

    s.on('battle:player_left', ({ user_id }) => {
      setParticipants((prev) => prev.filter((p) => p.user_id !== user_id))
    })

    return () => {
      s.off('connect'); s.off('disconnect')
      s.off('battle:lobby');    s.off('battle:generating')
      s.off('battle:error');    s.off('battle:countdown')
      s.off('battle:question')
      s.off('battle:reveal');   s.off('battle:scores')
      s.off('battle:result');   s.off('battle:player_left')
      destroySocket()
    }
  }, [user?.id])

  const ACTIVE_PHASES = [PHASE.COUNTDOWN, PHASE.GENERATING, PHASE.QUESTION, PHASE.REVEAL]
  const isActive = ACTIVE_PHASES.includes(phase)

  // Block tab close / refresh saat battle aktif
  useEffect(() => {
    if (!isActive) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isActive])

  // Block tombol back browser saat battle aktif
  useEffect(() => {
    if (!isActive) return

    // Push state dummy agar back button tidak langsung navigate keluar
    window.history.pushState({ battleGuard: true }, '')

    const handlePopState = (e) => {
      // User menekan back — push lagi agar tetap di halaman ini
      window.history.pushState({ battleGuard: true }, '')
      // Tampilkan dialog konfirmasi
      setShowExitConfirm(true)
      setPendingNav(-1) // -1 = back
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isActive])

  // ── Countdown tick ────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return
    if (countdownSec <= 0) return
    const t = setTimeout(() => setCountdownSec((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdownSec])

  // ── Question timer ────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.QUESTION) return
    if (timeLeft <= 0 || answered) return
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, answered])

  // ── Actions ───────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      await createRoom({
        source_type:       setup.source_type,
        source_id:         setup.source_id   || undefined,
        language_id:       setup.language_id || undefined,
        question_count:    setup.question_count,
        time_per_question: setup.time_per_question,
      })
      // battle:lobby event will fire and move to LOBBY phase
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setup])

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return
    setError('')
    setLoading(true)
    try {
      await joinRoom(joinCode.trim().toUpperCase())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [joinCode])

  const handleStart = useCallback(async () => {
    if (!room?.code) return
    setError('')
    setLoading(true)
    try {
      await startBattle(room.code)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [room?.code])

  const handleAnswer = useCallback(async (option) => {
    if (answered || !question || !room?.code) return
    setSelected(option)
    setAnswered(true)
    const res = await submitAnswer(room.code, question.order_index, option, timeLeft)
    setAnsResult(res)
  }, [answered, question, room?.code, timeLeft])

  const copyCode = () => {
    navigator.clipboard.writeText(room?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Exit confirmation (pengganti useBlocker) ──────────────
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  const handleNavAway = useCallback((destination) => {
    if (isActive) {
      setShowExitConfirm(true)
      setPendingNav(destination)
    } else {
      destroySocket()
      navigate(destination)
    }
  }, [isActive, navigate])

  const confirmExit = () => {
    destroySocket()
    setShowExitConfirm(false)
    if (pendingNav === -1) {
      // Dari back button — go back dua langkah (1 real + 1 dummy yang kita push)
      navigate(-2)
    } else {
      navigate(pendingNav || '/dashboard')
    }
  }

  const cancelExit = () => {
    setShowExitConfirm(false)
    setPendingNav(null)
  }

  const confirmDialog = showExitConfirm ? (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000] p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="font-extrabold text-black text-lg">Keluar dari Battle?</p>
          <p className="text-sm text-gray-500 mt-1">
            Battle sedang berlangsung. Jika keluar, kamu akan dianggap menyerah.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={cancelExit}
            className="flex-1 py-2.5 rounded-xl font-extrabold text-sm bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all"
          >
            Lanjutkan
          </button>
          <button
            onClick={confirmExit}
            className="flex-1 py-2.5 rounded-xl font-extrabold text-sm bg-red-500 text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  ) : null

  // ── Phase: ENTRY ──────────────────────────────────────────
  if (phase === PHASE.ENTRY) return (
    <>
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#58CC02] border-2 border-black shadow-[4px_4px_0px_#000] mb-4">
            <Swords className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-black">Battle Room</h1>
          <p className="text-gray-500 text-sm mt-1">Tantang pemain lain secara real-time</p>
        </div>

        {/* Connection status */}
        <div className={cn(
          'flex items-center gap-2 justify-center text-xs font-semibold px-3 py-1.5 rounded-full border w-fit mx-auto',
          connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
        )}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? 'Terhubung' : 'Menghubungkan...'}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border-2 border-black overflow-hidden shadow-[3px_3px_0px_#000]">
          {['create', 'join'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-sm font-bold transition-colors',
                tab === t ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              {t === 'create' ? '+ Buat Room' : '→ Masuk Room'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
            <CardContent className="pt-5 flex flex-col gap-4">
              <button onClick={() => setPhase(PHASE.SETUP)} className="w-full h-12 rounded-xl bg-[#58CC02] text-white font-extrabold text-base border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2">
                <Swords className="w-5 h-5" /> Buat Room Baru
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
            <CardContent className="pt-5 flex flex-col gap-3">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={8}
                placeholder="Kode Room (mis. AB12CD)"
                className="w-full h-12 px-4 rounded-xl border-2 border-black text-center font-extrabold text-xl tracking-widest outline-none focus:ring-2 focus:ring-[#58CC02] bg-white shadow-[2px_2px_0px_#000]"
              />
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={!joinCode.trim() || loading || !connected}
                className="w-full h-12 rounded-xl bg-black text-white font-extrabold text-base border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronRight className="w-5 h-5" /> Masuk</>}
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    {confirmDialog}
    </>
  )

  // ── Phase: SETUP ─────────────────────────────────────────
  if (phase === PHASE.SETUP) return (
    <>
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase(PHASE.ENTRY)} className="w-9 h-9 rounded-xl border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <h2 className="font-extrabold text-xl text-black">Pengaturan Room</h2>
        </div>

        <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
          <CardContent className="pt-5 flex flex-col gap-5">

            {/* Source type */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Sumber Soal</p>
              <div className="flex gap-2">
                {[{v:'ai', label:'🤖 AI Generate'}, {v:'package', label:'📦 Paket Soal'}].map(({v, label}) => (
                  <button key={v} onClick={() => setSetup((s) => ({...s, source_type: v, language_id: '', source_id: ''}))}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                      setup.source_type === v ? 'bg-black text-white border-black shadow-[2px_2px_0px_#58CC02]' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Package (package only) */}
            {setup.source_type === 'package' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Pilih Paket Soal</p>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {packages.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3">Belum ada paket soal</p>
                  )}
                  {packages.map((pkg) => (
                    <button key={pkg.id} onClick={() => setSetup((s) => ({ ...s, source_id: pkg.id }))}
                      className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all text-left',
                        setup.source_id === pkg.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                      )}>
                      <span className="truncate">{pkg.title}</span>
                      <span className="text-xs opacity-60 shrink-0 ml-2">{pkg.question_count} soal</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language (AI only) */}
            {setup.source_type === 'ai' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Bahasa</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button key={lang.id} onClick={() => setSetup((s) => ({...s, language_id: lang.id}))}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all',
                        setup.language_id === lang.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                      )}>
                      {lang.flag_emoji} {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question count — AI only */}
            {setup.source_type === 'ai' && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Jumlah Soal</p>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button key={n} onClick={() => setSetup((s) => ({...s, question_count: n}))}
                      className={cn('flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all',
                        setup.question_count === n ? 'bg-[#58CC02] text-white border-black shadow-[2px_2px_0px_#000]' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                      )}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time per question */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Waktu per Soal</p>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map((n) => (
                  <button key={n} onClick={() => setSetup((s) => ({...s, time_per_question: n}))}
                    className={cn('flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all',
                      setup.time_per_question === n ? 'bg-[#58CC02] text-white border-black shadow-[2px_2px_0px_#000]' : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                    )}>
                    {n}s
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={loading || !connected || (setup.source_type === 'ai' && !setup.language_id) || (setup.source_type === 'package' && !setup.source_id)}
              className="w-full h-12 rounded-xl bg-[#58CC02] text-white font-extrabold text-base border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Swords className="w-5 h-5" /> Buat Room</>}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
    {confirmDialog}
    </>
  )

  // ── Phase: LOBBY ─────────────────────────────────────────
  if (phase === PHASE.LOBBY) return (
    <>
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-4">

        <div className="text-center">
          <span className="inline-block text-3xl mb-2">⚔️</span>
          <h2 className="text-2xl font-extrabold text-black">Ruang Tunggu</h2>
          <p className="text-gray-500 text-sm mt-1">Menunggu semua pemain bergabung...</p>
        </div>

        {/* Room code */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
          <CardContent className="pt-5 flex flex-col items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Kode Room</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold tracking-widest text-black">{room?.code}</span>
              <button onClick={copyCode} className="w-9 h-9 rounded-xl bg-gray-100 border-2 border-black flex items-center justify-center hover:bg-gray-200 transition-colors shadow-[2px_2px_0px_#000]">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-black" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">Bagikan kode ini ke temanmu</p>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
          <CardContent className="pt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Pemain</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{participants.length}</span>
              </div>
            </div>
            {participants.map((p) => (
              <div key={p.user_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <Avatar url={p.avatar_url} username={p.username} size={9} />
                <p className="font-bold text-sm text-black flex-1">{p.username}</p>
                {p.user_id === room?.host_id && (
                  <div className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Host
                  </div>
                )}
                {p.user_id === user?.id && p.user_id !== room?.host_id && (
                  <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">Kamu</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Room config summary */}
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="flex-1 text-center bg-white border-2 border-gray-200 rounded-xl py-2 font-bold">
            {room?.question_count ?? '?'} soal
          </span>
          <span className="flex-1 text-center bg-white border-2 border-gray-200 rounded-xl py-2 font-bold">
            {room?.time_per_question ?? '?'}s / soal
          </span>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={loading || participants.length < 1}
            className="w-full h-13 py-3.5 rounded-xl bg-[#58CC02] text-white font-extrabold text-base border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#000] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Swords className="w-5 h-5" /> Mulai Battle!</>}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-500 font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menunggu host memulai...
          </div>
        )}
      </div>
    </div>
    {confirmDialog}
    </>
  )

  // ── Phase: GENERATING ────────────────────────────────────
  if (phase === PHASE.GENERATING) return (
    <div className="fixed inset-0 z-40 bg-[#FAFAFA] flex flex-col items-center justify-center gap-5 px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#58CC02] border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center animate-pulse">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-black">AI sedang mempersiapkan soal</h2>
        <p className="text-gray-500 text-sm mt-1">Harap tunggu sebentar...</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#58CC02]"
            style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  )

  // ── Phase: COUNTDOWN ─────────────────────────────────────
  if (phase === PHASE.COUNTDOWN) return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-6 px-4">
      <p className="text-white text-lg font-bold uppercase tracking-widest opacity-70">Battle dimulai dalam</p>
      <div
        key={countdownSec}
        className="w-36 h-36 rounded-full border-4 border-[#58CC02] flex items-center justify-center"
        style={{ animation: 'pop 0.4s ease-out' }}
      >
        <span className="text-8xl font-extrabold text-[#58CC02]">{countdownSec || '🚀'}</span>
      </div>
      <p className="text-gray-400 text-sm">Bersiaplah!</p>
      <style>{`@keyframes pop { 0%{transform:scale(1.4);opacity:0.5} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )

  // ── Phase: QUESTION ──────────────────────────────────────
  if (phase === PHASE.QUESTION) {
    const qData    = question?.question_data ?? {}
    const options  = qData.options ?? []
    const pct      = question?.time ? Math.round((timeLeft / question.time) * 100) : 0
    const timerColor = pct > 50 ? '#58CC02' : pct > 25 ? '#FFC800' : '#FF4B4B'

    return (
      <div className="fixed inset-0 z-40 bg-[#FAFAFA] flex flex-col px-4 py-6 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-4 flex-1">

          {/* Progress & Timer */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>Soal {question?.order_index} / {question?.total}</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(question?.order_index / question?.total) * 100}%`, background: '#58CC02' }} />
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 font-extrabold text-xl transition-colors duration-300"
              style={{ borderColor: timerColor, color: timerColor }}>
              {timeLeft}
            </div>
          </div>

          {/* Question card */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
            <CardContent className="pt-6 pb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Pertanyaan
              </p>
              <p className="text-2xl font-extrabold text-black leading-snug text-center">
                {qData.question}
              </p>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 flex-1">
            {options.map((opt, i) => {
              const letters = ['A', 'B', 'C', 'D']
              const isSelected = selected === opt
              const isCorrect  = ansResult?.is_correct && isSelected
              const isWrong    = !ansResult?.is_correct && isSelected

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 text-left font-bold text-sm transition-all',
                    !answered && 'hover:border-black hover:shadow-[2px_2px_0px_#000] hover:bg-white',
                    !isSelected && !answered && 'bg-white border-gray-200 text-gray-700',
                    !isSelected && answered && 'bg-white border-gray-100 text-gray-400 opacity-50',
                    isCorrect && 'bg-green-50 border-green-500 text-green-700 shadow-[2px_2px_0px_#16a34a]',
                    isWrong   && 'bg-red-50   border-red-400   text-red-700   shadow-[2px_2px_0px_#dc2626]',
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold border-2 shrink-0',
                    isCorrect ? 'bg-green-500 border-green-600 text-white' :
                    isWrong   ? 'bg-red-400   border-red-500   text-white' :
                                'bg-gray-100  border-gray-300  text-gray-600'
                  )}>
                    {letters[i]}
                  </span>
                  {opt}
                  {isCorrect && <CheckCircle2 className="w-4 h-4 ml-auto text-green-600" />}
                  {isWrong   && <XCircle      className="w-4 h-4 ml-auto text-red-500"   />}
                </button>
              )
            })}
          </div>

          {/* Live leaderboard sidebar */}
          {participants.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...participants].sort((a,b) => b.score - a.score).slice(0, 5).map((p, i) => (
                <div key={p.user_id} className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-xl border-2 shrink-0 min-w-[60px]',
                  p.user_id === user?.id ? 'border-black bg-yellow-50' : 'border-gray-200 bg-white'
                )}>
                  <Avatar url={p.avatar_url} username={p.username} size={7} />
                  <p className="text-[10px] font-bold text-black truncate max-w-[52px]">{p.username}</p>
                  <p className="text-xs font-extrabold text-[#58CC02]">{p.score}</p>
                </div>
              ))}
            </div>
          )}

          {answered && !ansResult?.is_correct && (
            <p className="text-center text-sm text-gray-400 font-medium">Menunggu soal berikutnya...</p>
          )}
          {answered && ansResult?.is_correct && (
            <p className="text-center text-sm text-[#58CC02] font-extrabold">+{ansResult.points ?? 100} pts 🎉</p>
          )}
        </div>
      </div>
    )
  }

  // ── Phase: REVEAL ────────────────────────────────────────
  if (phase === PHASE.REVEAL) {
    const isCorrect = ansResult?.is_correct

    return (
      <div className="fixed inset-0 z-40 bg-[#FAFAFA] flex flex-col items-center justify-center px-4 gap-6">
        <div className={cn(
          'w-24 h-24 rounded-full border-4 flex items-center justify-center',
          isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-400'
        )}>
          {isCorrect
            ? <CheckCircle2 className="w-12 h-12 text-green-500" />
            : <XCircle      className="w-12 h-12 text-red-400" />
          }
        </div>

        <div className="text-center">
          <p className="text-xl font-extrabold text-black">
            {isCorrect ? 'Benar! 🎉' : answered ? 'Salah!' : 'Waktu habis!'}
          </p>
          {revealData?.correct_answer && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-1">Jawaban yang benar:</p>
              <p className="text-lg font-extrabold text-[#58CC02] bg-green-50 border-2 border-green-300 px-5 py-2.5 rounded-xl inline-block">
                {revealData.correct_answer}
              </p>
            </div>
          )}
        </div>

        {/* Live scores */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          {[...participants].sort((a,b) => b.score - a.score).map((p, i) => (
            <ScoreRow key={p.user_id} p={p} rank={i} isMe={p.user_id === user?.id} />
          ))}
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Soal berikutnya sebentar lagi...
        </p>
      </div>
    )
  }

  // ── Phase: RESULT ────────────────────────────────────────
  if (phase === PHASE.RESULT) {
    const results  = finalResult || participants
    const myResult = results.find((p) => p.user_id === user?.id)
    const myRank   = results.findIndex((p) => p.user_id === user?.id)

    return (
      <div className="fixed inset-0 z-40 bg-[#FAFAFA] flex flex-col items-center px-4 py-10 gap-6 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col gap-5">

          {/* Hero */}
          <div className="text-center">
            <p className="text-5xl mb-3">{myRank === 0 ? '🏆' : myRank === 1 ? '🥈' : myRank === 2 ? '🥉' : '🎮'}</p>
            <h2 className="text-3xl font-extrabold text-black">
              {myRank === 0 ? 'Kamu Menang!' : myRank === 1 ? 'Runner-up!' : myRank === 2 ? 'Podium ke-3!' : 'Battle Selesai!'}
            </h2>
            {myResult && (
              <p className="text-gray-500 text-sm mt-1">
                Skor kamu: <span className="font-extrabold text-black">{myResult.score} pts</span>
                {' · '}{myResult.correct} jawaban benar
              </p>
            )}
          </div>

          {/* XP earned indicator */}
          {myResult && (
            <div className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-yellow-50 border-2 border-yellow-300 shadow-[2px_2px_0px_#ca8a04]">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
              <p className="font-extrabold text-yellow-700">
                +{myRank === 0 ? 50 : myRank === 1 ? 30 : 10} XP diperoleh
              </p>
            </div>
          )}

          {/* Final leaderboard */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_#000]">
            <CardContent className="pt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <p className="font-extrabold text-sm text-black uppercase tracking-wide">Papan Skor Akhir</p>
              </div>
              {results.sort((a,b) => b.score - a.score).map((p, i) => (
                <ScoreRow key={p.user_id} p={p} rank={i} isMe={p.user_id === user?.id} />
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setPhase(PHASE.ENTRY); setRoom(null); setParticipants([]) }}
              className="flex-1 py-3 rounded-xl bg-white text-black font-extrabold text-sm border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all"
            >
              Main Lagi
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 rounded-xl bg-[#58CC02] text-white font-extrabold text-sm border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-1.5"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {confirmDialog}
    </>
  )
}
