import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationService } from '@/services/notification.service'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [toasts,        setToasts]        = useState([])
  const knownIds = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const res = await notificationService.getAll()
      const data = res.data.data || []
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)

      // Deteksi notif baru setelah fetch pertama
      if (knownIds.current === null) {
        knownIds.current = new Set(data.map((n) => n.id))
      } else {
        const newOnes = data.filter((n) => !knownIds.current.has(n.id))
        if (newOnes.length) {
          setToasts((prev) => [...prev, ...newOnes.map((n) => ({ ...n, toastId: n.id }))])
          newOnes.forEach((n) => knownIds.current.add(n.id))
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Poll setiap 30 detik untuk notif baru
    const interval = setInterval(fetchAll, 30_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id)
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n)
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
    setUnreadCount(0)
  }, [])

  const remove = useCallback(async (id) => {
    const notif = notifications.find((n) => n.id === id)
    await notificationService.remove(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (notif && !notif.is_read) setUnreadCount((c) => Math.max(0, c - 1))
  }, [notifications])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== id))
  }, [])

  return { notifications, unreadCount, loading, markRead, markAllRead, remove, refetch: fetchAll, toasts, dismissToast }
}
