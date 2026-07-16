import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

// Panggil showStreakToast(newStreak) setelah dapat response submit
// Hanya muncul jika streak > 0
export function useStreakToast() {
  const [toast, setToast] = useState(null) // { streak }

  const showStreakToast = (streak) => {
    if (!streak || streak < 1) return
    setToast({ streak })
  }

  const dismiss = () => setToast(null)

  return { toast, showStreakToast, dismiss }
}

export function StreakToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10)
    // Auto dismiss after 3s
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className={cn(
      'fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    )}>
      <div
        className="flex items-center gap-3 bg-white border border-orange-200 shadow-lg shadow-orange-100 rounded-2xl px-5 py-3.5 cursor-pointer"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Streak {toast.streak} hari!</p>
          <p className="text-xs text-slate-500">Kamu konsisten belajar setiap hari 🔥</p>
        </div>
        <div className="ml-2 text-2xl font-black text-orange-500 tabular-nums">
          +1
        </div>
      </div>
    </div>
  )
}
