
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import PatientDetail from '@/pages/PatientDetail';
import Appointments from '@/pages/Appointments';
import DoctorDailySchedule from '@/pages/DoctorDailySchedule';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Lab from '@/pages/Lab';
import { DataSyncProvider } from '@/contexts/DataSyncContext';

const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const rolePermissions = {
    administrador: ['/', '/pacientes', '/pacientes/:id', '/atendimentos', '/laboratorio', '/relatorios', '/configuracoes', '/agenda-diaria'],
    recepcionista: ['/', '/pacientes', '/pacientes/:id', '/atendimentos'],
    enfermeira: ['/', '/pacientes', '/pacientes/:id', '/atendimentos', '/laboratorio', '/configuracoes'],
    medico: ['/', '/pacientes', '/pacientes/:id', '/atendimentos', '/laboratorio', '/relatorios', '/agenda-diaria'],
    laboratorio: ['/', '/laboratorio'],
    paciente: ['/', '/pacientes/:id', '/atendimentos', '/laboratorio'],
  };

  const allowedRoutes = rolePermissions[user.role] || [];
  
  const RouteWrapper = ({ element, path }) => {
    const isAllowed = allowedRoutes.some(allowedPath => {
        if (allowedPath.includes(':id')) {
            if (user.role === 'paciente') {
                const requestedId = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
                return allowedPath.startsWith('/pacientes/') && requestedId === user.patientId;
            }
            const baseAllowedPath = allowedPath.substring(0, allowedPath.indexOf('/:'));
            const baseCurrentPath = path.substring(0, path.lastIndexOf('/'));
            return baseCurrentPath === baseAllowedPath || path === baseAllowedPath;
        }
        return path === allowedPath;
    });

    return isAllowed ? element : <Navigate to="/" />;
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pacientes" element={<RouteWrapper path="/pacientes" element={<Patients />} />} />
        <Route path="/pacientes/:id" element={<RouteWrapper path="/pacientes/:id" element={<PatientDetail />} />} />
        <Route path="/atendimentos" element={<RouteWrapper path="/atendimentos" element={<Appointments />} />} />
        <Route path="/agenda-diaria" element={<RouteWrapper path="/agenda-diaria" element={<DoctorDailySchedule />} />} />
        <Route path="/laboratorio" element={<RouteWrapper path="/laboratorio" element={<Lab />} />} />
        <Route path="/relatorios" element={<RouteWrapper path="/relatorios" element={<Reports />} />} />
        <Route path="/configuracoes" element={<RouteWrapper path="/configuracoes" element={<Settings />} />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Sistema SUS Fluvial - Gestão de Saúde Ribeirinha</title>
        <meta name="description" content="Sistema de gestão hospitalar para SUS fluvial no Amazonas. Funciona offline e sincroniza automaticamente." />
        <meta name="referrer" content="origin-when-cross-origin" />
      </Helmet>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <DataSyncProvider>
            <AppRoutes />
          </DataSyncProvider>
          <Toaster />
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
