import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Sparkles, ChevronRight, GraduationCap, Zap, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { languageService, learningPathService } from '@/services/learning.service'

const LEVELS = [
  { value: 'beginner',     label: 'Pemula',   desc: 'Baru mulai dari nol',       icon: GraduationCap, bg: 'bg-emerald-100', activeBg: 'bg-emerald-400' },
  { value: 'intermediate', label: 'Menengah', desc: 'Sudah tahu dasar-dasarnya', icon: Zap,            bg: 'bg-yellow-100',  activeBg: 'bg-yellow-400'  },
]

const LANG_COLORS = {
  en: { bg: 'bg-blue-100',   activeBg: 'bg-blue-400'   },
  ja: { bg: 'bg-red-100',    activeBg: 'bg-red-400'    },
  ko: { bg: 'bg-violet-100', activeBg: 'bg-violet-400' },
  fr: { bg: 'bg-indigo-100', activeBg: 'bg-indigo-400' },
  de: { bg: 'bg-slate-100',  activeBg: 'bg-slate-500'  },
  zh: { bg: 'bg-rose-100',   activeBg: 'bg-rose-400'   },
  ru: { bg: 'bg-sky-100',    activeBg: 'bg-sky-400'    },
  es: { bg: 'bg-orange-100', activeBg: 'bg-orange-400' },
}
const LANG_ABBR = { en: 'EN', ja: 'JA', ko: 'KO', fr: 'FR', de: 'DE', zh: 'ZH', ru: 'RU', es: 'ES' }

export default function LanguageSelect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isOnboarding   = searchParams.get('onboarding') === '1'
  const presetLangId   = searchParams.get('lang_id')
  const presetLevel    = searchParams.get('level')

  const [languages,     setLanguages]     = useState([])
  const [selectedLang,  setSelectedLang]  = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(presetLevel || 'beginner')
  const [loading,       setLoading]       = useState(false)
  const [fetching,      setFetching]      = useState(true)
  const [error,         setError]         = useState('')

  useEffect(() => {
    languageService.getAll()
      .then((res) => {
        const langs = res.data.data
        setLanguages(langs)
        if (presetLangId) {
          const match = langs.find((l) => String(l.id) === String(presetLangId))
          if (match) setSelectedLang(match)
        }
      })
      .catch(() => setError('Gagal memuat daftar bahasa'))
      .finally(() => setFetching(false))
  }, [])

  const handleGenerate = async () => {
    if (!selectedLang) return
    setLoading(true)
    setError('')
    try {
      await learningPathService.generate({
        language_id: selectedLang.id,
        base_level:  selectedLevel,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Jalur belajar untuk bahasa dan level ini sudah ada')
      } else {
        setError(err.response?.data?.message || 'Gagal membuat jalur belajar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-8 py-8 w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          {isOnboarding ? (
            <div className="bg-black text-white rounded-2xl border-2 border-black p-5 mb-6 shadow-[4px_4px_0px_#555]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#58CC02] border-2 border-white flex items-center justify-center shadow-[2px_2px_0px_#fff]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="font-extrabold text-white text-lg">Selamat datang! 🎉</p>
              </div>
              <p className="text-gray-400 text-sm font-medium">Pilih bahasa pertamamu dan AI akan membuat jalur belajar personal untukmu secara otomatis.</p>
            </div>
          ) : presetLevel === 'intermediate' ? (
            <div className="bg-blue-50 border-2 border-black rounded-2xl p-4 mb-6 shadow-[3px_3px_0px_#000] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-400 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-black text-sm">Naik ke Level Intermediate! 🚀</p>
                <p className="text-xs font-medium text-black/60 mt-0.5">Bahasa dan level sudah dipilih otomatis. Langsung klik "Buat Jalur Belajar" untuk mulai.</p>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm font-extrabold text-black mb-6 border-2 border-black bg-white px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-[2px_2px_0px_#555]">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Learning Path
          </div>
          <h1 className="text-3xl font-extrabold text-black">Pilih Bahasa</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">AI akan membuat jalur belajar personal untukmu</p>
        </div>
        
        {/* Language Grid */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {languages.map((lang) => {
              const style    = LANG_COLORS[lang.code] || LANG_COLORS.en
              const isActive = selectedLang?.id === lang.id
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-black transition-all duration-150 font-bold',
                    isActive
                      ? `${style.activeBg} text-white shadow-none translate-x-[3px] translate-y-[3px]`
                      : `${style.bg} text-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]`
                  )}
                >
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

        {/* Level Selection */}
        <div className="mb-6">
          <p className="text-sm font-extrabold text-black mb-3 uppercase tracking-wide">Level Awal</p>
          <div className="grid grid-cols-2 gap-3">
            {LEVELS.map((lvl) => {
              const Icon     = lvl.icon
              const isActive = selectedLevel === lvl.value
              return (
                <button
                  key={lvl.value}
                  onClick={() => setSelectedLevel(lvl.value)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-2xl border-2 border-black text-left transition-all duration-150',
                    isActive
                      ? `${lvl.activeBg} text-white shadow-none translate-x-[2px] translate-y-[2px]`
                      : `${lvl.bg} text-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]`
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center shrink-0',
                    isActive ? 'bg-white/30' : 'bg-white shadow-[2px_2px_0px_#000]'
                  )}>
                    <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-black')} />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm">{lvl.label}</p>
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-white/80' : 'text-gray-500')}>{lvl.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm font-bold text-red-700 bg-red-100 border-2 border-black px-3 py-2.5 rounded-xl mb-4 shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        <button
          className={cn(
            'w-full h-12 text-sm font-extrabold gap-2 rounded-xl border-2 border-black flex items-center justify-center transition-all duration-150',
            !selectedLang || loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#58CC02] text-white shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
          )}
          disabled={!selectedLang || loading}
          onClick={handleGenerate}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />AI sedang membuat jalur belajar...</>
          ) : (
            <><Sparkles className="w-4 h-4" />Buat Jalur Belajar<ChevronRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-center text-xs font-medium text-gray-400 mt-3">Proses ini membutuhkan beberapa detik</p>
      </div>
    </div>
  )
}
