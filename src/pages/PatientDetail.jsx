import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, Phone, Plus, Stethoscope, Syringe, Edit, X, UserCircle, HeartPulse, FlaskConical, Shield, Download, MessageSquare, AlertTriangle, Info, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime } from '@/lib/utils';
import { exportPatientRecord } from '@/lib/reports';

const VaccineForm = ({ onSave, onCancel, vaccineStock, user }) => {
    const [formData, setFormData] = useState({ vaccine_stock_id: '', dose: '', vaccination_date: new Date().toISOString().split('T')[0] });
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-effect p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Registrar Vacina Aplicada</h2><Button variant="ghost" size="icon" onClick={onCancel}><X /></Button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select onValueChange={(value) => setFormData({...formData, vaccine_stock_id: value})} required><SelectTrigger><SelectValue placeholder="Selecione a Vacina *" /></SelectTrigger><SelectContent>{vaccineStock.filter(v => v.quantity > 0).map(v => <SelectItem key={v.id} value={v.id}>{v.name} (Lote: {v.batch})</SelectItem>)}</SelectContent></Select>
                <div className="grid grid-cols-2 gap-4">
                    <Input name="dose" value={formData.dose} onChange={e => setFormData({...formData, dose: e.target.value})} placeholder="Dose (Ex: 1ª)" required/>
                    <Input name="vaccination_date" type="date" value={formData.vaccination_date} onChange={e => setFormData({...formData, vaccination_date: e.target.value})} required/>
                </div>
                <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1 medical-gradient text-white">Registrar</Button></div>
            </form>
        </motion.div>
    );
};

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [vaccineStock, setVaccineStock] = useState([]);
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const { toast } = useToast();
  const { saveData, getData } = useDataSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const canEditPatient = user.role === 'administrador' || user.role === 'recepcionista' || user.role === 'enfermeira';
  const canManageVaccines = user.role === 'administrador' || user.role === 'enfermeira' || user.role === 'medico';
  const canRequestItems = user.role === 'administrador' || user.role === 'enfermeira' || user.role === 'medico';
  const hasFullRecordAccess = user.role === 'administrador' || user.role === 'medico' || user.role === 'paciente';
  const hasPartialRecordAccess = user.role === 'enfermeira';

  const fetchData = useCallback(async () => {
    try {
        const patientsData = await getData('patients');
        const patientData = patientsData.find(p => p.id === id);
        if (!patientData) { toast({variant: 'destructive', title: 'Paciente não encontrado'}); navigate('/pacientes'); return; }
        setPatient(patientData);

        const appointments = await getData('appointments', { patient_id: id });
        const vaccines = await getData('vaccines', { patient_id: id });
        const labTests = await getData('labTests', { patient_id: id });
        
        let stock = [];
        if (canManageVaccines) {
            stock = await getData('vaccine_stock');
            setVaccineStock(stock);
        }

        const combinedHistory = [
          ...appointments.map(a => ({ ...a, record_type: 'Atendimento', date: new Date(a.date) })),
          ...vaccines.map(v => {
              const stockItem = stock.find(s => s.id === v.vaccine_stock_id);
              return { ...v, vaccine_name: stockItem?.name || 'Vacina desconhecida', record_type: 'Vacina', date: new Date(v.vaccination_date) };
          }),
          ...labTests.map(l => ({ ...l, record_type: 'Exame Laboratorial', date: new Date(l.date) }))
        ].sort((a, b) => b.date - a.date);
        
        setHistory(combinedHistory);
    } catch (error) {
        toast({variant: 'destructive', title: 'Erro ao carregar dados', description: error.message});
    }
  }, [id, getData, toast, navigate, canManageVaccines]);

  useEffect(() => { fetchData() }, [fetchData]);

  const handleSaveVaccine = async (vaccineData) => {
    try {
      if (!canManageVaccines) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para registrar vacinas.' });
        return;
      }
      const stockItem = vaccineStock.find(v => v.id === vaccineData.vaccine_stock_id);
      if (!stockItem || stockItem.quantity <= 0) {
        toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: 'A vacina selecionada não está mais disponível.' });
        return;
      }
      
      const dataToSave = { ...vaccineData, id: crypto.randomUUID(), patient_id: id, created_at: new Date().toISOString(), applied_by: user.name };
      await saveData('vaccines', dataToSave);
      
      const updatedStockItem = { ...stockItem, quantity: stockItem.quantity - 1 };
      await saveData('vaccine_stock', updatedStockItem);

      await fetchData();
      setShowVaccineForm(false);
      toast({ title: "💉 Vacina Registrada", description: `${stockItem.name} adicionada ao histórico.` });
    } catch (error) {
      toast({ variant: 'destructive', title: '❌ Erro ao Salvar', description: error.message });
    }
  };

  const handleExport = () => {
    if (patient && history) {
      exportPatientRecord(patient, history);
      toast({ title: "📄 Prontuário Gerado", description: "O PDF do prontuário foi exportado." });
    }
  };

  const getHistoryItem = (item) => {
    const isMedical = item.type === 'Consulta Médica' || item.type === 'Retorno' || item.type === 'Avaliação Pré-operatória';
    
    switch(item.record_type) {
        case 'Atendimento': 
            // Enfermeira não vê evolução médica (diagnosis, prescription)
            if (hasPartialRecordAccess && isMedical) {
                return <div className="flex items-start space-x-4 w-full"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><HeartPulse className="w-5 h-5 text-blue-600"/></div><div><p className="font-semibold">{item.type}</p><p className="text-sm text-gray-500 italic">Evolução médica visível apenas para o médico.</p>{item.triage && <p className="text-sm text-gray-600 mt-1"><b>Triagem:</b> {item.triage.complaints}</p>}</div></div>;
            }
            if (!hasFullRecordAccess && !hasPartialRecordAccess) return null;
            return <div className="flex items-start space-x-4 w-full"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><HeartPulse className="w-5 h-5 text-blue-600"/></div><div><p className="font-semibold">{item.type}</p><p className="text-sm text-gray-600">{item.description || 'Nenhuma descrição'}</p>{item.triage && <p className="text-sm text-gray-600 mt-1"><b>Triagem:</b> {item.triage.complaints}</p>}{item.diagnosis && <p className="text-sm text-gray-600 mt-1"><b>Diagnóstico:</b> {item.diagnosis}</p>}</div></div>;
        case 'Vacina':
            if (!hasFullRecordAccess && !hasPartialRecordAccess) return null;
            return <div className="flex items-start space-x-4 w-full"><div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-teal-600"/></div><div><p className="font-semibold">{item.vaccine_name}</p><p className="text-sm text-gray-600">Dose: {item.dose}</p></div></div>;
        case 'Exame Laboratorial':
            if (!hasFullRecordAccess && user.role !== 'laboratorio' && !hasPartialRecordAccess) return null;
            return <div className="flex items-start space-x-4 w-full"><div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0"><FlaskConical className="w-5 h-5 text-cyan-600"/></div><div><p className="font-semibold">{item.testName}</p><p className={`text-sm font-medium ${item.status === 'Concluído' ? 'text-emerald-600' : 'text-amber-600'}`}>Status: {item.status}</p>{(hasFullRecordAccess || user.role === 'laboratorio') && <div className="flex items-center gap-2">{item.file && <Button size="sm" variant="link" className="p-0 h-auto" onClick={() => { const link = document.createElement('a'); link.href = item.file; link.download = `resultado_${item.testName.replace(/\s/g, '_')}`; link.click(); }}><Download className="w-3 h-3 mr-1"/>Baixar Resultado</Button>}{item.opinion && <span className="text-blue-600 flex items-center text-sm"><MessageSquare className="w-3 h-3 mr-1" />Laudo disponível</span>}</div>}</div></div>;
        default: return null;
    }
  }

  if (!patient) return <div className="flex items-center justify-center h-64 text-center"><User className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-600">Carregando...</h3></div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {user.role !== 'paciente' && <Link to="/pacientes"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>}
            <div><h1 className="text-3xl font-bold text-gray-800">{patient.name}</h1><p className="text-gray-600">Prontuário Eletrônico do Paciente</p></div>
          </div>
          <div className="flex items-center gap-2">
            {canEditPatient && <Link to={`/pacientes?action=edit&id=${patient.id}`}><Button variant="outline"><Edit className="w-4 h-4 mr-2" />Editar Cadastro</Button></Link>}
            {user.role === 'medico' && <Button variant="outline" onClick={handleExport}><Printer className="w-4 h-4 mr-2"/>Exportar PDF</Button>}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shrink-0">{patient.photo ? <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover"/> : <UserCircle className="w-24 h-24 text-gray-400" />}</div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4"><div><span className="text-sm font-medium text-gray-500">Idade</span><p className="text-lg text-gray-800">{patient.age} anos</p></div><div><span className="text-sm font-medium text-gray-500">Gênero</span><p className="text-lg text-gray-800">{patient.gender || 'N/I'}</p></div></div>
              <div className="space-y-4"><div><span className="text-sm font-medium text-gray-500">Comunidade</span><div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-gray-400" /><p className="text-lg text-gray-800">{patient.community}</p></div></div>{patient.phone && <div><span className="text-sm font-medium text-gray-500">Telefone</span><div className="flex items-center space-x-2"><Phone className="w-4 h-4 text-gray-400" /><p className="text-lg text-gray-800">{patient.phone}</p></div></div>}</div>
            </div>
          </div>
          {patient.conditions && (hasFullRecordAccess || hasPartialRecordAccess) && <div className="mt-6 p-4 bg-amber-50 rounded-lg"><h3 className="font-medium text-amber-800 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" />Condições Médicas Conhecidas</h3><p className="text-amber-700">{patient.conditions}</p></div>}
        </motion.div>
        {canRequestItems && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to={`/atendimentos?action=add&patientId=${patient.id}`}><Button className="w-full medical-gradient text-white h-16"><Stethoscope className="w-5 h-5 mr-2" />Novo Atendimento</Button></Link>
            {canManageVaccines && <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 h-16" onClick={() => setShowVaccineForm(true)}><Syringe className="w-5 h-5 mr-2" />Registrar Vacina</Button>}
            <Link to={`/laboratorio?action=add&patientId=${patient.id}`}><Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 h-16"><FlaskConical className="w-5 h-5 mr-2" />Solicitar Exame</Button></Link>
        </div>}
        
        {!(hasFullRecordAccess || hasPartialRecordAccess || user.role === 'laboratorio') && <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center gap-3"><Info className="w-5 h-5"/><div><h3 className="font-bold">Acesso Limitado</h3><p>Como recepcionista, você não tem permissão para visualizar o histórico de saúde do paciente.</p></div></div>}

        {(hasFullRecordAccess || hasPartialRecordAccess || user.role === 'laboratorio') && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-effect p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Histórico de Saúde</h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {history.length === 0 ? <div className="text-center py-8"><p className="text-gray-500">Nenhum registro no histórico.</p></div> : 
                history.map(item => {
                    const historyItemComponent = getHistoryItem(item);
                    return historyItemComponent ? (
                        <div key={item.id} className="p-4 bg-white/50 rounded-lg flex justify-between items-start">
                            {historyItemComponent}
                            <span className="text-xs text-gray-500 shrink-0 ml-4">{formatDateTime(item.date)}</span>
                        </div>
                    ) : null;
                })}
            </div>
        </motion.div>}
      </div>
      <AnimatePresence>
          {showVaccineForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowVaccineForm(false)}><div onClick={e => e.stopPropagation()}><VaccineForm onSave={handleSaveVaccine} onCancel={() => setShowVaccineForm(false)} vaccineStock={vaccineStock} user={user} /></div></div>}
      </AnimatePresence>
    </>
  );
};

export default PatientDetail;