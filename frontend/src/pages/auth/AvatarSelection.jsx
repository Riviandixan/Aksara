import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shuffle, Check, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import api from '@/services/api'

// ── Constants ────────────────────────────────────────────────
const BG_COLORS = [
  { label: 'Blue', value: 'b6e3f4', hex: '#b6e3f4' },
  { label: 'Purple', value: 'c0aede', hex: '#c0aede' },
  { label: 'Pink', value: 'ffd5dc', hex: '#ffd5dc' },
  { label: 'Lavender', value: 'd1d4f9', hex: '#d1d4f9' },
  { label: 'Peach', value: 'ffdfbf', hex: '#ffdfbf' },
  { label: 'Cream', value: 'ffecd2', hex: '#ffecd2' },
  { label: 'Grey', value: 'e8e8e8', hex: '#e8e8e8' },
  { label: 'Magenta', value: 'f4b8e4', hex: '#f4b8e4' },
]

const SKIN_COLORS = [
  { label: 'Light', value: 'f8d5c2', hex: '#f8d5c2' },
  { label: 'Medium Light', value: 'e8b89a', hex: '#e8b89a' },
  { label: 'Medium', value: 'd4956a', hex: '#d4956a' },
  { label: 'Medium Dark', value: 'b07040', hex: '#b07040' },
  { label: 'Dark', value: '7c4a1e', hex: '#7c4a1e' },
]

const HAIR_COLORS = [
  { label: 'Black', value: '2c1b18', hex: '#2c1b18' },
  { label: 'Dark Brown', value: '4a2c17', hex: '#4a2c17' },
  { label: 'Medium Brown', value: '7c4a1e', hex: '#7c4a1e' },
  { label: 'Light Brown', value: 'a0522d', hex: '#a0522d' },
  { label: 'Blonde', value: 'f5c842', hex: '#f5c842' },
  { label: 'Cream', value: 'f0e0c0', hex: '#f0e0c0' },
  { label: 'Grey', value: '9e9e9e', hex: '#9e9e9e' },
]

const ACCESSORIES = ['Kacamata', 'Freckles', 'Jenggot', 'Anting']

const ACCESSORY_PARAM = {
  Kacamata: 'glasses',
  Anting: 'earrings',
}

const QUICK_SEEDS = ['luna', 'nova', 'aria', 'zara', 'mika', 'kira', 'lena', 'nora']

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildAvatarUrl({ seed, bgColor, skinColor, hairColor, accessories }) {
  const base = 'https://api.dicebear.com/9.x/miniavs/svg'
  const params = new URLSearchParams({ seed, backgroundColor: bgColor, skinColor, hairColor })

  const accItems = accessories.filter((a) => ACCESSORY_PARAM[a])
  if (accItems.length) {
    accItems.forEach((a) => params.append('accessories', ACCESSORY_PARAM[a]))
    params.set('accessoriesProbability', '100')
    params.set('accessoriesColor', '6d28d9')
  }

  params.set('frecklesProbability', accessories.includes('Freckles') ? '100' : '0')
  params.set('beardProbability', accessories.includes('Jenggot') ? '100' : '0')

  return `${base}?${params.toString()}`
}

// ── Color Dot ─────────────────────────────────────────────────
function ColorDot({ hex, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
        active ? 'border-black scale-110 shadow-[2px_2px_0px_#000]' : 'border-black/20'
      )}
      style={{ backgroundColor: hex }}
    />
  )
}

