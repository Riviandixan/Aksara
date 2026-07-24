import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Flame, Zap, Swords, Trophy, BookOpen, Medal,
  CalendarCheck, ArrowLeft, Lock, UserPlus, UserCheck, X,
  BatteryMedium, BatteryFull, Crown, MapPin, Map,
  ClipboardList, GraduationCap, Shield, Globe, Globe2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRank } from '@/lib/rank'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profile.service'
import { followService } from '@/services/follow.service'
import { Skeleton } from '@/components/Skeleton'

const ICON_MAP = {
  Zap, BatteryMedium, BatteryFull, Crown, Flame, CalendarCheck,
  Trophy, MapPin, BookOpen, Map, ClipboardList, GraduationCap,
  Swords, Medal, Shield, Globe, Globe2,
}

const CATEGORY_COLOR = {
  xp: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  streak: 'bg-orange-100 border-orange-400 text-orange-700',
  level: 'bg-violet-100 border-violet-400 text-violet-700',
  exam: 'bg-blue-100   border-blue-400   text-blue-700',
  battle: 'bg-red-100    border-red-400    text-red-700',
  language: 'bg-green-100  border-green-400  text-green-700',
}

// ── Modal daftar followers / following ───────────────────────
function UserListModal({ title, users, onClose, onNavigate }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_#000] w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black">
          <p className="font-extrabold text-black">{title}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3 flex flex-col gap-2">
          {users.length === 0 ? (
            <p className="text-center text-sm font-bold text-black/40 py-6">Belum ada</p>
          ) : users.map((u) => (
            <button
              key={u.username}
              onClick={() => { onClose(); onNavigate(`/profile/${u.username}`) }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-transparent hover:border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_#000] transition-all text-left"
            >
              <img src={u.avatar_url} alt={u.username} className="w-9 h-9 rounded-full border-2 border-black object-cover shrink-0" />
              <p className="font-extrabold text-sm text-black">@{u.username}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_#000] p-4 flex flex-col items-center gap-1">
      <div className={cn('w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xl font-extrabold text-black">{value}</p>
      <p className="text-[11px] font-bold text-black/50 text-center">{label}</p>
    </div>
  )
}

function BadgeChip({ ach }) {
  const AchIcon = ICON_MAP[ach.icon] ?? Medal
  const colorClass = CATEGORY_COLOR[ach.category] ?? 'bg-gray-100 border-black text-black'
  return (
    <div className={cn('flex items-center gap-2 rounded-xl border-2 px-3 py-2 shadow-[2px_2px_0px_#000]', colorClass)}>
      <AchIcon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-extrabold leading-tight truncate">{ach.title}</p>
        <p className="text-[10px] font-medium opacity-70 leading-tight truncate">{ach.description}</p>
      </div>
    </div>
  )
}

function BattleRow({ battle }) {
  const won = battle.finish_rank === 1
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
      <div className={cn(
        'w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 text-sm font-extrabold',
        won ? 'bg-yellow-300' : 'bg-gray-100'
      )}>
        {won ? '🏆' : `#${battle.finish_rank}`}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold text-black">
          {won ? 'Menang' : `Peringkat ${battle.finish_rank}`}
          <span className="ml-1 font-medium text-black/50">dari {battle.total_players} pemain</span>
        </p>
        <p className="text-[10px] text-black/40 font-medium">
          {new Date(battle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-1 bg-yellow-100 border border-black rounded-full px-2 py-0.5 shrink-0">
        <Zap className="w-3 h-3 text-yellow-600" />
        <span className="text-xs font-extrabold text-black">{battle.score}</span>
      </div>
    </div>
  )
}

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followData, setFollowData] = useState({ is_following: false, is_followed_by: false, followers: 0, following: 0 })
  const [followLoading, setFollowLoading] = useState(false)
  // null | 'followers' | 'following'
  const [modal, setModal] = useState(null)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    profileService.getPublicProfile(username)
      .then((res) => setProfile(res.data.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [username])

  useEffect(() => {
    if (!me || !username) return
    followService.getStatus(username)
      .then((res) => setFollowData(res.data.data))
      .catch(() => { })
  }, [username, me])

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      if (followData.is_following) {
        await followService.unfollow(username)
        setFollowData((p) => ({ ...p, is_following: false, followers: p.followers - 1 }))
      } else {
        await followService.follow(username)
        setFollowData((p) => ({ ...p, is_following: true, followers: p.followers + 1 }))
      }
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-6 py-8 w-full max-w-2xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-8 w-24" />
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex gap-5">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  )

  if (notFound) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-[#FAF9F6]">
      <p className="text-6xl">🔍</p>
      <p className="text-xl font-extrabold text-black">User tidak ditemukan</p>
      <p className="text-sm text-black/50 font-medium">@{username} tidak ada di AksaraAI</p>
      <button
        onClick={() => navigate(-1)}
        className="mt-2 flex items-center gap-2 bg-white border-2 border-black rounded-xl px-4 py-2 font-extrabold text-sm shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>
    </div>
  )

  const rank = getRank(profile.xp, profile.stats.total_badges)
  const { Icon: RankIcon } = rank
  const isMe = me?.username === profile.username

  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F6]">
      <div className="px-6 py-8 w-full max-w-2xl mx-auto flex flex-col gap-6">

        {/* Modal followers / following */}
        {modal === 'followers' && (
          <UserListModal
            title={`Pengikut (${followData.followers})`}
            users={profile.followers ?? []}
            onClose={() => setModal(null)}
            onNavigate={navigate}
          />
        )}
        {modal === 'following' && (
          <UserListModal
            title={`Mengikuti (${followData.following})`}
            users={profile.following ?? []}
            onClose={() => setModal(null)}
            onNavigate={navigate}
          />
        )}

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-extrabold text-black/60 hover:text-black transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Hero card */}
        <div className={cn('rounded-2xl border-2 border-black p-6 flex gap-5 items-start', rank.card, rank.shadow)}>
          <div className={cn('w-20 h-20 rounded-full border-4 overflow-hidden shrink-0', rank.border)}>
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-black truncate">@{profile.username}</h1>
              {isMe && (
                <span className="text-[10px] font-extrabold bg-[#58CC02] text-white px-2 py-0.5 rounded-full border border-black">Kamu</span>
              )}
            </div>
            <div className={cn('inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full border-2 text-xs font-extrabold', rank.badge, rank.border)}>
              <RankIcon className={cn('w-3.5 h-3.5', rank.iconColor)} />
              {rank.label}
            </div>
            <p className="text-[11px] text-black/40 font-medium mt-1.5">
              Bergabung {new Date(profile.joined_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>

            {/* Follow stats — klik untuk buka modal */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                onClick={() => setModal('followers')}
                className="text-xs font-bold text-black/60 hover:text-black hover:underline transition-colors"
              >
                <span className="font-extrabold text-black">{followData.followers}</span> pengikut
              </button>
              <button
                onClick={() => setModal('following')}
                className="text-xs font-bold text-black/60 hover:text-black hover:underline transition-colors"
              >
                <span className="font-extrabold text-black">{followData.following}</span> mengikuti
              </button>

              {!isMe && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black text-xs font-extrabold shadow-[2px_2px_0px_#000] transition-all',
                    'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000]',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    followData.is_following ? 'bg-gray-100 text-black' : 'bg-[#58CC02] text-white'
                  )}
                >
                  {followData.is_following
                    ? <><UserCheck className="w-3.5 h-3.5" /> Mengikuti</>
                    : followData.is_followed_by
                      ? <><UserPlus className="w-3.5 h-3.5" /> Ikuti Balik</>
                      : <><UserPlus className="w-3.5 h-3.5" /> Ikuti</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard icon={Zap} label="Total XP" value={profile.xp.toLocaleString()} color="bg-yellow-100" />
          <StatCard icon={Flame} label="Streak" value={profile.streak} color="bg-orange-100" />
          <StatCard icon={BookOpen} label="Level Selesai" value={profile.stats.completed_levels} color="bg-violet-100" />
          <StatCard icon={Swords} label="Battle Menang" value={`${profile.stats.battle_wins}/${profile.stats.total_battles}`} color="bg-red-100" />
        </div>

        {/* Bahasa aktif */}
        {profile.languages.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <p className="text-xs font-extrabold text-black/50 uppercase tracking-widest mb-4">Bahasa Dipelajari</p>
            <div className="flex flex-col gap-3">
              {profile.languages.map((lang) => {
                const pct = lang.total_levels ? Math.round((lang.completed_levels / lang.total_levels) * 100) : 0
                return (
                  <div key={lang.code} className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-extrabold text-black">{lang.name}</p>
                        <p className="text-xs font-bold text-black/50">{lang.completed_levels}/{lang.total_levels} level</p>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full border-2 border-black overflow-hidden">
                        <div
                          className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <p className="text-xs font-extrabold text-black/50 uppercase tracking-widest mb-4">
              Badge Diraih <span className="ml-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded-full">{profile.badges.length}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profile.badges.map((b) => <BadgeChip key={b.id} ach={b} />)}
            </div>
          </div>
        )}

        {/* Riwayat Battle */}
        {profile.battle_history.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <p className="text-xs font-extrabold text-black/50 uppercase tracking-widest mb-4">Riwayat Battle</p>
            <div className="flex flex-col gap-2">
              {profile.battle_history.map((b) => <BattleRow key={b.id} battle={b} />)}
            </div>
          </div>
        )}

        {profile.badges.length === 0 && profile.languages.length === 0 && (
          <div className="text-center py-8">
            <Lock className="w-10 h-10 text-black/20 mx-auto mb-2" />
            <p className="text-sm font-bold text-black/40">Belum ada aktivitas</p>
          </div>
        )}

      </div>
    </div>
  )
}
