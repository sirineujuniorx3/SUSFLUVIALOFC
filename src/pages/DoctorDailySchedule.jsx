import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Clock, Stethoscope, Beaker, CheckCircle, X, Info, HeartPulse, Shield, FlaskConical, Download, MessageSquare, Printer, FileText, ShieldAlert, Search, Calendar, User, Filter, ChevronRight, MoreVertical, Edit, Eye, RefreshCw, AlertCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { formatDate, formatDateTime, cn, getTodayDate, compareDates } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Helper for direct localStorage access
const getLocalData = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return [];
    }
};

const setLocalData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        // Dispatch a storage event for other components in the same window
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.error(`Error writing ${key} to localStorage`, error);
        throw new Error(`Falha ao salvar dados em ${key}`);
    }
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DoctorDailySchedule Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Algo deu errado</h2>
          <p className="text-red-600 mb-4">Ocorreu um erro inesperado ao carregar a agenda.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
            Recarregar Página
          </Button>
        </div>
      );
    }

    return this.props.children; 
  }
}

const NurseDataDisplay = ({ triageData }) => {
    const hasContent = triageData && (
        triageData.chief_complaint || 
        triageData.initial_observations || 
        (triageData.vital_signs && Object.values(triageData.vital_signs || {}).some(v => v))
    );

    if (!hasContent) return <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 flex items-center gap-2"><Info className="w-4 h-4"/>Nenhum dado de enfermagem registrado para este atendimento.</div>;
    
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
    const { toast } = useToast();
    const [patientHistory, setPatientHistory] = useState([]);
    const [formData, setFormData] = useState({
        evolution: appointment.description || '',
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
    });
    const [historyError, setHistoryError] = useState(null);

    const fetchPatientHistory = useCallback(() => {
        if (!appointment?.patient_id) return;
        setHistoryError(null);
        
        try {
            // Direct localStorage access
            const allAppointments = getLocalData('appointments');
            const allVaccines = getLocalData('vaccines');
            const allLabTests = getLocalData('labTests');
            const vaccineStock = getLocalData('vaccine_stock');

            const patientAppointments = allAppointments.filter(a => a.patient_id === appointment.patient_id);
            const patientVaccines = allVaccines.filter(v => v.patient_id === appointment.patient_id);
            const patientLabTests = allLabTests.filter(l => l.patient_id === appointment.patient_id);

            const combined = [
                ...patientAppointments.map(a => ({ ...a, record_type: 'Atendimento', date: new Date(a.date) })),
                ...patientVaccines.map(v => ({ ...v, vaccine_name: (vaccineStock || []).find(s => s.id === v.vaccine_stock_id)?.name || 'N/A', record_type: 'Vacina', date: new Date(v.vaccination_date) })),
                ...patientLabTests.map(l => ({ ...l, record_type: 'Exame Laboratorial', date: new Date(l.date) }))
            ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
            
            setPatientHistory(combined);
        } catch (error) {
            console.error("Error fetching patient history:", error);
            setHistoryError("Não foi possível carregar o histórico completo do paciente.");
            toast({ variant: "destructive", title: "Erro no Histórico", description: "Falha ao carregar histórico do paciente." });
        }
    }, [appointment?.patient_id, toast]);

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
                    {historyError && <div className="p-2 mb-2 bg-red-100 text-red-700 text-xs rounded">{historyError}</div>}
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                        {patientHistory.length > 0 ? patientHistory.map(item => (
                            <div key={`${item.record_type}-${item.id}`} className="p-3 bg-white/50 rounded-lg flex justify-between items-start">
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

//
// Helper: local current user (no external auth). Read from localStorage 'currentUser' or fallback.
//
const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem('currentUser');
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn("Invalid currentUser in localStorage", e);
    }
    // fallback user (assume this is the doctor viewing the schedule)
    return { id: 'local-doc', role: 'medico', name: 'Médico Local' };
};

//
// Local export implementation (no external API). Downloads a JSON file with patient + history.
// If you want PDF later, integrate a client-side PDF lib — for now JSON download is safe and offline.
//
const exportPatientRecordLocal = (patient, history) => {
    try {
        const payload = {
            exported_at: new Date().toISOString(),
            patient: patient || null,
            history: history || []
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const patientNameSafe = (patient?.name || 'prontuario').replace(/\s+/g, '_');
        link.download = `prontuario_${patientNameSafe}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        console.error("Export local error", err);
        throw err;
    }
};

const DoctorDailyScheduleContent = () => {
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { toast } = useToast();
    const user = getCurrentUser(); // no external auth
    const navigate = useNavigate();

    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        try {
            // Direct localStorage access
            const allAppointments = getLocalData('appointments');
            const patients = getLocalData('patients');
            setAllPatients(patients || []);

            // HOJE corrigido
            const todayStr = new Date().toISOString().split("T")[0];

            const allowedStatuses = [
                'Agendado',
                'Aguardando Atendimento',
                'Aguardando Médico',
                'Em Atendimento'
            ];

            const todayAppointments = (allAppointments || [])
                .filter(apt => {
                    if (!apt?.date) return false;

                    // Pega só "YYYY-MM-DD" do agendamento
                    const aptDateOnly = apt.date.split("T")[0];

                    // Verifica se é a data de hoje
                    const isToday = aptDateOnly === todayStr;

                    // Verifica se pertence ao médico ou admin
                    const isMyPatient =
                        user.role === 'administrador' ||
                        apt.doctor_id === user.id ||
                        !apt.doctor_id;

                    const hasAllowedStatus = allowedStatuses.includes(apt.status);

                    return isToday && isMyPatient && hasAllowedStatus;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setDailyAppointments(todayAppointments);
        } catch (error) {
            console.error("Error fetching daily schedule:", error);
            setError("Não foi possível carregar a agenda. Verifique se há dados salvos.");
            toast({
                variant: "destructive",
                title: "Erro de Carregamento",
                description: "Falha ao carregar a agenda médica."
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
        
        const intervalId = setInterval(fetchData, 3000);
        
        const handleStorageChange = (e) => {
            // refresh when appointments (or related) change in this window/tab
            if (e.key === 'appointments' || e.type === 'storage') {
                fetchData();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [fetchData]);

    const handleOpenClinicalCare = (appointment) => {
        if (appointment.status !== 'Aguardando Médico') {
             toast({ variant: "destructive", title: "Ação Inválida", description: "O paciente deve estar aguardando médico (após triagem) para iniciar o atendimento." });
             return;
        }

        try {
            const updatedAppointment = { ...appointment, status: 'Em Atendimento', updated_at: new Date().toISOString() };
            
            // Direct update to localStorage
            const allAppointments = getLocalData('appointments');
            const updatedList = allAppointments.map(a => a.id === appointment.id ? updatedAppointment : a);
            setLocalData('appointments', updatedList);
            
            fetchData();
            setSelectedAppointment(updatedAppointment);
        } catch (error) {
            console.error("Failed to start care", error);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao iniciar atendimento. Tente novamente." });
        }
    }
    
    const handleSaveClinicalCare = (appointmentId, clinicalData) => {
        const appointment = dailyAppointments.find(a => a.id === appointmentId);
        if (appointment) {
            try {
                const updatedAppointment = { 
                    ...appointment, 
                    description: clinicalData.evolution,
                    diagnosis: clinicalData.diagnosis,
                    prescription: clinicalData.prescription,
                    status: 'Realizado',
                    attended_by: user.name,
                    attended_at: new Date().toISOString()
                };
                
                // Direct update to localStorage
                const allAppointments = getLocalData('appointments');
                const updatedList = allAppointments.map(a => a.id === appointmentId ? updatedAppointment : a);
                setLocalData('appointments', updatedList);

                fetchData();
                setSelectedAppointment(null);
                toast({ title: "✅ Atendimento Finalizado", description: `Evolução de ${appointment.patientName} salva com sucesso.` });
            } catch (err) {
                console.error("Failed to save care", err);
                toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o atendimento. Tente novamente." });
            }
        }
    };

    const handleExport = (patient, history) => {
        try {
            exportPatientRecordLocal(patient, history);
            toast({ title: "📄 Prontuário Gerado", description: "O prontuário foi baixado localmente." });
        } catch (err) {
            console.error("Export error", err);
            toast({ variant: "destructive", title: "Erro na Exportação", description: "Falha ao exportar o prontuário." });
        }
    };

    const handleNewExamRequest = (patientId) => {
        setSelectedAppointment(null);
        navigate(`/laboratorio?action=add&patientId=${patientId}`);
    };
    
    const getSelectedPatientData = () => {
        if (!selectedAppointment) return null;
        return allPatients.find(p => p.id === selectedAppointment.patient_id);
    };

    const getStatusColor = (status) => ({
        'Realizado': 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        'Agendado': 'bg-blue-100 text-blue-800 border-blue-200', 
        'Aguardando Atendimento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Aguardando Médico': 'bg-sky-100 text-sky-800 border-sky-200',
        'Em Atendimento': 'bg-orange-100 text-orange-800 border-orange-200'
    })[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    const getTime = (dateString) => {
        if (!dateString) return '--:--';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredAppointments = dailyAppointments.filter(apt => 
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Note: Removed dependency on external auth. If you want strict gating, store a currentUser in localStorage under 'currentUser'.
    return (
        <>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-6 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <ClipboardList className="w-8 h-8 text-indigo-600"/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Agenda Médica</h1>
                            <div className="flex items-center text-gray-600 gap-2 mt-1">
                                <Calendar className="w-4 h-4" />
                                <span className="capitalize">{formatDate(new Date())}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-sm text-gray-500">Total Hoje</span>
                            <span className="text-2xl font-bold text-indigo-600 leading-none">{dailyAppointments.length}</span>
                        </div>
                        <Button variant="outline" size="icon" onClick={fetchData} title="Atualizar Lista">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="glass-effect p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                            placeholder="Buscar paciente..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-10 bg-white/50 border-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500 whitespace-nowrap">Exibindo {filteredAppointments.length} agendamentos</span>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-red-800">Erro ao carregar agenda</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchData} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                            Tentar Novamente
                        </Button>
                    </div>
                )}

                {/* Appointments List */}
                <div className="space-y-4">
                    {isLoading && !error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-500">Carregando agenda...</p>
                        </div>
                    ) : !error && filteredAppointments.length === 0 ? (
                        <div className="text-center py-16 glass-effect rounded-2xl border border-dashed border-gray-300">
                            {searchTerm ? (
                                <>
                                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600">Nenhum paciente encontrado</h3>
                                    <p className="text-gray-500">Não encontramos pacientes com o nome "{searchTerm}".</p>
                                    <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">Limpar busca</Button>
                                </>
                            ) : (
                                <>
                                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600">Nenhum paciente agendado para hoje</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Não há pacientes aguardando atendimento médico neste dia. 
                                        Verifique se os agendamentos foram salvos corretamente no localStorage na chave "appointments".
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredAppointments.map((apt, index) => (
                            <motion.div 
                                key={apt.id} 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ duration: 0.3, delay: index * 0.05 }} 
                                className="glass-effect p-0 rounded-2xl card-hover overflow-hidden border border-white/40"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Time Column */}
                                    <div className="bg-indigo-50/50 p-4 md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-indigo-100">
                                        <span className="text-2xl font-bold text-indigo-700">{getTime(apt.date)}</span>
                                        <span className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 p-4 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    {apt.patientName}
                                                    {apt.triage && <ShieldAlert className="w-4 h-4 text-emerald-500" title="Triagem Realizada" />}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <User className="w-3 h-3" />
                                                    <span>{apt.type}</span>
                                                    {apt.reason && (
                                                        <>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{apt.reason}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Column */}
                                    <div className="p-4 bg-gray-50/30 flex flex-row md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100">
                                        <Button 
                                            onClick={() => handleOpenClinicalCare(apt)} 
                                            disabled={apt.status !== 'Aguardando Médico' && apt.status !== 'Em Atendimento'} 
                                            className={cn("w-full md:w-auto flex-1", 
                                                (apt.status !== 'Aguardando Médico' && apt.status !== 'Em Atendimento') 
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                                                : "medical-gradient text-white shadow-md hover:shadow-lg"
                                            )}
                                        >
                                            <Stethoscope className="w-4 h-4 mr-2" /> 
                                            {apt.status === 'Em Atendimento' ? 'Continuar' : 'Atender'}
                                        </Button>
                                        
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Link to={`/pacientes/${apt.patient_id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full" title="Ver Paciente">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link to={`/atendimentos`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full" title="Editar Agendamento">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
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
                        <div onClick={e => e.stopPropagation()} className="w-full max-w-6xl">
                            <ClinicalCareModal 
                                appointment={selectedAppointment} 
                                patient={getSelectedPatientData()} 
                                onSave={handleSaveClinicalCare} 
                                onCancel={() => {setSelectedAppointment(null); fetchData();}} 
                                onNewExam={handleNewExamRequest} 
                                onExport={handleExport}
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

const DoctorDailySchedule = () => (
    <ErrorBoundary>
        <DoctorDailyScheduleContent />
    </ErrorBoundary>
);

export default DoctorDailySchedule;