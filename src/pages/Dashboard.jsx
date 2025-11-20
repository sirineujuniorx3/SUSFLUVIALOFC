import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, Calendar, Activity, TrendingUp, UserPlus, Stethoscope, Beaker, HeartPulse, UserCircle, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { formatDate } from '@/lib/utils';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    pendingTests: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const { user } = useAuth();
  const { getData } = useDataSync();

  const fetchStats = useCallback(async () => {
    try {
      const [patients, appointments, labTests] = await Promise.all([
        getData('patients'),
        getData('appointments'),
        getData('labTests'),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let filteredAppointments = appointments;
      let filteredLabTests = labTests;
      let relevantPatients = patients;

      if (user.role === 'paciente') {
        filteredAppointments = appointments.filter(a => a.patient_id === user.patientId);
        filteredLabTests = labTests.filter(t => t.patient_id === user.patientId);
        relevantPatients = patients.filter(p => p.id === user.patientId);
      }
      
      const todayAppointments = filteredAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      }).length;

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0,0,0,0);
      
      const weeklyAppointments = filteredAppointments.filter(apt => new Date(apt.date) >= weekStart).length;
      const pendingTests = filteredLabTests.filter(t => t.status === 'Pendente').length;
      
      setRecentAppointments(filteredAppointments.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 3));

      setStats({
        totalPatients: relevantPatients.length,
        todayAppointments,
        weeklyAppointments,
        pendingTests
      });
    } catch(error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [getData, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const allQuickActions = [
    { title: 'Novo Paciente', icon: UserPlus, color: 'from-emerald-500 to-teal-600', link: '/pacientes?action=add', roles: ['administrador', 'enfermeira', 'recepcionista'] },
    { title: 'Agendar Atendimento', icon: Stethoscope, color: 'from-blue-500 to-indigo-600', link: '/atendimentos?action=add', roles: ['administrador', 'enfermeira', 'medico', 'recepcionista'] },
    { title: 'Solicitar Exame', icon: Beaker, color: 'from-cyan-500 to-sky-600', link: '/laboratorio?action=add', roles: ['administrador', 'medico', 'enfermeira'] },
    { title: 'Ver Agenda do Dia', icon: ClipboardList, color: 'from-indigo-500 to-purple-600', link: '/agenda-diaria', roles: ['medico'] },
  ];
  
  const quickActions = allQuickActions.filter(action => user && action.roles.includes(user.role));

  const statCards = [
    // Admin, Nurse, Doctor, Receptionist
    { title: 'Total de Pacientes', value: stats.totalPatients, icon: Users, color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-100', roles: ['administrador', 'enfermeira', 'medico', 'recepcionista'] },
    { title: 'Atendimentos Hoje', value: stats.todayAppointments, icon: Calendar, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100', roles: ['administrador', 'enfermeira', 'medico', 'recepcionista'] },
    { title: 'Atendimentos Semana', value: stats.weeklyAppointments, icon: TrendingUp, color: 'text-purple-600', bg: 'from-purple-50 to-purple-100', roles: ['administrador', 'enfermeira', 'medico'] },
    { title: 'Exames Pendentes', value: stats.pendingTests, icon: Beaker, color: 'text-cyan-600', bg: 'from-cyan-50 to-cyan-100', roles: ['administrador', 'laboratorio', 'medico', 'enfermeira'] },
    
    // Patient
    { title: 'Meu Prontuário', icon: UserCircle, link: `/pacientes/${user?.patientId}`, color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-100', roles: ['paciente'] },
    { title: 'Meus Atendimentos', value: stats.todayAppointments, icon: Calendar, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100', roles: ['paciente'], description: 'agendados para hoje' },
    { title: 'Meus Exames', value: stats.pendingTests, icon: Beaker, color: 'text-cyan-600', bg: 'from-cyan-50 to-cyan-100', roles: ['paciente'], description: 'resultados pendentes' },
  ];

  const visibleStatCards = statCards.filter(card => user && card.roles.includes(user.role));
  
  const greeting = `Olá, ${user.name}!`;
  const welcomeMessage = {
    administrador: "Visão geral e monitoramento completo do sistema.",
    medico: "Sua agenda e ações rápidas para um dia produtivo.",
    enfermeira: "Acompanhe as triagens e os cuidados aos pacientes.",
    recepcionista: "Gerencie os agendamentos e cadastros de hoje.",
    laboratorio: "Organize e processe os pedidos de exames.",
    paciente: "Aqui está um resumo da sua saúde e agendamentos."
  }[user.role] || 'Bem-vindo(a) ao sistema de saúde ribeirinha.';
  

  if (user?.role === 'laboratorio' && quickActions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-gray-800 capitalize">{greeting}</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-gray-600 mt-2">{welcomeMessage}</motion.p>
            <Link to="/laboratorio">
                <Button className="mt-8 medical-gradient text-white hover:opacity-90">
                    <Beaker className="w-5 h-5 mr-2" />
                    Ir para o Painel do Laboratório
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-left space-y-2">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-gray-800 capitalize">{greeting}</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600">{welcomeMessage}</motion.p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${visibleStatCards.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
        {visibleStatCards.map((stat, index) => {
          const Icon = stat.icon;
          const cardContent = (
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  {stat.value !== undefined ? (
                    <>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                      {stat.description && <p className="text-xs text-gray-500">{stat.description}</p>}
                    </>
                  ) : <p className="text-lg font-semibold text-gray-800">Acessar</p>}
                </div>
                <div className={`p-3 rounded-xl bg-white/50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
          );
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`glass-effect p-6 rounded-2xl bg-gradient-to-br ${stat.bg} ${stat.link ? 'card-hover cursor-pointer' : ''}`}>
               {stat.link ? <Link to={stat.link}>{cardContent}</Link> : cardContent}
            </motion.div>
          );
        })}
      </div>

      {quickActions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Ações Rápidas</h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${quickActions.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link to={action.link} key={action.title}>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className="glass-effect p-6 rounded-2xl card-hover cursor-pointer h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 floating-animation`}><Icon className="w-6 h-6 text-white" /></div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{action.title}</h3>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-effect p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{user.role === 'paciente' ? 'Seus Próximos Atendimentos' : 'Atendimentos Recentes'}</h2>
        <div className="space-y-4">
          {recentAppointments.length > 0 ? recentAppointments.map((apt) => (
            <div key={apt.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><HeartPulse className="w-5 h-5 text-emerald-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{user.role === 'paciente' ? apt.type : apt.patientName}</p>
                <p className="text-sm text-gray-600">{user.role === 'paciente' ? apt.description || 'Consulta agendada' : apt.type}</p>
              </div>
              <span className="text-xs text-gray-500">{formatDate(apt.date)}</span>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">Nenhum atendimento agendado.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;