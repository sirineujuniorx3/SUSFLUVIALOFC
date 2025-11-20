
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Database, Save, RefreshCw, ImagePlus, Download, Upload, Trash2, Syringe, Plus, Edit, AlertTriangle, Users2, ShieldCheck, Briefcase as BriefcaseMedical, UserCheck, FlaskConical, Stethoscope, HeartPulse, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VaccineStockForm } from '@/components/VaccineStockForm';

const UserForm = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user || { name: '', role: '', password: '' });
    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleRoleChange = (value) => setFormData(prev => ({...prev, role: value}));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    
    const roleOptions = [
        { value: 'administrador', label: 'Administrador', icon: ShieldCheck },
        { value: 'enfermeira', label: 'Enfermeira', icon: BriefcaseMedical }, 
        { value: 'medico', label: 'Médico', icon: Stethoscope }, 
        { value: 'recepcionista', label: 'Recepcionista', icon: UserCheck }, 
        { value: 'laboratorio', label: 'Laboratório', icon: FlaskConical },
    ];

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-effect p-6 rounded-2xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Usuário" required />
                <Select onValueChange={handleRoleChange} value={formData.role} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o Perfil" /></SelectTrigger>
                    <SelectContent>{roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}><div className="flex items-center"><opt.icon className="w-4 h-4 mr-2" />{opt.label}</div></SelectItem>)}</SelectContent>
                </Select>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Senha" className="pl-10" required />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" className="medical-gradient text-white">Salvar Usuário</Button>
                </div>
            </form>
        </motion.div>
    )
};


