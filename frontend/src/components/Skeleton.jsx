import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-black/8 rounded-xl', className)} />
  )
}
