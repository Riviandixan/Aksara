import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, X, CheckCheck, Trash2,
  Trophy, BookOpen, Zap, Swords, GraduationCap, Medal, Lock, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import ToastNotification from '@/components/ToastNotification'

const ICON_MAP = { Trophy, BookOpen, Zap, Swords, GraduationCap, Medal, Bell, Lock, Users }

const TYPE_STYLE = {
  achievement:   { bg: 'bg-yellow-50',  border: 'border-yellow-300', dot: 'bg-yellow-400' },
  quiz_complete: { bg: 'bg-green-50',   border: 'border-green-300',  dot: 'bg-green-500'  },
  level_up:      { bg: 'bg-violet-50',  border: 'border-violet-300', dot: 'bg-violet-500' },
  exam_complete: { bg: 'bg-blue-50',    border: 'border-blue-300',   dot: 'bg-blue-500'   },
  battle_result: { bg: 'bg-red-50',     border: 'border-red-300',    dot: 'bg-red-500'    },
  new_follower:  { bg: 'bg-cyan-50',    border: 'border-cyan-300',   dot: 'bg-cyan-500'   },
  default:       { bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-400'   },
}

// Ekstrak username dari pesan notif follow: "@ujang mulai..." → "ujang"
function extractFollowerUsername(message) {
  const match = message?.match(/^@(\S+)/)
  return match ? match[1] : null
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function NotificationBell({ collapsed }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)
  const navigate        = useNavigate()
  const { notifications, unreadCount, loading, markRead, markAllRead, remove, toasts, dismissToast } = useNotifications()

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id)
    if (n.type === 'new_follower') {
      const username = extractFollowerUsername(n.message)
      if (username) {
        setOpen(false)
        navigate(`/profile/${username}`)
      }
    }
  }

  const handleRemove = (e, id) => {
    e.stopPropagation()
    remove(id)
  }

  return (
    <div ref={ref} className="relative">
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 border-2 w-full',
          open
            ? 'bg-[#58CC02] text-white border-black shadow-[3px_3px_0px_#000]'
            : 'text-gray-600 border-transparent hover:border-black hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_#000]',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="relative shrink-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 border border-white text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className={cn(
          'whitespace-nowrap transition-all duration-200',
          collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'
        )}>
          Notifikasi
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          'absolute z-50 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_#000] overflow-hidden',
          collapsed
            ? 'left-12 bottom-0 w-80'
            : 'left-full ml-2 bottom-0 w-80'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-black" />
              <p className="font-extrabold text-sm text-black">Notifikasi</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tandai semua dibaca"
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                <Bell className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-bold text-gray-400">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {notifications.map((n) => {
                  const style  = TYPE_STYLE[n.type] || TYPE_STYLE.default
                  const Icon   = ICON_MAP[n.icon] || Bell
                  const unread = !n.is_read

                  return (
                    <div
                      key={n.id}
                       onClick={() => handleClick(n)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors group cursor-pointer',
                        unread ? `${style.bg} hover:brightness-95` : 'bg-white hover:bg-gray-50'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000] mt-0.5',
                        unread ? style.bg : 'bg-gray-100'
                      )}>
                        <Icon className="w-4 h-4 text-black" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={cn('text-xs font-extrabold text-black leading-tight', unread && 'text-black')}>
                            {n.title}
                          </p>
                          {unread && <span className={cn('w-2 h-2 rounded-full shrink-0 mt-1', style.dot)} />}
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 text-gray-300 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
