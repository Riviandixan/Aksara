import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'

import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import AvatarSelection from '@/pages/auth/AvatarSelection'

import Dashboard from '@/pages/learning/Dashboard'
import LanguageSelect from '@/pages/learning/LanguageSelect'
import LearningPath from '@/pages/learning/LearningPath'
import Quiz from '@/pages/learning/Quiz'
import History from '@/pages/learning/History'
import HistoryDetail from '@/pages/learning/HistoryDetail'

import Leaderboard from '@/pages/leaderboard/Leaderboard'
import Analytics from '@/pages/analytics/Analytics'
import Settings from '@/pages/settings/Settings'

import Exam from '@/pages/exam/Exam'
import QuizPackages from '@/pages/quiz-packages/QuizPackages'
import CreatePackage from '@/pages/quiz-packages/CreatePackage'
import PackageDetail from '@/pages/quiz-packages/PackageDetail'
import PackageQuiz from '@/pages/quiz-packages/PackageQuiz'
import Battle from '@/pages/battle/Battle'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding — no sidebar */}
          <Route path="/avatar" element={<ProtectedRoute><AvatarSelection /></ProtectedRoute>} />

          {/* Protected — with sidebar layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/language-select" element={<LanguageSelect />} />
            <Route path="/learning-path/:id" element={<LearningPath />} />
            <Route path="/quiz/:levelId" element={<Quiz />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<HistoryDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/quiz-packages" element={<QuizPackages />} />
            <Route path="/quiz-packages/create" element={<CreatePackage />} />
            <Route path="/quiz-packages/:id" element={<PackageDetail />} />
            <Route path="/quiz-packages/:id/play" element={<PackageQuiz />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
