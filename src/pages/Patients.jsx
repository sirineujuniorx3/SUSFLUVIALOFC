import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Plus, User, MapPin, Phone, Eye, X, Trash2, Edit, FileDown, ImagePlus, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Combobox } from '@/components/ui/combobox.jsx';
import { amazonasCommunities } from '@/data/communities.js';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportPatients } from '@/lib/reports';

const PatientForm = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState(patient || {
    name: '', age: '', gender: '', community: '', phone: '', conditions: '', photo: null
  });
  const fileInputRef = React.useRef(null);
  const { user } = useAuth();
  const canEditMedicalInfo = user.role === 'administrador' || user.role === 'medico' || user.role === 'enfermeira';


  const communityOptions = useMemo(() => 
    amazonasCommunities.map(c => ({ value: c.toLowerCase(), label: c })), 
  []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleCommunityChange = (value) => {
    const communityName = communityOptions.find(c => c.value === value)?.label || '';
    setFormData(prev => ({...prev, community: communityName }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.community) {
      alert("Por favor, preencha todos os campos obrigatórios: Nome, Idade e Comunidade.");
      return;
    }
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-effect p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{patient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {formData.photo ? <img src={formData.photo} alt="Foto do paciente" className="w-full h-full object-cover" /> : <UserCircle className="w-16 h-16 text-gray-400" />}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()}>
            <ImagePlus className="w-4 h-4 mr-2"/>
            {formData.photo ? 'Trocar Foto' : 'Adicionar Foto'}
          </Button>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Digite o nome completo" className="bg-white/50 border-white/20" required/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade *</label>
            <Input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Idade" className="bg-white/50 border-white/20" required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
            <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
              <SelectTrigger className="bg-white/50 border-white/20"><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comunidade *</label>
          <Combobox options={communityOptions} value={formData.community?.toLowerCase()} onChange={handleCommunityChange} placeholder="Selecione uma comunidade" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="(92) 99999-9999" className="bg-white/50 border-white/20"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condições Médicas</label>
          <textarea name="conditions" value={formData.conditions} onChange={handleChange} placeholder="Descreva condições médicas conhecidas" rows={3} className="w-full p-2 rounded-md bg-white/50 border border-white/20 text-gray-800 resize-none" disabled={!canEditMedicalInfo}/>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button type="submit" className="flex-1 medical-gradient text-white hover:opacity-90">Salvar</Button>
        </div>
      </form>
    </motion.div>
  );
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [filters, setFilters] = useState({ community: 'all', gender: 'all' });
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { saveData, deleteData, getData } = useDataSync();
  const { user } = useAuth();
  const canManage = user.role === 'administrador' || user.role === 'enfermeira' || user.role === 'recepcionista';
  const canDelete = user.role === 'administrador';

  const fetchPatients = useCallback(async () => {
    const data = await getData('patients');
    setPatients(data.sort((a, b) => (a.name || "").localeCompare(b.name)));
  }, [getData]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const editId = params.get('id');

    if (action === 'add') {
      handleOpenForm();
    } else if (action === 'edit' && editId) {
      getData('patients').then(allPatients => {
        const patientToEdit = allPatients.find(p => p.id === editId);
        if(patientToEdit) handleOpenForm(patientToEdit);
      });
    }
  }, [location.search, getData]);

  const handleSavePatient = async (patientData) => {
    try {
      const isUpdating = !!patientData.id;
      const dataToSave = {
        ...patientData,
        id: isUpdating ? patientData.id : crypto.randomUUID(),
        age: parseInt(patientData.age),
        updated_at: new Date().toISOString(),
      };

      if (!isUpdating) {
        dataToSave.created_at = new Date().toISOString();
      }

      await saveData('patients', dataToSave);
      await fetchPatients();

      toast({ 
        title: `✅ Paciente ${isUpdating ? 'Atualizado' : 'Cadastrado'}`, 
        description: `${dataToSave.name} foi salvo com sucesso.` 
      });
      closeForm();
    } catch (error) {
      toast({ variant: 'destructive', title: '❌ Erro ao Salvar', description: `Não foi possível salvar o paciente: ${error.message}` });
    }
  };

  const handleDeletePatient = async (patientId) => {
    if(!canDelete) {
        toast({variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para excluir pacientes.'});
        return;
    }
    try {
      const patientName = patients.find(p => p.id === patientId)?.name;
      await deleteData('patients', patientId);
      await fetchPatients();
      toast({ 
        title: "🗑️ Paciente Excluído", 
        description: `${patientName} foi removido do sistema.` 
      });
      setPatientToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: '❌ Erro ao Excluir', description: `Não foi possível excluir o paciente: ${error.message}` });
    }
  };

  const handleOpenForm = (patient = null) => {
    if (!canManage) {
        toast({variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para gerenciar pacientes.'});
        return;
    }
    setEditingPatient(patient);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    navigate('/pacientes', { replace: true });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const filteredPatients = patients.filter(patient => {
    const searchMatch = (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (patient.community || '').toLowerCase().includes(searchTerm.toLowerCase());
    const communityMatch = filters.community === 'all' || patient.community === filters.community;
    const genderMatch = filters.gender === 'all' || patient.gender === filters.gender;
    return searchMatch && communityMatch && genderMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-gray-600">Gerencie o cadastro de pacientes da UBS</p>
        </div>
        <div className="flex gap-2">
            {canManage && (
                <Button onClick={() => handleOpenForm()} className="medical-gradient text-white hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Paciente
                </Button>
            )}
            {(user.role === 'administrador' || user.role === 'medico') && <Button variant="outline" onClick={() => exportPatients(filteredPatients, 'pdf')}>
                <FileDown className="w-4 h-4 mr-2" /> PDF
            </Button>}
        </div>
      </div>

      <div className="glass-effect p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-3 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Buscar por nome ou comunidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/50 border-white/20"/>
          </div>
          <Select value={filters.community} onValueChange={(value) => handleFilterChange('community', value)}>
            <SelectTrigger className="bg-white/50 border-white/20"><SelectValue placeholder="Filtrar por comunidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as comunidades</SelectItem>
              {amazonasCommunities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
            <SelectTrigger className="bg-white/50 border-white/20"><SelectValue placeholder="Filtrar por gênero" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gêneros</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient, index) => (
          <motion.div key={patient.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="glass-effect p-6 rounded-2xl card-hover flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-200">
                  {patient.photo ? <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-gray-500" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.age} anos • {patient.gender}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-center space-x-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /><span>{patient.community}</span></div>
              {patient.phone && <div className="flex items-center space-x-2 text-sm text-gray-600"><Phone className="w-4 h-4" /><span>{patient.phone}</span></div>}
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4">
                {canManage && <Link to={`/pacientes?action=edit&id=${patient.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></Button></Link>}
                <Link to={`/pacientes/${patient.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button></Link>
                {canDelete && <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600" onClick={() => setPatientToDelete(patient)}><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 glass-effect rounded-2xl">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{searchTerm || filters.community !== 'all' || filters.gender !== 'all' ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</h3>
          <p className="text-gray-500 mb-6">{searchTerm ? 'Tente buscar com outros termos ou limpar os filtros' : 'Comece cadastrando seu primeiro paciente'}</p>
          {canManage && <Button onClick={() => handleOpenForm()} className="medical-gradient text-white hover:opacity-90"><Plus className="w-4 h-4 mr-2" />Cadastrar Primeiro Paciente</Button>}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeForm}>
            <div onClick={e => e.stopPropagation()}>
                <PatientForm patient={editingPatient} onSave={handleSavePatient} onCancel={closeForm} />
            </div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!patientToDelete} onOpenChange={() => setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o paciente <span className="font-bold">{patientToDelete?.name}</span> e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeletePatient(patientToDelete.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Patients;