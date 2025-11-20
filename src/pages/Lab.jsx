import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Beaker, Plus, Search, FlaskConical, User, Filter, X, ClipboardCheck, AlertTriangle, Clock, Eye, FileDown, Paperclip, Trash2, Edit, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportLabTests } from '@/lib/reports';
import { formatDate, formatDateTime } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";

const DetailsModal = ({ test, onCancel, onAddOpinion, canAddOpinion, canPerform, onUploadResult }) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-effect p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-gray-800">Detalhes do Exame</h2><Button variant="ghost" size="icon" onClick={onCancel}><X /></Button></div>
        <div className="space-y-4">
            <p><strong>Paciente:</strong> {test.patientName}</p>
            <p><strong>Exame:</strong> {test.testName}</p>
            <p><strong>Data do Pedido:</strong> {formatDate(test.date)}</p>
            <p><strong>Status:</strong> {test.status}</p>
            <p><strong>Solicitado por:</strong> {test.requested_by || 'N/I'}</p>
            {test.notes && <p><strong>Observações do Pedido:</strong> {test.notes}</p>}
            {test.file ? <div><strong>Resultado:</strong><Button variant="link" onClick={() => { const link = document.createElement('a'); link.href = test.file; link.download = `resultado_${test.testName.replace(/\s/g, '_')}`; link.click(); }}>Baixar Anexo</Button></div> : (canPerform && <Button onClick={() => onUploadResult(test)}><Paperclip className="w-4 h-4 mr-2"/>Anexar Resultado</Button>)}
            <hr className="my-4"/>
            <h3 className="font-bold text-lg">Laudo Médico</h3>
            {test.opinion ? <div className="p-3 bg-blue-50 rounded-md space-y-1"><p>{test.opinion}</p><p className="text-xs text-gray-500">Por {test.opinion_by} em {formatDateTime(test.opinion_at)}</p></div> : <p className="text-gray-500">Nenhum laudo registrado.</p>}
            {canAddOpinion && test.status === 'Concluído' && <Button onClick={() => onAddOpinion(test)}><MessageSquare className="w-4 h-4 mr-2"/>Adicionar Laudo</Button>}
        </div>
    </motion.div>
);

const OpinionForm = ({ test, onSave, onCancel }) => {
    const [opinion, setOpinion] = useState(test.opinion || '');
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-effect p-6 rounded-2xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Laudo Médico</h2>
            <textarea value={opinion} onChange={e => setOpinion(e.target.value)} rows={5} className="w-full p-2 rounded-md bg-white/50 border border-white/20" placeholder="Digite o laudo ou parecer médico..."/>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button onClick={() => onSave(test, opinion)} className="medical-gradient text-white">Salvar Laudo</Button></div>
        </motion.div>
    );
};

const LabTestForm = ({ test, onSave, onCancel, patients, patientId }) => {
    const [formData, setFormData] = useState(test || { patientId: patientId || '', patientName: '', testName: '', date: new Date().toISOString().substring(0, 10), notes: '', file: null });
    const fileInputRef = useRef(null);
    useEffect(() => { if (patientId && patients.length > 0) { const p = patients.find(p => p.id === patientId); if(p) setFormData(prev => ({...prev, patientId: p.id, patientName: p.name})); } }, [patientId, patients]);
    const handlePatientChange = (id) => { const p = patients.find(p => p.id === id); if(p) setFormData(prev => ({ ...prev, patientId: p.id, patientName: p.name })); };
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = e => { const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = (loadEvent) => setFormData(prev => ({...prev, file: loadEvent.target.result})); reader.readAsDataURL(file); } };
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-effect p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">{test ? 'Editar Pedido' : 'Novo Pedido de Exame'}</h2><Button variant="ghost" size="icon" onClick={onCancel}><X /></Button></div>
        <form onSubmit={(e) => {e.preventDefault(); onSave(formData)}} className="space-y-4">
          <Select onValueChange={handlePatientChange} value={formData.patientId} required><SelectTrigger className="bg-white/50"><SelectValue placeholder="Selecione um paciente *" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
          <Input name="testName" value={formData.testName} onChange={handleChange} placeholder="Nome do Exame *" className="bg-white/50" required/>
          <Input name="date" type="date" value={formData.date} onChange={handleChange} className="bg-white/50" required/>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações do Pedido" rows={3} className="w-full p-2 rounded-md bg-white/50 border-white/20 resize-none"/>
          {test && <><Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}><Paperclip className="w-4 h-4 mr-2"/>{formData.file ? 'Trocar Resultado' : 'Anexar Resultado'}</Button><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>{formData.file && <p className="text-xs text-emerald-700">Arquivo de resultado anexado.</p>}</>}
          <div className="flex gap-3 pt-2"><Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 medical-gradient text-white">Salvar</Button></div>
        </form>
      </motion.div>
    );
};

