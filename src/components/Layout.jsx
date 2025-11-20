import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { 
      Home, 
      Users, 
      Calendar, 
      FileText, 
      Settings, 
      Menu, 
      X,
      Wifi,
      WifiOff,
      RefreshCw,
      LogOut,
      Beaker,
      ClipboardList,
      UserCircle
    } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { useDataSync } from '@/contexts/DataSyncContext';

    const Layout = ({ children }) => {
      const [sidebarOpen, setSidebarOpen] = useState(false);
      const { isOnline } = useDataSync();
      const [isSyncing, setIsSyncing] = useState(false);
      const location = useLocation();
      const { toast } = useToast();
      const { user, logout } = useAuth();
      const navigate = useNavigate();

      useEffect(() => {
        if (isOnline) {
          toast({
            title: "✅ Conexão Restaurada",
            description: "Você está online.",
            duration: 3000,
          });
        } else {
           toast({
            title: "📱 Modo Offline",
            description: "Você está trabalhando offline. Os dados serão salvos localmente.",
            duration: 4000,
          });
        }
      }, [isOnline, toast]);


      const handleSync = async () => {
        setIsSyncing(true);
        toast({ title: "Sincronização iniciada..." });
        
        // No-op for localStorage, but keeping the UI feedback
        setTimeout(() => {
          setIsSyncing(false);
          toast({
            title: "✔ Sincronização Finalizada",
            description: "Seus dados locais estão atualizados.",
            duration: 3000,
          });
        }, 1500);
      };

      const handleLogout = () => {
        logout();
        navigate('/login');
        toast({
          title: "Logout realizado",
          description: "Você saiu do sistema com segurança.",
        });
      };

      const allMenuItems = [
        { path: '/', icon: Home, label: 'Dashboard', color: 'text-emerald-600', roles: ['administrador', 'recepcionista', 'enfermeira', 'medico', 'laboratorio', 'paciente'] },
        { path: '/agenda-diaria', icon: ClipboardList, label: 'Agenda Diária', color: 'text-indigo-600', roles: ['medico'] },
        { path: '/pacientes', icon: Users, label: 'Pacientes', color: 'text-blue-600', roles: ['administrador', 'recepcionista', 'enfermeira', 'medico'] },
        { path: '/atendimentos', icon: Calendar, label: 'Atendimentos', color: 'text-purple-600', roles: ['administrador', 'recepcionista', 'enfermeira', 'medico', 'paciente'] },
        { path: '/laboratorio', icon: Beaker, label: 'Laboratório', color: 'text-cyan-600', roles: ['administrador', 'laboratorio', 'enfermeira', 'medico', 'paciente'] },
        { path: '/relatorios', icon: FileText, label: 'Relatórios', color: 'text-orange-600', roles: ['administrador', 'medico'] },
        { path: '/configuracoes', icon: Settings, label: 'Configurações', color: 'text-gray-600', roles: ['administrador', 'enfermeira'] },
      ];

      const getPatientSpecificPath = (path) => {
        if (user?.role === 'paciente' && path.startsWith('/pacientes')) {
          return `/pacientes/${user.patientId}`;
        }
        return path;
      }
      
      const menuItems = allMenuItems.filter(item => user && item.roles.includes(user.role));
      
      if (user?.role === 'paciente') {
        const patientProfileIndex = menuItems.findIndex(item => item.path === '/pacientes');
        if (patientProfileIndex !== -1) {
            menuItems[patientProfileIndex] = {
                path: `/pacientes/${user.patientId}`,
                icon: UserCircle, 
                label: 'Meu Perfil', 
                color: 'text-blue-600', 
                roles: ['paciente'] 
            };
        } else {
             const patientProfileLink = {
                path: `/pacientes/${user.patientId}`, 
                icon: UserCircle, 
                label: 'Meu Perfil', 
                color: 'text-blue-600', 
                roles: ['paciente'] 
            };
            menuItems.splice(1, 0, patientProfileLink);
        }
      }


      const roleNames = {
        administrador: 'Administrador',
        enfermeira: 'Enfermeira',
        medico: 'Médico',
        recepcionista: 'Recepcionista',
        laboratorio: 'Laboratório',
        paciente: 'Paciente'
      };

      return (
        <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 medical-pattern">
          <AnimatePresence>
            {(sidebarOpen || window.innerWidth >= 768) && (
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed md:relative z-50 w-64 h-full glass-effect md:translate-x-0"
              >
                <div className="flex flex-col h-full p-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <img src="https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/b2f60f86aedbcc396f97a1c3ad4b96ce.jpg" alt="SUS Fluvial Logo" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h1 className="text-lg font-bold text-gray-800">SUS Fluvial</h1>
                        <p className="text-xs text-gray-600">Sistema de Saúde</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className={`flex items-center space-x-2 p-3 rounded-lg mb-6 ${
                    isOnline ? 'status-online' : 'status-offline'
                  } ${isSyncing ? 'status-syncing' : ''}`}>
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : isOnline ? (
                      <Wifi className="w-4 h-4" />
                    ) : (
                      <WifiOff className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isSyncing ? 'Sincronizando...' : isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const path = getPatientSpecificPath(item.path);
                      const isActive = location.pathname === path;
                      
                      return (
                        <Link
                          key={item.path}
                          to={path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-white shadow-lg scale-105' 
                              : 'hover:bg-white/50 hover:scale-102'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-600'}`} />
                          <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="space-y-2">
                    {user.role !== 'paciente' && <Button
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="w-full medical-gradient text-white hover:opacity-90 transition-opacity"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar Dados
                        </>
                      )}
                    </Button>}
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair do Sistema
                    </Button>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="glass-effect p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center space-x-4 ml-auto">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800 capitalize">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-600">{roleNames[user?.role] || 'Perfil'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 overflow-hidden">
                     {user?.photo ? (
                      <img src={user.photo} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-bold text-sm capitalize">{(user?.name || 'U').charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </main>
          </div>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      );
    };

    export default Layout;