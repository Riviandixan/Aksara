import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Globe, Trophy, Settings,
  LogOut, ChevronLeft, ChevronRight, Flame, Zap, Sparkles, FolderOpen, History, BarChart2, GraduationCap, Swords, Medal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { achievementService } from '@/services/achievement.service'
import { getRank } from '@/lib/rank'
import NotificationBell from '@/components/NotificationBell'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda', section: 'main' },
  { to: '/language-select', icon: Globe, label: 'Tambah Bahasa', section: 'main' },
  { to: '/quiz-packages', icon: FolderOpen, label: 'Paket Soal', section: 'main' },
  { to: '/exam', icon: GraduationCap, label: 'Ujian', section: 'main' },
  { to: '/battle', icon: Swords, label: 'Battle Room', section: 'main' },
  { to: '/history', icon: History, label: 'Riwayat', section: 'main' },
  { to: '/analytics', icon: BarChart2, label: 'Analitik', section: 'main' },
  { to: '/achievements', icon: Medal, label: 'Pencapaian', section: 'main' },
  { to: '/leaderboard', icon: Trophy, label: 'Papan Peringkat', section: 'main' },
  { to: '/settings', icon: Settings, label: 'Pengaturan', section: 'bottom' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [unlockedCount, setUnlockedCount] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    achievementService.getAll()
      .then((res) => setUnlockedCount(res.data.data.filter((a) => a.unlocked).length))
      .catch(() => { })
  }, [user?.xp])

  const rank = getRank(user?.xp ?? 0, unlockedCount)

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#FAF9F6] border-r-2 border-black transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-6 z-10 w-7 h-7 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-black" />
          : <ChevronLeft className="w-3.5 h-3.5 text-black" />
        }
      </button>

      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-5 overflow-hidden', collapsed && 'justify-center px-0')}>
        <div className="w-9 h-9 rounded-xl bg-[#58CC02] border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className={cn(
          'font-extrabold text-black text-lg whitespace-nowrap transition-all duration-200',
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>
          AksaraAI
        </span>
      </div>

      {/* Avatar + Stats */}
      <div className={cn(
        'mx-3 mb-4 p-3 rounded-xl border-2 transition-all duration-200',
        rank.card, rank.border, rank.shadow,
        collapsed && 'mx-2 p-2'
      )}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-black shrink-0 cursor-pointer"
            style={{ backgroundColor: '#b6e3f4' }}
            onClick={() => navigate('/avatar')}
          >
            <img src={user?.avatar_url} alt="avatar" className="w-full h-full" />
          </div>
          <div className={cn('overflow-hidden transition-all duration-200', collapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100')}>
            <Link to={`/profile/${user?.username}`} className="font-bold text-sm text-black truncate hover:underline block">{user?.username}</Link>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Rank badge */}
        {!collapsed && (
          <div className={cn(
            'mt-2 flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-[10px] font-extrabold w-fit',
            rank.badge
          )}>
            <rank.Icon className={cn('w-3 h-3', rank.iconColor)} />
            <span>{rank.label}</span>
          </div>
        )}

        {/* XP & Streak */}
        <div className={cn(
          'flex gap-2 mt-2 transition-all duration-200',
          collapsed ? 'flex-col items-center' : 'flex-row'
        )}>
          <div className="flex items-center gap-1.5 bg-orange-100 border-2 border-black rounded-lg px-2 py-1.5 flex-1 justify-center shadow-[2px_2px_0px_#000]">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            {!collapsed && <span className="text-xs font-bold text-black">{user?.streak || 0}</span>}
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-100 border-2 border-black rounded-lg px-2 py-1.5 flex-1 justify-center shadow-[2px_2px_0px_#000]">
            <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
            {!collapsed && <span className="text-xs font-bold text-black">{user?.xp || 0}</span>}
          </div>
        </div>
      </div>

      {/* Nav Label */}
      {!collapsed && (
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Menu
        </p>
      )}

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {NAV_ITEMS.filter((i) => i.section === 'main').map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t-2 border-black pt-3">
        {NAV_ITEMS.filter((i) => i.section === 'bottom').map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        <NotificationBell collapsed={collapsed} />

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 border-2 border-transparent hover:border-black hover:bg-red-50 hover:text-red-500 hover:shadow-[2px_2px_0px_#000] transition-all duration-150 w-full',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={cn(
            'whitespace-nowrap transition-all duration-200',
            collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'
          )}>
            Keluar
          </span>
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, collapsed }) {
  const { icon: Icon, to, label } = item

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 border-2',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-[#58CC02] text-white border-black shadow-[3px_3px_0px_#000]'
          : 'text-gray-600 border-transparent hover:border-black hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_#000]'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className={cn(
        'whitespace-nowrap transition-all duration-200',
        collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'
      )}>
        {label}
      </span>
    </NavLink>
  )
}
