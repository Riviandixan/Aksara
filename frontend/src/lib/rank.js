import { Crown, Gem, Star, Sprout, Shield } from 'lucide-react'

/**
 * Tier system berdasarkan XP + jumlah achievement
 * Tier lebih tinggi = XP lebih besar atau achievement lebih banyak
 */
export const RANKS = [
  {
    id:        'legend',
    label:     'Legenda',
    minXp:     5000,
    minAch:    12,
    card:      'bg-gradient-to-br from-yellow-300 via-amber-200 to-orange-300',
    border:    'border-yellow-500',
    shadow:    'shadow-[3px_3px_0px_#d97706]',
    badge:     'bg-yellow-400 border-yellow-600 text-black',
    Icon:      Crown,
    iconColor: 'text-yellow-700',
  },
  {
    id:        'master',
    label:     'Master',
    minXp:     2000,
    minAch:    8,
    card:      'bg-gradient-to-br from-violet-200 via-purple-100 to-fuchsia-200',
    border:    'border-violet-500',
    shadow:    'shadow-[3px_3px_0px_#7c3aed]',
    badge:     'bg-violet-400 border-violet-600 text-white',
    Icon:      Gem,
    iconColor: 'text-violet-700',
  },
  {
    id:        'expert',
    label:     'Expert',
    minXp:     1000,
    minAch:    5,
    card:      'bg-gradient-to-br from-blue-200 via-cyan-100 to-sky-200',
    border:    'border-blue-400',
    shadow:    'shadow-[3px_3px_0px_#2563eb]',
    badge:     'bg-blue-400 border-blue-600 text-white',
    Icon:      Star,
    iconColor: 'text-blue-700',
  },
  {
    id:        'intermediate',
    label:     'Menengah',
    minXp:     300,
    minAch:    2,
    card:      'bg-gradient-to-br from-green-200 via-emerald-100 to-teal-200',
    border:    'border-green-400',
    shadow:    'shadow-[3px_3px_0px_#16a34a]',
    badge:     'bg-green-400 border-green-600 text-white',
    Icon:      Sprout,
    iconColor: 'text-green-700',
  },
  {
    id:        'beginner',
    label:     'Pemula',
    minXp:     0,
    minAch:    0,
    card:      'bg-white',
    border:    'border-black',
    shadow:    'shadow-[3px_3px_0px_#000]',
    badge:     'bg-gray-100 border-black text-black',
    Icon:      Shield,
    iconColor: 'text-gray-500',
  },
]

/**
 * @param {number} xp
 * @param {number} unlockedAchievements
 * @returns {object} rank object
 */
export function getRank(xp = 0, unlockedAchievements = 0) {
  return RANKS.find(
    (r) => xp >= r.minXp && unlockedAchievements >= r.minAch
  ) ?? RANKS[RANKS.length - 1]
}
