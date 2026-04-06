import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Contacts from '@/pages/Contacts'
import Conversations from '@/pages/Conversations'
import Agents from '@/pages/Agents'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'
import Leads from '@/pages/Leads'

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent', 'viewer']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/conversas" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
              <Conversations />
            </ProtectedRoute>
          } />
          <Route path="/contatos" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
              <Contacts />
            </ProtectedRoute>
          } />
          <Route path="/agentes" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Agents />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'viewer']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'agent']}>
              <Leads />
            </ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  )
}
