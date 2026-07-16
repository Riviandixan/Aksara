import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const GRADE_STYLE = {
  A: { bg: 'from-emerald-400 to-green-500',  badge: 'bg-emerald-500',  label: 'Sangat Memuaskan' },
  B: { bg: 'from-blue-400 to-blue-600',       badge: 'bg-blue-500',     label: 'Memuaskan'        },
  C: { bg: 'from-yellow-400 to-amber-500',    badge: 'bg-yellow-500',   label: 'Cukup Baik'       },
}

function fmtDate(date) {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

export default function Certificate({ username, language, grade, score, baseLevel }) {
  const ref        = useRef(null)
  const [busy, setBusy] = useState(false)
  const style      = GRADE_STYLE[grade]
  if (!style) return null  // hanya tampil untuk grade A, B, C

  const handleDownload = async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const link    = document.createElement('a')
      link.download = `sertifikat-${language.toLowerCase()}-grade${grade}.png`
      link.href     = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-extrabold text-black uppercase tracking-widest">Sertifikat</p>

      {/* Certificate card — this gets captured */}
      <div ref={ref}
        className={cn(
          'relative rounded-2xl bg-gradient-to-br p-[3px] shadow-[4px_4px_0px_#000]',
          style.bg
        )}>
        <div className="rounded-[14px] bg-white px-8 py-7 flex flex-col items-center text-center gap-3 relative overflow-hidden">

          {/* Decorative corners */}
          <div className={cn('absolute top-0 left-0 w-16 h-16 rounded-br-full opacity-10', style.badge)} />
          <div className={cn('absolute bottom-0 right-0 w-16 h-16 rounded-tl-full opacity-10', style.badge)} />

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-extrabold', style.badge)}>
              ✦
            </div>
            <p className="text-xs font-extrabold text-black/40 uppercase tracking-[0.2em]">AksaraAI</p>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-extrabold', style.badge)}>
              ✦
            </div>
          </div>

          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest -mt-1">
            Sertifikat Kompetensi Bahasa
          </p>

          <p className="text-sm font-bold text-black/50 mt-1">Diberikan kepada</p>
          <p className="text-2xl font-extrabold text-black">{username}</p>

          <p className="text-sm font-medium text-black/60 leading-relaxed max-w-xs">
            telah berhasil menyelesaikan ujian bahasa
          </p>

          <div className={cn('px-5 py-2 rounded-full border-2 border-black text-white font-extrabold text-base shadow-[2px_2px_0px_#000]', style.badge)}>
            {language} · {baseLevel === 'beginner' ? 'Pemula' : 'Menengah'}
          </div>

          {/* Grade + Score */}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex flex-col items-center">
              <div className={cn('w-16 h-16 rounded-full border-4 border-black flex flex-col items-center justify-center shadow-[3px_3px_0px_#000]', style.badge)}>
                <p className="text-2xl font-extrabold text-white leading-none">{grade}</p>
              </div>
              <p className="text-[10px] font-extrabold text-black/40 mt-1 uppercase">Grade</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-black bg-gray-100 flex flex-col items-center justify-center shadow-[3px_3px_0px_#000]">
                <p className="text-xl font-extrabold text-black leading-none">{score}%</p>
              </div>
              <p className="text-[10px] font-extrabold text-black/40 mt-1 uppercase">Skor</p>
            </div>
          </div>

          <p className={cn('text-sm font-extrabold', style.badge.replace('bg-', 'text-'))}>{style.label}</p>

          <div className="w-full border-t-2 border-dashed border-black/10 pt-3 mt-1">
            <p className="text-[10px] font-bold text-black/30">{fmtDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Download button */}
      <button onClick={handleDownload} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm border-2 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all disabled:opacity-50">
        {busy
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan...</>
          : <><Download className="w-4 h-4" /> Unduh Sertifikat (PNG)</>}
      </button>
    </div>
  )
}
