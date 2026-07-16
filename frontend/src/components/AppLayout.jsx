import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#F8F8FB] overflow-hidden">
      <Sidebar />
      <main className="flex-1 w-0 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
