import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Key, LogIn, Briefcase as BriefcaseMedical, Stethoscope, UserCheck, FlaskConical, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useDataSync } from '@/contexts/DataSyncContext';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const { getData } = useDataSync();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const defaultProfessionalUsers = [
      { id: 'admin', name: 'admin', role: 'administrador', password: 'admin123', photo: 'https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/ca17f9bbb03400eee4833b03aa7337f9.jpg' },
      { id: 'luciana', name: 'luciana', role: 'enfermeira', password: 'enfermeira123', photo: 'https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/2356a0397b3aad3e3cc2eeb659e6a947.jpg' },
      { id: 'carlos', name: 'carlos', role: 'medico', password: 'medico123', photo: 'https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/d784d96f6b0178a3054f11b6e80d3b2f.jpg' },
      { id: 'ana', name: 'ana', role: 'recepcionista', password: 'recepcionista123', photo: 'https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/677f613c36d60c24da68b63dd2a41343.jpg' },
      { id: 'joao', name: 'joao', role: 'laboratorio', password: 'laboratorio123', photo: 'https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/1d4a0e06628a1af7bee5e5252c8fe784.jpg' },
    ];
    
    const fetchAllUsers = async () => {
        try {
            const storedUsers = await getData('users') || [];
            const patients = await getData('patients') || [];
            
            const patientUsers = patients.map(patient => ({
                id: patient.id,
                name: patient.name.toLowerCase().split(' ')[0],
                role: 'paciente',
                password: '123', // Simple password for demo
                patientId: patient.id,
                photo: patient.photo
            }));

            // Combine all user sources, ensuring newly created users are included.
            // Using a Map to ensure uniqueness based on username and role.
            const combinedUsersMap = new Map();
            [...defaultProfessionalUsers, ...patientUsers, ...storedUsers].forEach(u => {
                combinedUsersMap.set(u.name.toLowerCase() + u.role, u);
            });
            const uniqueUsers = Array.from(combinedUsersMap.values());

            setAllUsers(uniqueUsers);
        } catch (error) {
            console.error("Failed to load users:", error);
            setAllUsers(defaultProfessionalUsers);
        }
    };
    
    fetchAllUsers();
  }, [getData]);

  const handleLogin = e => {
    e.preventDefault();
    if (!name || !role || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, preencha seu nome, perfil e senha.'
      });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const normalizedUsername = name.trim().toLowerCase();
      
      const foundUser = allUsers.find(
        user => user.name.toLowerCase() === normalizedUsername && user.role === role && user.password === password
      );

      if (foundUser) {
        // Save currentUser in localStorage so other modules (doctor schedule, etc.) know who's logged
        try {
          const userId = foundUser.id || foundUser.patientId || String(foundUser.name).toLowerCase();
          const currentUser = {
            id: userId,
            role: foundUser.role,
            name: foundUser.name,
            photo: foundUser.photo || ''
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (err) {
          console.warn("Could not write currentUser to localStorage", err);
        }

        // Keep existing auth flow
        login({ name: foundUser.name, role: foundUser.role, photo: foundUser.photo, patientId: foundUser.patientId });
        setIsLoading(false);
        navigate('/');
        toast({
          title: `Bem-vindo(a), ${foundUser.name}!`,
          description: 'Login realizado com sucesso.'
        });
      } else {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Credenciais Inválidas',
          description: 'Nome, perfil ou senha incorretos. Verifique seus dados e tente novamente.'
        });
      }
    }, 1000);
  };

  const roleOptions = [
    { value: 'administrador', label: 'Administrador', icon: ShieldCheck },
    { value: 'enfermeira', label: 'Enfermeira', icon: BriefcaseMedical }, 
    { value: 'medico', label: 'Médico', icon: Stethoscope }, 
    { value: 'recepcionista', label: 'Recepcionista', icon: UserCheck }, 
    { value: 'laboratorio', label: 'Laboratório', icon: FlaskConical },
    { value: 'paciente', label: 'Paciente', icon: HeartPulse }
  ];

  return (
    <div 
      className="flex items-center justify-center min-h-screen p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/3d1e249b80437d148ac71ef1f1ab3dcc.jpg')" }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, type: 'spring' }} 
        className="w-full max-w-md"
      >
        <div className="glass-effect rounded-2xl p-8 space-y-8">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }} 
              className="mx-auto w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <img src="https://horizons-cdn.hostinger.com/227a8cb9-6398-4f1d-90c5-da4612a5c119/b2f60f86aedbcc396f97a1c3ad4b96ce.jpg" alt="SUS Fluvial Logo" className="w-20 h-20 rounded-full object-cover" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800">SUS Fluvial</h1>
            <p className="text-gray-600">Acesse o Sistema de Saúde Ribeirinha</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input id="name" type="text" placeholder="Seu Nome de Usuário" value={name} onChange={e => setName(e.target.value)} className="pl-10 h-12 text-lg bg-white/50 border-white/20" required />
            </div>

            <div className="relative">
                <Select onValueChange={setRole} value={role}>
                    <SelectTrigger className="pl-10 h-12 text-lg bg-white/50 border-white/20">
                        <BriefcaseMedical className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <SelectValue placeholder="Selecione seu perfil" />
                    </SelectTrigger>
                    <SelectContent>
                        {roleOptions.map(option => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center">
                                    <Icon className="w-4 h-4 mr-2" />
                                    {option.label}
                                </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input id="password" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-12 text-lg bg-white/50 border-white/20" required />
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg medical-gradient text-white hover:opacity-90" disabled={isLoading}>
              {isLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
                />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>
        <div className="text-center text-xs text-gray-100 bg-black/30 rounded-lg p-2 mt-6">
            <p><strong>Usuários Pacientes:</strong> use o primeiro nome do paciente e a senha "123".</p>
        </div>
        <p className="text-center text-xs text-gray-100 mt-4">
          © {new Date().getFullYear()} Secretaria de Saúde do Amazonas. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
