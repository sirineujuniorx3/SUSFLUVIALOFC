
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Clock, Stethoscope, Beaker, CheckCircle, X, Info, HeartPulse, Shield, FlaskConical, Download, MessageSquare, Printer, FileText, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { exportPatientRecord } from '@/lib/reports';

const NurseDataDisplay = ({ triageData }) => {
    if (!triageData) return <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 flex items-center gap-2"><Info className="w-4 h-4"/>Nenhum dado de enfermagem registrado para este atendimento.</div>;
    
    const isTriageOrUrgency = triageData.chief_complaint;

    return (
        <div className="space-y-4 p-4 bg-white/60 rounded-lg border border-white/20">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600"/>Registro de Enfermagem</h4>
            {isTriageOrUrgency ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                        <p><strong>PA:</strong> {triageData.vital_signs?.bp || 'N/A'}</p>
                        <p><strong>FC:</strong> {triageData.vital_signs?.hr || 'N/A'}</p>
                        <p><strong>Temp:</strong> {triageData.vital_signs?.temp || 'N/A'}</p>
                        <p><strong>FR:</strong> {triageData.vital_signs?.rr || 'N/A'}</p>
                    </div>
                    <div><p className="font-medium text-sm">Queixa Principal:</p><p className="text-sm text-gray-800">{triageData.chief_complaint}</p></div>
                    {triageData.medical_history && <div><p className="font-medium text-sm">Histórico Médico:</p><p className="text-sm text-gray-800">{triageData.medical_history}</p></div>}
                    {triageData.symptoms && <div><p className="font-medium text-sm">Sintomas (Urgência):</p><p className="text-sm text-gray-800">{triageData.symptoms}</p></div>}
                    {triageData.initial_measures && <div><p className="font-medium text-sm">Medidas Iniciais (Urgência):</p><p className="text-sm text-gray-800">{triageData.initial_measures}</p></div>}
                </>
            ) : (
                <div><p className="font-medium text-sm">Observações Iniciais:</p><p className="text-sm text-gray-800">{triageData.initial_observations}</p></div>
            )}
            <p className="text-xs text-gray-500 pt-2 border-t border-white/30">Realizado por {triageData.triage_by || 'Enfermagem'} em {formatDateTime(triageData.triage_at)}</p>
        </div>
    );
};

