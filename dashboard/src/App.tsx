import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contacts from '@/pages/Contacts'
import Conversations from '@/pages/Conversations'
import Agents from '@/pages/Agents'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'

function Protected({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Dashboard + Analytics: todos os roles */}
          <Route path="/"          element={<Protected><Dashboard /></Protected>} />
          <Route path="/analytics" element={<Protected><Analytics /></Protected>} />

          {/* Conversas + Contatos: super_admin, admin, agent */}
          <Route path="/conversas" element={<Protected roles={['super_admin', 'admin', 'agent']}><Conversations /></Protected>} />
          <Route path="/contatos"  element={<Protected roles={['super_admin', 'admin', 'agent']}><Contacts /></Protected>} />

          {/* Agentes + Configurações: super_admin, admin */}
          <Route path="/agentes"       element={<Protected roles={['super_admin', 'admin']}><Agents /></Protected>} />
          <Route path="/configuracoes" element={<Protected roles={['super_admin', 'admin']}><Settings /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
