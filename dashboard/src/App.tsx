import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contacts from '@/pages/Contacts'
import Conversations from '@/pages/Conversations'
import Agents from '@/pages/Agents'

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/"          element={<Protected><Dashboard /></Protected>} />
          <Route path="/agentes"   element={<Protected><Agents /></Protected>} />
          <Route path="/contatos"  element={<Protected><Contacts /></Protected>} />
          <Route path="/conversas" element={<Protected><Conversations /></Protected>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