const ClinicalCareModal = ({ appointment, onSave, onCancel, onNewExam, onExport, patient }) => {
    const { user } = useAuth();
    const { getData } = useDataSync();
    const { toast } = useToast();
    const [patientHistory, setPatientHistory] = useState([]);
    const [formData, setFormData] = useState({
        evolution: appointment.description || '',
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
    });

    const fetchPatientHistory = useCallback(async () => {
        if (!appointment.patient_id) return;
        const allAppointments = await getData('appointments', { patient_id: appointment.patient_id });
        const allVaccines = await getData('vaccines', { patient_id: appointment.patient_id });
        const allLabTests = await getData('labTests', { patient_id: appointment.patient_id });
        const vaccineStock = await getData('vaccine_stock');

        const combined = [
            ...allAppointments.map(a => ({ ...a, record_type: 'Atendimento', date: new Date(a.date) })),
            ...allVaccines.map(v => ({ ...v, vaccine_name: vaccineStock.find(s => s.id === v.vaccine_stock_id)?.name || 'N/A', record_type: 'Vacina', date: new Date(v.vaccination_date) })),
            ...allLabTests.map(l => ({ ...l, record_type: 'Exame Laboratorial', date: new Date(l.date) }))
        ].sort((a, b) => b.date - a.date);
        setPatientHistory(combined);
    }, [appointment.patient_id, getData]);

    useEffect(() => {
        fetchPatientHistory();
    }, [fetchPatientHistory]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        if (!formData.evolution || !formData.diagnosis) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "É necessário preencher a Evolução e o Diagnóstico para finalizar." });
            return;
        }
        onSave(appointment.id, formData);
    };

    const getHistoryItem = (item) => {
        switch(item.record_type) {
            case 'Atendimento': return <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><HeartPulse className="w-4 h-4 text-blue-600"/></div><div><p className="font-semibold text-sm">{item.type}</p><p className="text-xs text-gray-600">{item.description || 'Consulta de rotina'}</p></div></div>;
            case 'Vacina': return <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-teal-600"/></div><div><p className="font-semibold text-sm">{item.vaccine_name}</p><p className="text-xs text-gray-600">Dose: {item.dose}</p></div></div>;
            case 'Exame Laboratorial': return <div className="flex items-start space-x-3"><div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shrink-0"><FlaskConical className="w-4 h-4 text-cyan-600"/></div><div><p className="font-semibold text-sm">{item.testName}</p><p className={`text-xs font-medium ${item.status === 'Concluído' ? 'text-emerald-600' : 'text-amber-600'}`}>Status: {item.status}</p>{item.file && <Button size="sm" variant="link" className="p-0 h-auto text-xs" onClick={() => { const link = document.createElement('a'); link.href = item.file; link.download = `resultado_${item.testName.replace(/\s/g, '_')}`; link.click(); }}><Download className="w-3 h-3 mr-1"/>Baixar</Button>}{item.opinion && <span className="text-blue-600 flex items-center text-xs"><MessageSquare className="w-3 h-3 mr-1" />Laudo</span>}</div></div>;
            default: return null;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-effect p-6 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4 border-white/20">
                <div><h2 className="text-2xl font-bold text-gray-800">Atendimento Clínico: {appointment.type}</h2><p className="text-gray-600">Paciente: <Link to={`/pacientes/${appointment.patient_id}`} className="font-semibold text-blue-600 hover:underline">{appointment.patientName}</Link></p></div>
                 <div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => onExport(patient, patientHistory)}><Printer className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={onCancel}><X /></Button></div>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col space-y-4 overflow-y-auto pr-2">
                    <NurseDataDisplay triageData={{...appointment.triage, triage_by: appointment.triage_by, triage_at: appointment.triage_at}} />
                    <div><label className="font-semibold text-gray-700">Evolução / Anamnese *</label><Textarea name="evolution" value={formData.evolution} onChange={handleChange} rows={6} placeholder="Descreva a evolução clínica, queixas, exame físico..." className="bg-white/50 mt-1" /></div>
                    <div><label className="font-semibold text-gray-700">Hipótese Diagnóstica / CID *</label><Textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={3} placeholder="Liste as hipóteses diagnósticas ou o CID" className="bg-white/50 mt-1" /></div>
                    <div><label className="font-semibold text-gray-700">Prescrição / Plano Terapêutico</label><Textarea name="prescription" value={formData.prescription} onChange={handleChange} rows={4} placeholder="Insira medicamentos, dosagens, orientações..." className="bg-white/50 mt-1" /></div>
                </div>
                <div className="flex flex-col bg-white/30 p-4 rounded-lg overflow-hidden">
                    <h3 className="font-bold text-gray-800 mb-3">Histórico do Paciente</h3>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                        {patientHistory.length > 0 ? patientHistory.map(item => (
                            <div key={item.id} className="p-3 bg-white/50 rounded-lg flex justify-between items-start">
                                {getHistoryItem(item)}
                                <span className="text-xs text-gray-500 shrink-0 ml-2">{formatDateTime(item.date)}</span>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">Nenhum histórico encontrado.</p>}
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/20">
                <Button variant="outline" onClick={() => onNewExam(appointment.patient_id)}><Beaker className="w-4 h-4 mr-2" />Solicitar Novo Exame</Button>
                <div className="flex gap-3"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button onClick={handleSave} className="medical-gradient text-white"><CheckCircle className="w-4 h-4 mr-2" />Finalizar Atendimento</Button></div>
            </div>
        </motion.div>
    );
};

const DailySchedule = () => {
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const { toast } = useToast();
    const { saveData, getData } = useDataSync();
    const { user } = useAuth();
    const navigate = useNavigate();

    const appointmentTypes = ["Consulta", "Retorno", "Avaliação Pré-operatória", "Procedimento", "Teleconsulta", "Urgência", "Triagem"];

    const fetchData = useCallback(async () => {
        const allAppointments = await getData('appointments');
        const patients = await getData('patients');
        setAllPatients(patients);

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = allAppointments
            .filter(apt => apt.date.startsWith(today) && apt.status !== 'Cancelado' && (user.role === 'administrador' || apt.doctor_id === user.id))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        setDailyAppointments(todayAppointments);
    }, [getData, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTypeChange = async (appointmentId, newType) => {
        const appointment = dailyAppointments.find(a => a.id === appointmentId);
        if (appointment) {
            const updatedAppointment = { ...appointment, type: newType };
            await saveData('appointments', updatedAppointment);
            await fetchData();
            toast({ title: "Tipo de Atendimento Atualizado", description: `O atendimento de ${appointment.patientName} foi alterado para ${newType}.` });
        }
    };

    const handleOpenClinicalCare = async (appointment) => {
        const updatedAppointment = { ...appointment, status: 'Em Atendimento', updated_at: new Date().toISOString() };
        await saveData('appointments', updatedAppointment);
        await fetchData(); // Refresh list to show 'Em Atendimento'
        setSelectedAppointment(updatedAppointment);
    }
    
    const handleSaveClinicalCare = async (appointmentId, clinicalData) => {
        const appointment = dailyAppointments.find(a => a.id === appointmentId);
        if (appointment) {
            const updatedAppointment = { 
                ...appointment, 
                description: clinicalData.evolution,
                diagnosis: clinicalData.diagnosis,
                prescription: clinicalData.prescription,
                status: 'Realizado',
                attended_by: user.name,
                attended_at: new Date().toISOString()
            };
            await saveData('appointments', updatedAppointment);
            await fetchData();
            setSelectedAppointment(null);
            toast({ title: "✅ Atendimento Finalizado", description: `A evolução clínica de ${appointment.patientName} foi salva.` });
        }
    };

    const handleExport = (patient, history) => {
        exportPatientRecord(patient, history);
        toast({ title: "📄 Prontuário Gerado", description: "O PDF do prontuário foi exportado." });
    };

    const handleNewExamRequest = (patientId) => {
        setSelectedAppointment(null);
        navigate(`/laboratorio?action=add&patientId=${patientId}`);
    };
    
    const getSelectedPatientData = () => {
        if (!selectedAppointment) return null;
        return allPatients.find(p => p.id === selectedAppointment.patient_id);
    };

    const getStatusColor = (status) => ({'Realizado': 'bg-emerald-100 text-emerald-800', 'Agendado': 'bg-blue-100 text-blue-800', 'Aguardando Atendimento': 'bg-yellow-100 text-yellow-800', 'Em Atendimento': 'bg-orange-100 text-orange-800'})[status] || 'bg-gray-100 text-gray-800';
    const getTime = (dateString) => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center space-x-3"><ClipboardList className="w-8 h-8 text-indigo-600"/><div><h1 className="text-3xl font-bold text-gray-800">Agenda Diária</h1><p className="text-gray-600">Pacientes agendados para hoje, {formatDate(new Date())}.</p></div></div>
                <div className="space-y-4">
                    {dailyAppointments.length === 0 ? (
                        <div className="text-center py-16 glass-effect rounded-2xl"><Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-600">Nenhum paciente na sua agenda de hoje.</h3><p className="text-gray-500">Aproveite para organizar seus registros ou tomar um café.</p></div>
                    ) : (
                        dailyAppointments.map((apt, index) => (
                            <motion.div key={apt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="glass-effect p-4 rounded-2xl card-hover">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white/50 rounded-lg">
                                            {apt.triage ? <ShieldAlert className="w-6 h-6 text-emerald-600" title="Triagem realizada"/> : <Clock className="w-5 h-5 text-gray-500" />}
                                            <span className="text-lg font-bold text-gray-800">{getTime(apt.date)}</span>
                                        </div>
                                        <div><p className="font-semibold text-gray-800 text-lg">{apt.patientName}</p><p className="text-sm text-gray-600">{apt.reason || 'Consulta de rotina'}</p></div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                        <div className="w-full md:w-52"><Select value={apt.type} onValueChange={(newType) => handleTypeChange(apt.id, newType)}><SelectTrigger className="bg-white/50"><SelectValue /></SelectTrigger><SelectContent>{appointmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium self-center ${getStatusColor(apt.status)}`}>{apt.status}</span>
                                        <Button onClick={() => handleOpenClinicalCare(apt)} disabled={apt.status === 'Realizado' || apt.status === 'Agendado'} className="medical-gradient text-white"><Stethoscope className="w-4 h-4 mr-2" /> Atender</Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedAppointment && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAppointment(null)}>
                        <div onClick={e => e.stopPropagation()}><ClinicalCareModal appointment={selectedAppointment} patient={getSelectedPatientData()} onSave={handleSaveClinicalCare} onCancel={() => {setSelectedAppointment(null); fetchData();}} onNewExam={handleNewExamRequest} onExport={handleExport}/></div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DailySchedule;
