import { useEffect } from 'react'
import { X, Trophy, BookOpen, Zap, Swords, GraduationCap, Medal, Bell, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP = { Trophy, BookOpen, Zap, Swords, GraduationCap, Medal, Bell, Lock }

const TYPE_STYLE = {
  achievement : 'bg-yellow-50 border-yellow-400',
  quiz_complete: 'bg-green-50 border-green-400',
  level_up    : 'bg-blue-50 border-blue-400',
  exam_complete: 'bg-purple-50 border-purple-400',
  battle_result: 'bg-red-50 border-red-400',
}

export default function ToastNotification({ toasts, onDismiss }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const Icon = ICON_MAP[toast.icon] || Bell

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] w-72 animate-slide-in',
      TYPE_STYLE[toast.type] ?? 'bg-white'
    )}>
      <div className="w-8 h-8 rounded-xl border-2 border-black bg-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000]">
        <Icon className="w-4 h-4 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-black">{toast.title}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.message}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 mt-0.5">
        <X className="w-3.5 h-3.5 text-gray-500 hover:text-black" />
      </button>
    </div>
  )
}