// ── Section Label ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-extrabold text-black/50 mb-2 uppercase tracking-widest">{children}</p>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function AvatarSelection() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [seed, setSeed] = useState('aksara')
  const [bgColor, setBgColor] = useState(BG_COLORS[0].value)
  const [skinColor, setSkinColor] = useState(SKIN_COLORS[0].value)
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0].value)
  const [accessories, setAccessories] = useState([])
  const [quickSeeds, setQuickSeeds] = useState(QUICK_SEEDS)

  const avatarUrl = buildAvatarUrl({ seed, bgColor, skinColor, hairColor, accessories })

  const randomize = useCallback(() => {
    setSeed(Math.random().toString(36).slice(2, 8))
    setBgColor(randomItem(BG_COLORS).value)
    setSkinColor(randomItem(SKIN_COLORS).value)
    setHairColor(randomItem(HAIR_COLORS).value)
    setAccessories([])
  }, [])

  const toggleAccessory = (item) =>
    setAccessories((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    )

  const regenerateQuick = () =>
    setQuickSeeds(Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 8)))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/avatar', { avatar_url: avatarUrl })
      updateUser({ avatar_url: avatarUrl })
      // Cek apakah user sudah punya learning path
      const res = await api.get('/learning-paths')
      const hasPaths = res.data.data?.length > 0
      navigate(hasPaths ? '/dashboard' : '/language-select?onboarding=1', { replace: true })
    } catch {
      navigate('/language-select?onboarding=1', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-4 py-10">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-black">Pilih Avatar Kamu</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Atur tampilan avatar sesuai kepribadianmu</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Card: Main Editor */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div
                  className="w-32 h-32 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
                  style={{ backgroundColor: `#${bgColor}` }}
                >
                  <img src={avatarUrl} alt="avatar" className="w-full h-full" />
                </div>
                <button
                  onClick={randomize}
                  className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl bg-yellow-300 text-black
                             border-2 border-black shadow-[3px_3px_0px_#000]
                             hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000]
                             active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                             transition-all duration-150"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Random
                </button>
              </div>

              {/* Pickers */}
              <div className="flex flex-col gap-4 flex-1 w-full">
                <div>
                  <SectionLabel>Background</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {BG_COLORS.map((c) => (
                      <ColorDot key={c.value} hex={c.hex} active={bgColor === c.value} onClick={() => setBgColor(c.value)} />
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Kulit</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_COLORS.map((c) => (
                      <ColorDot key={c.value} hex={c.hex} active={skinColor === c.value} onClick={() => setSkinColor(c.value)} />
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Rambut</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((c) => (
                      <ColorDot key={c.value} hex={c.hex} active={hairColor === c.value} onClick={() => setHairColor(c.value)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Card: Aksesori */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
              <div className="px-5 py-3 border-b-2 border-black bg-violet-100">
                <p className="text-sm font-extrabold text-black">Aksesori</p>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {ACCESSORIES.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleAccessory(item)}
                    className={cn(
                      'text-xs font-extrabold px-3 py-1.5 rounded-xl border-2 border-black transition-all duration-150',
                      accessories.includes(item)
                        ? 'bg-violet-400 text-white shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-white text-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000]'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Card: Pilihan Cepat */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-green-200">
                <p className="text-sm font-extrabold text-black">Pilihan Cepat</p>
                <button
                  onClick={regenerateQuick}
                  className="flex items-center gap-1 text-xs font-extrabold text-black border-2 border-black bg-white px-2 py-1 rounded-lg
                             shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Acak
                </button>
              </div>
              <div className="p-4 grid grid-cols-4 gap-2">
                {quickSeeds.map((s) => {
                  const url = buildAvatarUrl({ seed: s, bgColor: randomItem(BG_COLORS).value, skinColor, hairColor, accessories })
                  const isActive = seed === s
                  return (
                    <button
                      key={s}
                      onClick={() => setSeed(s)}
                      className={cn(
                        'w-full aspect-square rounded-xl border-2 overflow-hidden transition-all duration-150',
                        isActive
                          ? 'border-black shadow-none translate-x-[2px] translate-y-[2px]'
                          : 'border-black/30 shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000]'
                      )}
                    >
                      <img src={url} alt={s} className="w-full h-full" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b-2 border-black bg-[#58CC02]">
              <p className="text-sm font-extrabold text-white">Avatar Kamu</p>
              <p className="text-xs font-bold text-white/80 mt-0.5">Sudah siap?</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-6">
              <div
                className="w-36 h-36 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden"
                style={{ backgroundColor: `#${bgColor}` }}
              >
                <img src={avatarUrl} alt="final avatar" className="w-full h-full" />
              </div>

              <button
                disabled={saving}
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 font-extrabold text-sm px-4 py-3 rounded-xl
                           bg-[#58CC02] text-white border-2 border-black shadow-[4px_4px_0px_#000]
                           hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000]
                           active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0
                           transition-all duration-150"
              >
                {saving
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Check className="w-5 h-5" /> Selesai & Simpan</>
                }
              </button>

              <p className="text-xs font-medium text-gray-400 text-center">Bisa diganti nanti di profil</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