const Settings = () => {
  const { user, login } = useAuth();
  const { saveData, getData, deleteData } = useDataSync();
  const [settings, setSettings] = useState({ userName: user?.name || '', userPhoto: user?.photo || null });
  const [vaccineStock, setVaccineStock] = useState([]);
  const [users, setUsers] = useState([]);
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [deletingVaccine, setDeletingVaccine] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const canManageVaccines = user.role === 'administrador' || user.role === 'enfermeira';
  const isAdmin = user.role === 'administrador';

  const fetchData = useCallback(async () => {
    if (canManageVaccines) {
        const stock = await getData('vaccine_stock');
        setVaccineStock(stock.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)));
    }
    if (isAdmin) {
        const systemUsers = await getData('users');
        setUsers(systemUsers);
    }
  }, [getData, canManageVaccines, isAdmin]);

  useEffect(() => {
    fetchData();
    setSettings({ userName: user?.name, userPhoto: user?.photo });
  }, [user, fetchData]);

  const handleSaveSettings = () => {
    setIsLoading(true);
    setTimeout(() => {
      const updatedUser = { ...user, photo: settings.userPhoto, name: settings.userName };
      login(updatedUser);
      setIsLoading(false);
      toast({ title: "✅ Configurações Salvas", description: "Suas preferências foram atualizadas." });
    }, 1000);
  };
  
  const handleSaveUser = async (userData) => {
    const isUpdating = !!userData.id;
    const normalizedName = userData.name.trim().toLowerCase();
    
    if (!normalizedName || !userData.role || !userData.password) {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha todos os campos.' });
        return;
    }

    const dataToSave = {...userData, name: normalizedName, id: isUpdating ? userData.id : crypto.randomUUID() };
    await saveData('users', dataToSave);
    toast({ title: `Usuário ${isUpdating ? 'Atualizado' : 'Criado'}`, description: `O usuário ${dataToSave.name} foi salvo.` });
    fetchData();
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId) => {
    await deleteData('users', userId);
    toast({ title: "Usuário Removido", description: "O usuário foi removido do sistema." });
    fetchData();
    setDeletingUser(null);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSettings(prev => ({ ...prev, userPhoto: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVaccine = async (vaccineData) => {
    if(!isAdmin) {
      toast({variant: "destructive", title: "Acesso negado", description: "Apenas administradores podem adicionar ou editar vacinas."});
      return;
    }
    const isUpdating = !!vaccineData.id;
    const dataToSave = { ...vaccineData, id: isUpdating ? vaccineData.id : crypto.randomUUID(), quantity: parseInt(vaccineData.quantity) };
    await saveData('vaccine_stock', dataToSave);
    toast({ title: `💉 Vacina ${isUpdating ? 'Atualizada' : 'Adicionada'}`, description: `${dataToSave.name} foi salva no estoque.` });
    fetchData();
    setShowVaccineForm(false);
    setEditingVaccine(null);
  };

  const handleDeleteVaccine = async (vaccineId) => {
    if(!isAdmin) {
      toast({variant: "destructive", title: "Acesso negado", description: "Apenas administradores podem remover vacinas."});
      return;
    }
    await deleteData('vaccine_stock', vaccineId);
    toast({ title: "🗑️ Vacina Removida", description: "A vacina foi removida do estoque." });
    fetchData();
    setDeletingVaccine(null);
  };

  const handleExportData = () => {
    try {
      const exportData = {};
      const keys = ['users', 'patients', 'appointments', 'vaccines', 'labTests', 'vaccine_stock'];
      keys.forEach(key => { exportData[key] = JSON.parse(localStorage.getItem(key) || '[]'); });
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `susfluvial_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "📥 Backup Criado", description: "Dados exportados com sucesso." });
    } catch (error) {
      toast({ variant: 'destructive', title: '❌ Erro no Backup', description: error.message });
    }
  };
  
  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const keys = ['users', 'patients', 'appointments', 'vaccines', 'labTests', 'vaccine_stock'];
            let importedCount = 0;
            keys.forEach(key => {
                if (imported[key] && Array.isArray(imported[key])) {
                    localStorage.setItem(key, JSON.stringify(imported[key]));
                    importedCount += imported[key].length;
                }
            });
            toast({ title: '📥 Dados Importados', description: `${importedCount} registros importados. A página será recarregada.` });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            toast({ variant: 'destructive', title: '❌ Erro de Importação', description: `Arquivo inválido: ${error.message}` });
        }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleClearData = () => {
    try {
      ['users', 'patients', 'appointments', 'vaccines', 'labTests', 'vaccine_stock'].forEach(key => localStorage.removeItem(key));
      toast({ title: "🗑️ Dados Limpos", description: "Todos os dados de registros foram removidos." });
    } catch (error) {
       toast({ variant: 'destructive', title: '❌ Erro ao Limpar', description: error.message });
    }
    setShowClearConfirm(false);
  };
  
  const RoleIcon = ({role}) => {
    const icons = {
        administrador: ShieldCheck, enfermeira: BriefcaseMedical, medico: Stethoscope,
        recepcionista: UserCheck, laboratorio: FlaskConical, paciente: HeartPulse
    };
    const Icon = icons[role] || User;
    return <Icon className="w-5 h-5 text-gray-600"/>
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-800">Configurações</h1><p className="text-gray-600">Gerencie seu perfil e os dados do sistema.</p></div>
        <Button onClick={handleSaveSettings} disabled={isLoading} className="medical-gradient text-white hover:opacity-90">{isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar Perfil</Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-8">
          {/* My Profile */}
          <div className="glass-effect p-6 rounded-2xl"><div className="flex flex-col items-center space-y-4"><div className="relative"><div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">{settings.userPhoto ? <img src={settings.userPhoto} alt="Foto do perfil" className="w-full h-full object-cover" /> : <User className="w-20 h-20 text-gray-400" />}</div><Button size="icon" className="absolute bottom-1 right-1 rounded-full medical-gradient" onClick={() => fileInputRef.current.click()}><ImagePlus className="w-5 h-5 text-white"/></Button><input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" /></div><div><label className="block text-sm font-medium text-gray-700 text-center">Nome de Usuário</label><Input value={settings.userName} onChange={(e) => setSettings({ ...settings, userName: e.target.value })} className="bg-white/50 border-white/20 mt-1 text-center font-bold" /></div><span className="capitalize px-3 py-1 text-sm font-medium text-emerald-800 bg-emerald-100 rounded-full">{user.role}</span></div></div>
          
          {/* Data Management */}
          {isAdmin && <div className="glass-effect p-6 rounded-2xl"><div className="flex items-center space-x-3 mb-4"><Database className="w-5 h-5 text-gray-600" /><h2 className="text-xl font-bold text-gray-800">Dados do Sistema</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4"><Button onClick={handleExportData} variant="outline"><Download className="w-4 h-4 mr-2" />Exportar Backup</Button><Button onClick={() => importFileRef.current.click()} variant="outline"><Upload className="w-4 h-4 mr-2" />Importar Backup</Button><input type="file" ref={importFileRef} onChange={handleImportData} accept=".json" className="hidden" /><AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}><AlertDialogTrigger asChild><Button variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200"><Trash2 className="w-4 h-4 mr-2" />Limpar Dados</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão Total</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível e apagará TODOS os dados do sistema (pacientes, atendimentos, etc). Deseja continuar?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">Confirmar e Apagar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>}
        </motion.div>

        {/* Panels */}
        <div className="lg:col-span-2 space-y-8">
            {/* User Management */}
            {isAdmin && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-effect p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><Users2 className="w-6 h-6 text-indigo-600" /><h2 className="text-xl font-bold text-gray-800">Gerenciamento de Usuários</h2></div><Button size="sm" onClick={() => { setEditingUser(null); setShowUserForm(true); }}><Plus className="w-4 h-4 mr-2" />Adicionar</Button></div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {users.map(u => (
                        <div key={u.id} className="p-4 rounded-lg flex items-center justify-between bg-white/50">
                            <div className="flex items-center gap-3"><RoleIcon role={u.role}/><div><p className="font-bold text-gray-800 capitalize">{u.name}</p><p className="text-sm text-gray-500 capitalize">{u.role}</p></div></div>
                            <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingUser(u); setShowUserForm(true); }}><Edit className="w-4 h-4 text-blue-600"/></Button><Button size="icon" variant="ghost" onClick={() => setDeletingUser(u)}><Trash2 className="w-4 h-4 text-red-600"/></Button></div>
                        </div>
                    ))}
                </div>
            </motion.div>}

            {/* Vaccine Stock */}
            {canManageVaccines && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-effect p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-3"><Syringe className="w-6 h-6 text-cyan-600" /><h2 className="text-xl font-bold text-gray-800">Estoque de Vacinas</h2></div>{isAdmin && <Button size="sm" onClick={() => { setEditingVaccine(null); setShowVaccineForm(true); }}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>}</div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {vaccineStock.length === 0 ? <p className="text-center text-gray-500 py-8">Nenhuma vacina em estoque.</p> : vaccineStock.map(v => {
                    const isExpired = new Date(v.expiration_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                    const isLowStock = v.quantity < 20;
                    return (
                    <div key={v.id} className={`p-4 rounded-lg flex items-center justify-between ${isExpired ? 'bg-red-100' : 'bg-white/50'}`}>
                        <div><p className="font-bold text-gray-800">{v.name} <span className="text-sm font-normal text-gray-600">({v.manufacturer})</span></p><p className="text-sm text-gray-500">Lote: {v.batch} | Val: {new Date(v.expiration_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p></div>
                        <div className="flex items-center gap-4"><div className="text-right"><p className={`font-bold text-lg ${isLowStock && !isExpired ? 'text-amber-600' : 'text-gray-800'}`}>{v.quantity}</p><p className="text-xs text-gray-500">unidades</p></div>{(isExpired || isLowStock) && <AlertTriangle className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} title={isExpired ? 'Vencido!' : 'Estoque baixo!'} />}{isAdmin && <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingVaccine(v); setShowVaccineForm(true); }}><Edit className="w-4 h-4 text-blue-600"/></Button><Button size="icon" variant="ghost" onClick={() => setDeletingVaccine(v)}><Trash2 className="w-4 h-4 text-red-600"/></Button></div>}</div>
                    </div>
                )})}
              </div>
            </motion.div>}
        </div>
      </div>

      <AnimatePresence>
        {isAdmin && showUserForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowUserForm(false)}><div onClick={e => e.stopPropagation()}><UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setShowUserForm(false)} /></div></div>}
        {isAdmin && showVaccineForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowVaccineForm(false)}><div onClick={e => e.stopPropagation()}><VaccineStockForm vaccine={editingVaccine} onSave={handleSaveVaccine} onCancel={() => setShowVaccineForm(false)} /></div></div>}
      </AnimatePresence>
      
      <AlertDialog open={!!deletingVaccine} onOpenChange={() => setDeletingVaccine(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja remover a vacina {deletingVaccine?.name} (Lote: {deletingVaccine?.batch}) do estoque?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVaccine(deletingVaccine.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja remover o usuário {deletingUser?.name}? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(deletingUser.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Settings;
