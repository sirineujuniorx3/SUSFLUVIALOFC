import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};


const generatePDF = (title, headers, data, filename, options = {}) => {
    const doc = new jsPDF(options.orientation || 'p', 'mm', 'a4');
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    if (options.extraHeader) {
        options.extraHeader(doc);
    }
    
    // Table
    doc.autoTable({
        head: [headers.map(h => h.header)],
        body: data.map(row => headers.map(header => row[header.key] !== undefined && row[header.key] !== null ? String(row[header.key]) : 'N/A')),
        startY: options.startY || 35,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: options.columnStyles || {}
    });

    if (options.afterTable) {
        options.afterTable(doc);
    }

    doc.save(filename);
};

// --- Report Specific Functions ---

export const exportPatientRecord = (patient, history) => {
    const doc = new jsPDF();
    const filename = `prontuario_${patient.name.replace(/\s+/g, '_')}.pdf`;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor('#10b981'); // Emerald
    doc.text("Prontuário Eletrônico do Paciente", 105, 20, { align: 'center' });
    
    // --- Patient Info ---
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Nome:`, 14, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patient.name}`, 30, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Idade:`, 14, 48);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patient.age} anos`, 30, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Gênero:`, 80, 48);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patient.gender}`, 98, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Comunidade:`, 14, 56);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patient.community}`, 42, 56);
    
    if (patient.conditions) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Condições Médicas:`, 14, 64);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#d97706'); // Amber
        doc.text(doc.splitTextToSize(patient.conditions, 180), 55, 64);
        doc.setTextColor(40);
    }
    
    let lastY = 75;
    
    // --- History Section ---
    const appointments = history.filter(h => h.record_type === 'Atendimento');
    const labTests = history.filter(h => h.record_type === 'Exame Laboratorial');
    const vaccines = history.filter(h => h.record_type === 'Vacina');

    const addSection = (title, items, renderItem) => {
        if(items.length === 0) return;
        doc.setFontSize(16);
        doc.setTextColor('#10b981');
        doc.text(title, 14, lastY);
        lastY += 8;
        items.forEach(item => {
            renderItem(item);
            lastY += 2; // spacing between entries
            if(lastY > 270) {
                doc.addPage();
                lastY = 20;
            }
        });
        lastY += 5; // spacing between sections
    };

    const renderAppointment = (item) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDateTime(item.date)} - ${item.type}`, 14, lastY);
        lastY += 5;
        doc.setFont('helvetica', 'normal');
        if (item.triage) {
            doc.text(`Triagem: ${item.triage.complaints} (Sinais: ${item.triage.vital_signs}, Risco: ${item.triage.risk_classification})`, 18, lastY, { maxWidth: 170 });
            lastY += doc.getTextDimensions(doc.splitTextToSize(`Triagem: ...`, 170)).h;
        }
        if (item.description) {
            doc.text(`Evolução: ${item.description}`, 18, lastY, { maxWidth: 170 });
            lastY += doc.getTextDimensions(doc.splitTextToSize(`Evolução: ...`, 170)).h;
        }
        if (item.diagnosis) {
            doc.text(`Diagnóstico: ${item.diagnosis}`, 18, lastY, { maxWidth: 170 });
            lastY += doc.getTextDimensions(doc.splitTextToSize(`Diagnóstico: ...`, 170)).h;
        }
        if (item.prescription) {
            doc.text(`Prescrição: ${item.prescription}`, 18, lastY, { maxWidth: 170 });
            lastY += doc.getTextDimensions(doc.splitTextToSize(`Prescrição: ...`, 170)).h;
        }
        lastY += 3;
    };
    
    const renderLabTest = (item) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDate(item.date)} - ${item.testName} (Status: ${item.status})`, 14, lastY);
        lastY += 5;
    };
    
    const renderVaccine = (item) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatDate(item.vaccination_date)} - ${item.vaccine_name} (Dose: ${item.dose})`, 14, lastY);
        lastY += 5;
    };

    addSection("Histórico de Atendimentos", appointments, renderAppointment);
    addSection("Histórico de Exames", labTests, renderLabTest);
    addSection("Histórico de Vacinas", vaccines, renderVaccine);
    
    doc.save(filename);
};

export const exportPatients = (patients, format) => {
    const filename = `relatorio_pacientes_${new Date().getTime()}`;
    const data = patients.map(p => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        community: p.community,
        phone: p.phone || 'N/A',
        conditions: p.conditions || 'N/A',
        created_at: formatDate(p.created_at)
    }));

    if (format === 'csv') {
        // Implementation for CSV
    } else {
        const headers = [
            { header: 'Nome', key: 'name' },
            { header: 'Idade', key: 'age' },
            { header: 'Gênero', key: 'gender' },
            { header: 'Comunidade', key: 'community' },
            { header: 'Telefone', key: 'phone' },
            { header: 'Data Cadastro', key: 'created_at' },
        ];
        generatePDF('Relatório de Pacientes', headers, data, `${filename}.pdf`);
    }
};

export const exportAppointments = (appointments, format) => {
    const filename = `relatorio_atendimentos_${new Date().getTime()}`;
    const data = appointments.map(a => ({
        patientName: a.patientName,
        type: a.type,
        date: formatDateTime(a.date),
        community: a.community,
        status: a.status
    }));
    
    if (format === 'csv') {
        // Implementation for CSV
    } else {
        const headers = [
            { header: 'Paciente', key: 'patientName' },
            { header: 'Tipo', key: 'type' },
            { header: 'Data e Hora', key: 'date' },
            { header: 'Comunidade', key: 'community' },
            { header: 'Status', key: 'status' },
        ];
        generatePDF('Relatório de Atendimentos', headers, data, `${filename}.pdf`);
    }
};

export const exportLabTests = (labTests, format) => {
    const filename = `relatorio_exames_${new Date().getTime()}`;
    const data = labTests.map(t => ({
        patientName: t.patientName,
        testName: t.testName,
        date: formatDate(t.date),
        status: t.status,
        notes: t.notes || 'N/A'
    }));

    if (format === 'csv') {
        // Implementation for CSV
    } else {
        const headers = [
            { header: 'Paciente', key: 'patientName' },
            { header: 'Exame', key: 'testName' },
            { header: 'Data Pedido', key: 'date' },
            { header: 'Status', key: 'status' },
            { header: 'Observações', key: 'notes' },
        ];
        generatePDF('Relatório de Exames Laboratoriais', headers, data, `${filename}.pdf`);
    }
};