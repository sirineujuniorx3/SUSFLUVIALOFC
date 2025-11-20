
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, User, FileText, Plus, Search, Filter, 
  MoreVertical, CheckCircle, XCircle, AlertCircle, Stethoscope, Activity,
  Thermometer, Heart, Wind, Scale, Ruler, Syringe, Pill, Brain, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, cn, normalizeDate } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const NurseTriageModal = ({ appointment, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        // Vital Signs
        bp: '', hr: '', temp: '', rr: '', sat: '', weight: '', height: '', glucose: '',
        // Anamnesis
        chief_complaint: '',
        history: '',
        allergies: '',
        medications: '',
        // Urgency specific
        pain_level: '0',
        consciousness: 'Alerta',
        risk_classification: 'blue' // blue, green, yellow, orange, red
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const triageData = {
            vital_signs: {
                bp: formData.bp, hr: formData.hr, temp: formData.temp, 
                rr: formData.rr, sat: formData.sat, weight: formData.weight, 
                height: formData.height, glucose: formData.glucose
            },
            chief_complaint: formData.chief_complaint,
            medical_history: formData.history,
            allergies: formData.allergies,
            current_medications: formData.medications,
            pain_level: formData.pain_level,
            consciousness: formData.consciousness,
            risk_classification: formData.risk_classification,
            triage_at: new Date().toISOString()
        };
        
        onSave(appointment.id, triageData);
    };

    const riskColors = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        orange: 'bg-orange-500',
        red: 'bg-red-500'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Triagem: {appointment.patientName}</h3>
                    <p className="text-sm text-gray-500">{appointment.type} - {formatDateTime(appointment.date)}</p>
                </div>
                <div className={`w-4 h-4 rounded-full ${riskColors[formData.risk_classification]}`} title="Classificação de Risco"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vital Signs Section */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2"><Activity className="w-4 h-4"/> Sinais Vitais</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-500">PA (mmHg)</label><Input name="bp" value={formData.bp} onChange={handleChange} placeholder="120/80" className="h-8"/></div>
                        <div><label className="text-xs text-gray-500">FC (bpm)</label><Input name="hr" value={formData.hr} onChange={handleChange} placeholder="75" className="h-8"/></div>
                        <div><label className="text-xs text-gray-500">Temp (°C)</label><Input name="temp" value={formData.temp} onChange={handleChange} placeholder="36.5" className="h-8"/></div>
                        <div><label className="text-xs text-gray-500">SatO2 (%)</label><Input name="sat" value={formData.sat} onChange={handleChange} placeholder="98" className="h-8"/></div>
                        <div><label className="text-xs text-gray-500">Peso (kg)</label><Input name="weight" value={formData.weight} onChange={handleChange} placeholder="70" className="h-8"/></div>
                        <div><label className="text-xs text-gray-500">Glicemia (mg/dL)</label><Input name="glucose" value={formData.glucose} onChange={handleChange} placeholder="90" className="h-8"/></div>
                    </div>
                </div>

                {/* Anamnesis Section */}
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4"/> Anamnese Simplificada</h4>
                    <div>
                        <label className="text-xs font-medium text-gray-700">Queixa Principal *</label>
                        <Textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} placeholder="Motivo da consulta..." className="h-20 resize-none"/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700">Alergias</label>
                        <Input name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Nenhuma conhecida" className="h-8"/>
                    </div>
                </div>
            </div>

            {/* Risk Classification */}
            <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Classificação de Risco</label>
                <div className="flex gap-2">
                    {Object.keys(riskColors).map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, risk_classification: color }))}
                            className={`w-8 h-8 rounded-full transition-transform ${riskColors[color]} ${formData.risk_classification === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Salvar Triagem</Button>
            </div>
        </div>
    );
};

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isTriageOpen, setIsTriageOpen] = useState(false);

    const { toast } = useToast();
    const { saveData, getData } = useDataSync();
    const { user } = useAuth();

    // Form state for new appointment
    const [newAppointment, setNewAppointment] = useState({
        patient_id: '',
        doctor_id: '',
        date: '',
        time: '',
        type: 'Consulta',
        reason: '',
        status: 'Agendado'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedAppointments, fetchedPatients, fetchedUsers] = await Promise.all([
                getData('appointments'),
                getData('patients'),
                getData('users')
            ]);
            
            setAppointments(fetchedAppointments.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setPatients(fetchedPatients);
            setDoctors(fetchedUsers.filter(u => u.role === 'medico'));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Listen for storage changes to update list if modified elsewhere
        const handleStorageChange = (e) => {
            if (e.key === 'appointments') {
                fetchData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleCreateAppointment = async () => {
        if (!newAppointment.patient_id || !newAppointment.date || !newAppointment.time) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha paciente, data e hora." });
            return;
        }

        // Explicitly validate date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newAppointment.date)) {
             console.error("Invalid date format:", newAppointment.date);
             toast({ variant: "destructive", title: "Data inválida", description: "A data deve estar no formato YYYY-MM-DD." });
             return;
        }

        const patient = patients.find(p => p.id === newAppointment.patient_id);
        const doctor = doctors.find(d => d.id === newAppointment.doctor_id) || { name: 'Não atribuído' };
        
        // Construct ISO-like string for local time preservation
        const fullDateString = `${newAppointment.date}T${newAppointment.time}`;
        console.log("Creating appointment with date:", fullDateString);

        const appointmentData = {
            id: Date.now().toString(),
            ...newAppointment,
            date: fullDateString,
            patientName: patient?.name || 'Desconhecido',
            doctorName: doctor?.name || 'Não atribuído',
            created_at: new Date().toISOString(),
            status: 'Agendado' // Explicitly set initial status
        };

        try {
            await saveData('appointments', appointmentData);
            toast({ title: "Sucesso", description: "Agendamento criado com sucesso." });
            setIsNewAppointmentOpen(false);
            setNewAppointment({ patient_id: '', doctor_id: '', date: '', time: '', type: 'Consulta', reason: '', status: 'Agendado' });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao criar agendamento." });
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const appointment = appointments.find(a => a.id === id);
        if (!appointment) return;

        // Validation Logic
        const validTransitions = {
            'Agendado': ['Aguardando Atendimento', 'Cancelado'],
            'Aguardando Atendimento': ['Aguardando Médico', 'Cancelado'], // 'Aguardando Médico' usually via Triage, but admin might force
            'Aguardando Médico': ['Em Atendimento', 'Cancelado'],
            'Em Atendimento': ['Realizado', 'Cancelado'],
            'Realizado': [],
            'Cancelado': []
        };

        // Allow admin to override or if transition is valid
        const isValid = user.role === 'administrador' || validTransitions[appointment.status]?.includes(newStatus);

        if (!isValid) {
             toast({ variant: "destructive", title: "Ação Inválida", description: `Não é possível alterar de "${appointment.status}" para "${newStatus}".` });
             return;
        }

        const updatedAppointment = { ...appointment, status: newStatus, updated_at: new Date().toISOString() };
        
        try {
            await saveData('appointments', updatedAppointment);
            toast({ title: "Status Atualizado", description: `Status alterado para ${newStatus}` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao atualizar status." });
        }
    };

    const handleOpenTriage = (appointment) => {
        setSelectedAppointment(appointment);
        setIsTriageOpen(true);
    };

    const handleSaveTriage = async (id, triageData) => {
        const appointment = appointments.find(a => a.id === id);
        if (!appointment) return;

        if (appointment.status !== 'Aguardando Atendimento' && user.role !== 'administrador') {
             toast({ variant: "destructive", title: "Erro", description: "Paciente deve estar 'Aguardando Atendimento' para realizar triagem." });
             return;
        }

        // CRITICAL: Change status to 'Aguardando Médico' after triage
        const updatedAppointment = { 
            ...appointment, 
            triage: triageData,
            triage_by: user.name,
            status: 'Aguardando Médico', 
            updated_at: new Date().toISOString() 
        };
        
        try {
            await saveData('appointments', updatedAppointment);
            toast({ title: "Triagem Salva", description: "Dados vitais registrados. Paciente aguardando médico." });
            setIsTriageOpen(false);
            setSelectedAppointment(null);
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar triagem." });
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
        
        if (user.role === 'medico') {
            return matchesSearch && matchesStatus && (apt.doctor_id === user.id || !apt.doctor_id);
        }
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => ({
        'Agendado': 'bg-blue-100 text-blue-800',
        'Aguardando Atendimento': 'bg-yellow-100 text-yellow-800',
        'Aguardando Médico': 'bg-sky-100 text-sky-800',
        'Em Atendimento': 'bg-orange-100 text-orange-800',
        'Realizado': 'bg-emerald-100 text-emerald-800',
        'Cancelado': 'bg-red-100 text-red-800'
    })[status] || 'bg-gray-100 text-gray-800';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Atendimentos</h1>
                    <p className="text-gray-600">Gerencie agendamentos e fila de espera.</p>
                </div>
                {/* RESTRICTED: Only Recepcionista and Admin can create appointments */}
                {(user.role === 'recepcionista' || user.role === 'administrador') && (
                    <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Novo Agendamento</DialogTitle>
                                <DialogDescription>Preencha os dados abaixo para agendar um novo atendimento.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Paciente</label>
                                    <Select onValueChange={(val) => setNewAppointment({...newAppointment, patient_id: val})}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                                        <SelectContent>
                                            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Médico</label>
                                    <Select onValueChange={(val) => setNewAppointment({...newAppointment, doctor_id: val})}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione o médico (opcional)" /></SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Data</label>
                                    <Input type="date" className="col-span-3" value={newAppointment.date} onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Hora</label>
                                    <Input type="time" className="col-span-3" value={newAppointment.time} onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Tipo</label>
                                    <Select value={newAppointment.type} onValueChange={(val) => setNewAppointment({...newAppointment, type: val})}>
                                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Consulta">Consulta</SelectItem>
                                            <SelectItem value="Retorno">Retorno</SelectItem>
                                            <SelectItem value="Exame">Exame</SelectItem>
                                            <SelectItem value="Urgência">Urgência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateAppointment}>Agendar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                        placeholder="Buscar por paciente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Agendado">Agendado</SelectItem>
                        <SelectItem value="Aguardando Atendimento">Aguardando Atendimento</SelectItem>
                        <SelectItem value="Aguardando Médico">Aguardando Médico</SelectItem>
                        <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                        <SelectItem value="Realizado">Realizado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredAppointments.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Nenhum agendamento encontrado.</td></tr>
                            ) : (
                                filteredAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{apt.patientName}</div>
                                            <div className="text-xs text-gray-500">Dr. {apt.doctorName}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {formatDate(apt.date)}</div>
                                            <div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {new Date(apt.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{apt.type}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Reception Actions */}
                                                {apt.status === 'Agendado' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(apt.id, 'Aguardando Atendimento')}>
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Confirmar Chegada
                                                    </Button>
                                                )}
                                                
                                                {/* Nurse Actions */}
                                                {apt.status === 'Aguardando Atendimento' && (user.role === 'enfermeira' || user.role === 'administrador') && (
                                                    <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenTriage(apt)}>
                                                        <Activity className="w-4 h-4 mr-1" /> Triagem
                                                    </Button>
                                                )}

                                                {/* Cancel Action */}
                                                {['Agendado', 'Aguardando Atendimento'].includes(apt.status) && (
                                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusChange(apt.id, 'Cancelado')}>
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Triage Modal */}
            <Dialog open={isTriageOpen} onOpenChange={setIsTriageOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Triagem de Enfermagem</DialogTitle>
                        <DialogDescription>Registre os sinais vitais e a anamnese inicial do paciente.</DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <NurseTriageModal 
                            appointment={selectedAppointment} 
                            onSave={handleSaveTriage} 
                            onCancel={() => setIsTriageOpen(false)} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Appointments;