const Lab = () => {
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [detailsTest, setDetailsTest] = useState(null);
  const [deletingTest, setDeletingTest] = useState(null);
  const [opinionTest, setOpinionTest] = useState(null);
  const { toast } = useToast();
  const { saveData, getData, deleteData } = useDataSync();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canRequest = user.role === 'administrador' || user.role === 'medico' || user.role === 'enfermeira';
  const canPerform = user.role === 'administrador' || user.role === 'laboratorio';
  const canAddOpinion = user.role === 'administrador' || user.role === 'medico';
  const canDelete = user.role === 'administrador';

  const fetchData = useCallback(async () => {
    let tests = await getData('labTests');
    if (user.role === 'paciente') tests = tests.filter(t => t.patient_id === user.patientId);
    setLabTests(tests.sort((a, b) => new Date(b.date) - new Date(a.date)));
    if(canRequest || canPerform || canAddOpinion) setPatients(await getData('patients'));
  }, [getData, user, canRequest, canPerform, canAddOpinion]);

  useEffect(() => { 
    fetchData();
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      if(!canRequest) {
        toast({variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para solicitar exames.'});
        return;
      }
      openForm(null, params.get('patientId'));
    }
  }, [fetchData, location.search, canRequest, toast]);

  const handleSaveTest = async (testData) => {
    const isUpdating = !!testData.id;
    const dataToSave = { ...testData, id: isUpdating ? testData.id : crypto.randomUUID(), patient_id: testData.patientId, status: isUpdating ? (testData.file ? 'Concluído' : testData.status) : 'Pendente', updated_at: new Date().toISOString(), created_at: isUpdating ? testData.created_at : new Date().toISOString(), requested_by: isUpdating ? testData.requested_by : user.name };
    if (dataToSave.file && !isUpdating) dataToSave.performed_by = user.name;
    await saveData('labTests', dataToSave);
    toast({ title: `✅ Pedido ${isUpdating ? 'Atualizado' : 'Criado'}`, description: `Exame ${dataToSave.testName} salvo com sucesso.` });
    await fetchData();
    closeModals();
  };

  const handleSaveOpinion = async (test, opinion) => {
    const updatedTest = { ...test, opinion, opinion_by: user.name, opinion_at: new Date().toISOString() };
    await saveData('labTests', updatedTest);
    toast({ title: '✅ Laudo Salvo', description: 'O laudo médico foi adicionado ao exame.' });
    await fetchData();
    closeModals();
  };

  const handleUpdateStatus = async (testId, status) => {
      const test = labTests.find(t => t.id === testId);
      if(!test) return;
      if (status === 'Concluído' && !test.file) {
          toast({ variant: 'destructive', title: 'Resultado Pendente', description: 'Anexe o arquivo de resultado antes de concluir.' });
          setDetailsTest(test);
          return;
      }
      const updatedTest = { ...test, status, updated_at: new Date().toISOString(), performed_by: user.name };
      await saveData('labTests', updatedTest);
      await fetchData();
      toast({title: `Status Atualizado`, description: `O exame de ${test.patientName} agora está ${status}.`});
  };

  const handleDelete = async (testId) => {
      await deleteData('labTests', testId);
      await fetchData();
      toast({title: `🗑️ Exame Excluído`, description: 'O pedido de exame foi removido.'});
      setDeletingTest(null);
  }

  const openForm = (test = null, patientId = null) => { setEditingTest(test); setShowForm(true); if(patientId) setEditingTest(prev => ({...prev, patientId})); };
  const closeModals = () => { setShowForm(false); setEditingTest(null); setDetailsTest(null); setOpinionTest(null); navigate('/laboratorio', {replace: true}); };

  const filteredTests = labTests.filter(t => (t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.testName.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === 'Todos' || t.status === statusFilter));
  const getStatusPill = (status) => { const s = {'Concluído': {i: ClipboardCheck, c: 'emerald'}, 'Pendente': {i: Clock, c: 'amber'}, 'Urgente': {i: AlertTriangle, c: 'red'}}[status]; if(!s) return null; const {i:I, c} = s; return <div className={`flex items-center space-x-1 text-xs font-medium text-${c}-800 bg-${c}-100 px-2 py-1 rounded-full`}><I className="w-3 h-3"/><span>{status}</span></div>; };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-800">Painel do Laboratório</h1><p className="text-gray-600">Gerencie pedidos e resultados de exames.</p></div>
        <div className="flex gap-2">
            {canRequest && <Button className="bg-gradient-to-r from-cyan-500 to-sky-600 text-white" onClick={() => openForm()}><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>}
            {(user.role === 'administrador' || user.role === 'medico') && <Button variant="outline" onClick={() => exportLabTests(filteredTests, 'pdf')}><FileDown className="w-4 h-4 mr-2" />PDF</Button>}
        </div>
      </div>
      <div className="glass-effect p-6 rounded-2xl"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Buscar por paciente ou exame..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/50"/></div><Select onValueChange={setStatusFilter} value={statusFilter}><SelectTrigger className="bg-white/50"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos</SelectItem><SelectItem value="Pendente">Pendentes</SelectItem><SelectItem value="Concluído">Concluídos</SelectItem><SelectItem value="Urgente">Urgentes</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-4">
        {!filteredTests.length ? (<div className="text-center py-12 glass-effect rounded-2xl"><FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-600">Nenhum pedido encontrado</h3>{canRequest && <Button className="mt-4 bg-gradient-to-r from-cyan-500 to-sky-600 text-white" onClick={() => openForm()}><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>}</div>) : 
        (filteredTests.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="glass-effect p-4 rounded-2xl card-hover">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1"><div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-full flex items-center justify-center shrink-0"><Beaker className="w-6 h-6 text-white" /></div><div className="flex-1"><h3 className="font-semibold text-gray-800">{test.testName}</h3><div className="flex items-center space-x-2 text-sm text-gray-600 mt-1"><User className="w-4 h-4" /><span>{test.patientName}</span></div><p className="text-xs text-gray-500 mt-1">Pedido em: {formatDate(test.date)}</p></div></div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">{getStatusPill(test.status)}{test.file && <Paperclip className="w-4 h-4 text-emerald-600" title="Resultado Anexado" />}{test.opinion && <MessageSquare className="w-4 h-4 text-blue-600" title="Laudo Médico Registrado"/>}</div>
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailsTest(test)}><Eye className="w-4 h-4 text-gray-500 hover:text-blue-600" /></Button>
                        {canPerform && <Button variant="ghost" size="icon" onClick={() => openForm(test)}><Edit className="w-4 h-4 text-gray-500 hover:text-emerald-600" /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeletingTest(test)}><Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" /></Button>}
                        {canPerform && test.status !== 'Concluído' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(test.id, 'Concluído')}><ClipboardCheck className="w-4 h-4 mr-1"/>Concluir</Button>}
                    </div>
                </div>
              </div>
            </motion.div>
        )))}
      </div>
      <AnimatePresence>
        {(showForm || detailsTest || opinionTest) && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeModals}><div onClick={e => e.stopPropagation()}>
            {showForm && <LabTestForm test={editingTest} onSave={handleSaveTest} onCancel={closeModals} patients={patients} patientId={editingTest?.patientId} />}
            {detailsTest && <DetailsModal test={detailsTest} onCancel={closeModals} onAddOpinion={() => { setDetailsTest(null); setOpinionTest(detailsTest); }} canAddOpinion={canAddOpinion} canPerform={canPerform} onUploadResult={() => { closeModals(); openForm(detailsTest); }} />}
            {opinionTest && <OpinionForm test={opinionTest} onSave={handleSaveOpinion} onCancel={closeModals} />}
        </div></div>}
      </AnimatePresence>
      <AlertDialog open={!!deletingTest} onOpenChange={() => setDeletingTest(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir o pedido de exame para {deletingTest?.patientName}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(deletingTest.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Lab;