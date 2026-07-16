import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, Plus, Trash2, Check, Loader2,
  BookOpen, Sparkles, Hand, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { packageService, bankService } from '@/services/package.service'
import api from '@/services/api'

const TYPES = {
  multiple_choice: 'Multiple Choice',
  translate:       'Terjemahan',
  word_arrange:    'Susun Kata',
}
const TYPE_COLORS = {
  multiple_choice: 'bg-blue-100 text-blue-800',
  translate:       'bg-violet-100 text-violet-800',
  word_arrange:    'bg-yellow-100 text-yellow-800',
}
const LANG_COLORS = {
  en: 'bg-blue-100 text-blue-800',
  ja: 'bg-red-100 text-red-800',
  ko: 'bg-violet-100 text-violet-800',
  fr: 'bg-indigo-100 text-indigo-800',
  de: 'bg-yellow-100 text-yellow-800',
}

const inputCls = 'w-full px-3 py-2 text-sm font-medium border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all'

// ── Add Question Modal ────────────────────────────────────────
function AddQuestionModal({ languages, onAdd, onClose }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    language_id: '', type: 'multiple_choice',
    question: '', options: ['', '', '', ''], correct_answer: '', sentence: '', words: '',
  })
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const buildData = () => {
    if (form.type === 'multiple_choice')
      return { question: form.question, options: form.options.filter(Boolean), correct_answer: form.correct_answer }
    if (form.type === 'translate')
      return { sentence: form.sentence, correct_answer: form.correct_answer }
    return { words: form.words.split(',').map((w) => w.trim()).filter(Boolean), correct_answer: form.correct_answer }
  }

  const handleSave = async () => {
    if (!form.language_id || !form.correct_answer) return
    setSaving(true)
    try {
      const res = await bankService.create({ language_id: form.language_id, type: form.type, question_data: buildData() })
      onAdd(res.data.data)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000] w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-violet-100 rounded-t-2xl">
          <h3 className="font-extrabold text-black">Tambah Soal ke Bank</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
            <X className="w-4 h-4 text-black" />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold text-black uppercase tracking-wide mb-1.5 block">Bahasa *</label>
              <select value={form.language_id} onChange={(e) => set('language_id', e.target.value)} className={inputCls}>
                <option value="">Pilih bahasa</option>
                {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-extrabold text-black uppercase tracking-wide mb-1.5 block">Tipe Soal</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {form.type === 'multiple_choice' && (<>
            <input value={form.question} onChange={(e) => set('question', e.target.value)} placeholder="Pertanyaan..." className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              {form.options.map((opt, i) => (
                <input key={i} value={opt} onChange={(e) => set('options', form.options.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Opsi ${i + 1}`} className={inputCls} />
              ))}
            </div>
            <input value={form.correct_answer} onChange={(e) => set('correct_answer', e.target.value)}
              placeholder="Jawaban benar (sama persis dengan salah satu opsi)" className={inputCls} />
          </>)}

          {form.type === 'translate' && (<>
            <input value={form.sentence} onChange={(e) => set('sentence', e.target.value)} placeholder="Kalimat yang diterjemahkan..." className={inputCls} />
            <input value={form.correct_answer} onChange={(e) => set('correct_answer', e.target.value)} placeholder="Terjemahan yang benar..." className={inputCls} />
          </>)}

          {form.type === 'word_arrange' && (<>
            <input value={form.words} onChange={(e) => set('words', e.target.value)} placeholder="Kata-kata dipisah koma: saya, makan, nasi" className={inputCls} />
            <input value={form.correct_answer} onChange={(e) => set('correct_answer', e.target.value)} placeholder="Susunan yang benar..." className={inputCls} />
          </>)}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t-2 border-black">
          <button onClick={onClose} className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">Batal</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-[#58CC02] text-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question Card ─────────────────────────────────────────────
function QuestionCard({ q, isAdded, onAdd, onRemove }) {
  const data    = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
  const preview = data.question || data.sentence || data.words?.join(' ') || '—'
  const langCode = q.language_code || ''

  return (
    <div className={cn(
      'bg-white rounded-2xl border-2 border-black p-4 transition-all duration-150',
      isAdded
        ? 'shadow-none translate-x-[2px] translate-y-[2px] bg-green-50'
        : 'shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]'
    )}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full border-2 border-black', LANG_COLORS[langCode] || 'bg-gray-100 text-black')}>
          {q.language_name}
        </span>
        <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full border-2 border-black', TYPE_COLORS[q.type])}>
          {TYPES[q.type]}
        </span>
      </div>
      <p className="text-sm font-bold text-black leading-snug line-clamp-3 mb-3">{preview}</p>
      {q.type === 'multiple_choice' && data.options && (
        <p className="text-xs font-medium text-gray-400 line-clamp-1 mb-3">{data.options.slice(0, 3).join(' · ')}...</p>
      )}
      <div className="flex items-center justify-between pt-3 border-t-2 border-black/10">
        <span className="text-xs font-bold text-gray-400">{TYPES[q.type]}</span>
        {isAdded ? (
          <button onClick={() => onRemove(q.id)}
            className="flex items-center gap-1.5 text-xs font-extrabold bg-[#58CC02] text-white px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-red-400 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
            <Check className="w-3 h-3" /> Ditambahkan
          </button>
        ) : (
          <button onClick={() => onAdd(q)}
            className="flex items-center gap-1.5 text-xs font-extrabold bg-black text-white px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#555] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
            <Plus className="w-3 h-3" /> Tambah ke Paket
          </button>
        )}
      </div>
    </div>
  )
}

// ── Right Panel ───────────────────────────────────────────────
function PackagePanel({ form, setForm, selectedQuestions, onRemove, onSave, saving, languages }) {
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="flex flex-col h-full rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-black">
        <div>
          <p className="font-extrabold text-white text-sm">Paket Saat Ini</p>
          <p className="text-xs text-gray-400 mt-0.5">{selectedQuestions.length} soal dipilih</p>
        </div>
        <span className="text-xs font-extrabold bg-yellow-300 text-black px-2.5 py-1 rounded-full border border-black">DRAFT</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {selectedQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <BookOpen className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-xs font-bold text-gray-400">Belum ada yang dipilih</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y-2 divide-black/10">
            {selectedQuestions.map((q, i) => {
              const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
              const preview = data.question || data.sentence || data.words?.join(' ') || '—'
              return (
                <div key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white transition-colors">
                  <span className="text-xs font-extrabold text-gray-400 mt-0.5 shrink-0 w-4">{i + 1}</span>
                  <p className="text-xs font-medium text-black flex-1 line-clamp-2">{preview}</p>
                  <button onClick={() => onRemove(q.id)} className="p-1 rounded-lg hover:bg-red-100 hover:text-red-500 text-gray-300 transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-4 bg-white border-t-2 border-black flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-extrabold text-black uppercase tracking-widest mb-1.5 block">Judul Paket</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Judul paket..." className={inputCls} />
        </div>
        <div>
          <label className="text-[10px] font-extrabold text-black uppercase tracking-widest mb-1.5 block">Deskripsi</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Deskripsi singkat..." rows={2} className={cn(inputCls, 'resize-none')} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-extrabold text-black uppercase tracking-widest mb-1.5 block">Bahasa</label>
            <select value={form.language_id} onChange={(e) => set('language_id', e.target.value)} className={inputCls}>
              <option value="">Pilih...</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-black uppercase tracking-widest mb-1.5 block">Visibilitas</label>
            <select value={form.is_public ? 'public' : 'private'} onChange={(e) => set('is_public', e.target.value === 'public')} className={inputCls}>
              <option value="public">Publik</option>
              <option value="private">Privat</option>
            </select>
          </div>
        </div>
        <button onClick={onSave} disabled={saving || !form.title || !form.language_id}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm border-2 border-black bg-[#58CC02] text-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Simpan Paket
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function CreatePackage() {
  const navigate                          = useNavigate()
  const [languages, setLanguages]         = useState([])
  const [bankQuestions, setBankQuestions] = useState([])
  const [selectedQuestions, setSelected] = useState([])
  const [saving, setSaving]               = useState(false)
  const [showModal, setShowModal]         = useState(false)
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [langFilter, setLangFilter]       = useState('')
  const [mode, setMode]                   = useState('manual')
  const [form, setForm]                   = useState({ title: '', description: '', language_id: '', is_public: true })

  useEffect(() => {
    api.get('/languages').then((r) => setLanguages(r.data.data))
    bankService.list().then((r) => setBankQuestions(r.data.data))
  }, [])

  const filtered = bankQuestions.filter((q) => {
    const data    = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
    const preview = (data.question || data.sentence || data.words?.join(' ') || '').toLowerCase()
    if (search && !preview.includes(search.toLowerCase())) return false
    if (typeFilter && q.type !== typeFilter) return false
    if (langFilter && String(q.language_id) !== String(langFilter)) return false
    return true
  })

  const selectedIds  = selectedQuestions.map((q) => q.id)
  const handleAdd    = (q) => setSelected((p) => p.some((x) => x.id === q.id) ? p : [...p, q])
  const handleRemove = (id) => setSelected((p) => p.filter((q) => q.id !== id))

  const handleSave = async () => {
    if (!form.title || !form.language_id) return
    setSaving(true)
    try {
      await packageService.create({ ...form, question_ids: selectedIds })
      navigate('/quiz-packages')
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF9F6]">
      {showModal && (
        <AddQuestionModal
          languages={languages}
          onAdd={(q) => { setBankQuestions((p) => [q, ...p]); handleAdd(q) }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b-2 border-black bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/quiz-packages')}
            className="p-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-black">Buat Paket Soal</h1>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Pilih soal dari bank soal atau buat soal baru</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
          <Plus className="w-3.5 h-3.5" /> Buat Soal Baru
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mode tabs */}
          <div className="flex items-center gap-2 px-8 pt-5 pb-3 shrink-0">
            {[
              { key: 'auto',   icon: Sparkles, label: 'Auto Bundle — biarkan AI pilihkan soal', bg: 'bg-emerald-100' },
              { key: 'manual', icon: Hand,      label: 'Manual — pilih sendiri soal satu per satu', bg: 'bg-blue-100' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold border-2 border-black transition-all duration-150',
                    mode === m.key
                      ? `${m.bg} shadow-none translate-x-[1px] translate-y-[1px]`
                      : 'bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                  )}>
                  <Icon className="w-3.5 h-3.5" />{m.label}
                </button>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 px-8 pb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari soal..."
                className="w-full pl-9 pr-4 py-2 text-sm font-medium border-2 border-black rounded-xl bg-white focus:outline-none shadow-[2px_2px_0px_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none transition-all" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm font-bold border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_#000] focus:outline-none">
              <option value="">Semua Tipe</option>
              {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="px-3 py-2 text-sm font-bold border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_#000] focus:outline-none">
              <option value="">Semua Bahasa</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-extrabold text-black text-lg">Bank soal kosong</p>
                  <p className="text-sm font-medium text-gray-500 mt-1">Buat soal baru untuk mulai membangun paket</p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 font-extrabold px-6 py-3 rounded-xl bg-[#58CC02] text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] transition-all">
                  <Plus className="w-4 h-4" /> Buat Soal Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((q) => (
                  <QuestionCard key={q.id} q={q} isAdded={selectedIds.includes(q.id)} onAdd={handleAdd} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-[300px] shrink-0 border-l-2 border-black overflow-y-auto p-4 bg-[#FAF9F6]">
          <PackagePanel form={form} setForm={setForm} selectedQuestions={selectedQuestions}
            onRemove={handleRemove} onSave={handleSave} saving={saving} languages={languages} />
        </div>
      </div>
    </div>
  )
}
