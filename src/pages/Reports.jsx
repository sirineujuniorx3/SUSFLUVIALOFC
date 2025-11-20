import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const Reports = () => {
  const [reportData, setReportData] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    appointmentsByType: {},
    appointmentsByMonth: {},
    communitiesServed: 0
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    generateReportData();
  }, [dateRange]);

  const generateReportData = () => {
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

    // Filtrar por período
    const filteredAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return aptDate >= startDate && aptDate <= endDate;
    });

    // Agrupar por tipo de atendimento
    const appointmentsByType = filteredAppointments.reduce((acc, apt) => {
      acc[apt.type] = (acc[apt.type] || 0) + 1;
      return acc;
    }, {});

    // Agrupar por mês
    const appointmentsByMonth = filteredAppointments.reduce((acc, apt) => {
      const month = new Date(apt.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Comunidades únicas
    const communities = new Set(patients.map(p => p.community));

    setReportData({
      totalPatients: patients.length,
      totalAppointments: filteredAppointments.length,
      appointmentsByType,
      appointmentsByMonth,
      communitiesServed: communities.size
    });
  };

  const reportTypes = [
    {
      title: 'Relatório Mensal',
      description: 'Resumo completo das atividades do mês',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Relatório de Pacientes',
      description: 'Lista detalhada de todos os pacientes',
      icon: Users,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Relatório de Atendimentos',
      description: 'Histórico completo de atendimentos',
      icon: Activity,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Relatório por Comunidade',
      description: 'Atendimentos agrupados por comunidade',
      icon: BarChart3,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const handleGenerateReport = (reportType) => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: "Você pode solicitar esta funcionalidade no seu próximo prompt! 🚀"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-gray-600">Análises e relatórios para gestão de saúde</p>
        </div>
        <Button 
          onClick={generateReportData}
          className="medical-gradient text-white hover:opacity-90"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="glass-effect p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="font-medium text-gray-700">Período:</span>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="bg-white/50 border-white/20"
            />
            <span className="text-gray-500">até</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="bg-white/50 border-white/20"
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => toast({
              title: "🚧 Funcionalidade em desenvolvimento",
              description: "Você pode solicitar esta funcionalidade no seu próximo prompt! 🚀"
            })}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total de Pacientes', value: reportData.totalPatients, icon: Users, color: 'text-emerald-600' },
          { title: 'Atendimentos no Período', value: reportData.totalAppointments, icon: Activity, color: 'text-blue-600' },
          { title: 'Comunidades Atendidas', value: reportData.communitiesServed, icon: BarChart3, color: 'text-purple-600' },
          { title: 'Tipos de Atendimento', value: Object.keys(reportData.appointmentsByType).length, icon: PieChart, color: 'text-orange-600' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-effect p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Type */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect p-6 rounded-2xl"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Atendimentos por Tipo</h2>
          {Object.keys(reportData.appointmentsByType).length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum dado disponível para o período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportData.appointmentsByType).map(([type, count], index) => (
                <div key={type} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="font-medium text-gray-800">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                      index % 4 === 0 ? 'from-emerald-500 to-teal-600' :
                      index % 4 === 1 ? 'from-blue-500 to-indigo-600' :
                      index % 4 === 2 ? 'from-purple-500 to-pink-600' :
                      'from-orange-500 to-red-600'
                    }`}></div>
                    <span className="font-bold text-gray-800">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect p-6 rounded-2xl"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tendência Mensal</h2>
          {Object.keys(reportData.appointmentsByMonth).length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum dado disponível para o período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportData.appointmentsByMonth).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <span className="font-medium text-gray-800">{month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full medical-gradient rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(reportData.appointmentsByMonth))) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-800">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Report Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Gerar Relatórios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="glass-effect p-6 rounded-2xl card-hover"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${report.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{report.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        className="medical-gradient text-white hover:opacity-90"
                        onClick={() => handleGenerateReport(report.title)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(report.title)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;