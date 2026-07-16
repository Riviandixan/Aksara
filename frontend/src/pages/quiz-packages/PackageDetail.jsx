import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Users, Lock, Loader2, Globe, Pencil, Trash2, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { packageService } from '@/services/package.service'
import { useAuth } from '@/hooks/useAuth'

const TYPES = {
  multiple_choice: 'Pilihan Ganda',
  translate:       'Terjemahan',
  word_arrange:    'Susun Kata',
}
const TYPE_COLORS = {
  multiple_choice: 'bg-blue-100 text-blue-800',
  translate:       'bg-violet-100 text-violet-800',
  word_arrange:    'bg-yellow-100 text-yellow-800',
}

function QuestionCard({ q, index }) {
  const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data

  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000] p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 text-xs font-extrabold text-white shadow-[2px_2px_0px_#555]">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn('text-[11px] font-extrabold px-2 py-0.5 rounded-full border-2 border-black inline-block mb-2', TYPE_COLORS[q.type])}>
            {TYPES[q.type]}
          </span>

          {q.type === 'multiple_choice' && (
            <>
              <p className="text-sm font-bold text-black mb-2">{data.question}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {data.options?.map((opt, i) => (
                  <div key={i} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border-2 border-black bg-gray-50 text-black shadow-[1px_1px_0px_#000]">
                    {opt}
                  </div>
                ))}
              </div>
            </>
          )}

          {q.type === 'translate' && (
            <p className="text-sm font-bold text-black">{data.sentence}</p>
          )}

          {q.type === 'word_arrange' && (
            <div className="flex flex-wrap gap-1.5">
              {data.words?.map((w, i) => (
                <span key={i} className="text-xs font-extrabold bg-yellow-100 text-black px-2.5 py-1 rounded-lg border-2 border-black shadow-[1px_1px_0px_#000]">{w}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PackageDetail() {
  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const { user }                  = useAuth()
  const [pkg, setPkg]             = useState(null)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    packageService.get(id)
      .then((r) => setPkg(r.data.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Hapus paket ini?')) return
    setDeleting(true)
    await packageService.remove(id)
    navigate('/quiz-packages')
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (!pkg) return (
    <div className="flex flex-col items-center gap-3 py-32 text-center">
      <p className="font-extrabold text-black">Paket tidak ditemukan</p>
      <button onClick={() => navigate('/quiz-packages')}
        className="px-4 py-2 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
        Kembali
      </button>
    </div>
  )

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/quiz-packages')}
            className="p-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-black truncate">{pkg.title}</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">oleh {pkg.author}</p>
          </div>
          {pkg.is_mine && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => navigate(`/quiz-packages/${id}/edit`)}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl border-2 border-red-400 bg-red-100 text-red-700 shadow-[2px_2px_0px_#f87171] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5 mb-5">
          {pkg.description && <p className="text-sm font-medium text-gray-600 mb-4 pb-4 border-b-2 border-black/10">{pkg.description}</p>}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-violet-100 border-2 border-black rounded-full px-3 py-1.5 shadow-[2px_2px_0px_#000]">
                <Globe className="w-4 h-4 text-black" />
                <span className="text-sm font-extrabold text-black">{pkg.language_name}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 border-2 border-black rounded-full px-3 py-1.5 shadow-[2px_2px_0px_#000]">
                <BookOpen className="w-4 h-4 text-black" />
                <span className="text-sm font-extrabold text-black">{pkg.questions?.length || 0} soal</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 border-2 border-black rounded-full px-3 py-1.5 shadow-[2px_2px_0px_#000]">
                {pkg.is_public ? <Users className="w-4 h-4 text-black" /> : <Lock className="w-4 h-4 text-black" />}
                <span className="text-sm font-extrabold text-black">{pkg.is_public ? 'Publik' : 'Privat'}</span>
              </div>
            </div>
            {pkg.questions?.length > 0 && (
              <button onClick={() => navigate(`/quiz-packages/${id}/play`)}
                className="flex items-center gap-2 font-extrabold px-5 py-2.5 rounded-xl bg-[#58CC02] text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
                <PlayCircle className="w-4 h-4" /> Mulai Latihan
              </button>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-black bg-blue-100">
            <p className="font-extrabold text-black">Daftar Soal</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {pkg.questions?.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-400">Paket ini belum memiliki soal</p>
              </div>
            ) : (
              pkg.questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
