import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatSeconds(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function formatDateTime(ms) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

/**
 * Generates and downloads a multi-sheet Excel (.xlsx) report from real evaluation results and participants
 */
export function exportToExcel({ results = [], participants = [], sections = [], filterSummary = 'Todos los registros' }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resultados de Evaluaciones
  const resultsRows = results.map((r, index) => ({
    '#': index + 1,
    'Documento / Carnet': r.documento,
    'Nombre Completo': r.fullName,
    'Grado': r.grade || 'Décimo Grado',
    'Sección': r.sectionName || r.sectionCode || r.sectionId,
    'Asignatura': r.subject === 'fisica' ? 'Física' : 'Química',
    'Intento N°': r.attemptNumber,
    'Puntaje Obtenido': r.score,
    'Puntaje Máximo': r.maxScore,
    'Porcentaje (%)': r.percentage,
    'Respuestas Correctas': `${r.correctCount} / ${r.totalQuestions}`,
    'Tiempo Empleado': formatSeconds(r.timeSpentSeconds),
    'Estado': r.percentage >= 70 ? 'Aprobado' : 'Reprobado',
    'Fecha de Finalización': formatDateTime(r.completedAt)
  }));

  const wsResults = XLSX.utils.json_to_sheet(
    resultsRows.length > 0
      ? resultsRows
      : [{ Mensaje: 'No hay evaluaciones registradas para los filtros seleccionados', Filtro: filterSummary }]
  );
  XLSX.utils.book_append_sheet(wb, wsResults, 'Resultados Evaluaciones');

  // Sheet 2: Consolidado por Estudiante (Mejor Nota y Promedio en Física y Química)
  const consolidatedRows = participants.map((p, index) => {
    const pFis = results.filter((r) => r.participantId === p.id && r.subject === 'fisica');
    const pQui = results.filter((r) => r.participantId === p.id && r.subject === 'quimica');

    const bestFis = pFis.length > 0 ? Math.max(...pFis.map((r) => r.percentage)) : null;
    const bestQui = pQui.length > 0 ? Math.max(...pQui.map((r) => r.percentage)) : null;

    return {
      '#': index + 1,
      'Documento / Carnet': p.documento,
      'Estudiante': p.fullName,
      'Sección': p.sectionName || p.sectionCode,
      'Intentos Física (de 3)': p.attemptsCount?.fisica || 0,
      'Mejor Nota Física (%)': bestFis !== null ? `${bestFis}%` : 'Sin evaluar',
      'Intentos Química (de 3)': p.attemptsCount?.quimica || 0,
      'Mejor Nota Química (%)': bestQui !== null ? `${bestQui}%` : 'Sin evaluar',
      'Fecha Registro': formatDateTime(p.createdAt)
    };
  });

  const wsConsolidated = XLSX.utils.json_to_sheet(
    consolidatedRows.length > 0
      ? consolidatedRows
      : [{ Mensaje: 'No hay participantes registrados' }]
  );
  XLSX.utils.book_append_sheet(wb, wsConsolidated, 'Consolidado Estudiantes');

  // Sheet 3: Resumen Estadístico por Sección
  const sectionRows = sections.map((sec) => {
    const secParticipants = participants.filter((p) => p.sectionId === sec.id);
    const secResults = results.filter((r) => r.sectionId === sec.id);
    const fisResults = secResults.filter((r) => r.subject === 'fisica');
    const quiResults = secResults.filter((r) => r.subject === 'quimica');

    const avgFis = fisResults.length
      ? Math.round((fisResults.reduce((acc, r) => acc + r.percentage, 0) / fisResults.length) * 10) / 10
      : 0;
    const avgQui = quiResults.length
      ? Math.round((quiResults.reduce((acc, r) => acc + r.percentage, 0) / quiResults.length) * 10) / 10
      : 0;

    return {
      'Código Sección': sec.code,
      'Nombre Sección': sec.name,
      'Estudiantes Inscritos': secParticipants.length,
      'Evaluaciones Física': fisResults.length,
      'Promedio Física (%)': `${avgFis}%`,
      'Evaluaciones Química': quiResults.length,
      'Promedio Química (%)': `${avgQui}%`,
      'Total Evaluaciones': secResults.length
    };
  });

  const wsSections = XLSX.utils.json_to_sheet(sectionRows);
  XLSX.utils.book_append_sheet(wb, wsSections, 'Estadísticas por Sección');

  const fileName = `Reporte_Evaluaciones_Fisica_Quimica_10mo_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Generates and downloads an institutional PDF (.pdf) report from real evaluation results
 */
export function exportToPDF({ results = [], participants = [], sections = [], filterSummary = 'Todos los registros' }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Institutional Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE OFICIAL DE EVALUACIONES DE FÍSICA Y QUÍMICA - DÉCIMO GRADO', 14, 13);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${formatDateTime(Date.now())}   |   Filtro aplicado: ${filterSummary}`, 14, 21);

  // KPI Summary Strip
  const totalEval = results.length;
  const fisEval = results.filter((r) => r.subject === 'fisica');
  const quiEval = results.filter((r) => r.subject === 'quimica');
  const avgGlobal = totalEval > 0
    ? Math.round((results.reduce((acc, r) => acc + r.percentage, 0) / totalEval) * 10) / 10
    : 0;
  const approvedCount = results.filter((r) => r.percentage >= 70).length;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Participantes Registrados: ${participants.length}   |   Evaluaciones Completadas: ${totalEval} (Física: ${fisEval.length}, Química: ${quiEval.length})   |   Promedio Global: ${avgGlobal}%   |   Aprobación (>=70%): ${approvedCount}`,
    14,
    38
  );

  // Results Table
  const tableBody = results.map((r, idx) => [
    idx + 1,
    r.documento,
    r.fullName,
    r.sectionCode || r.sectionName,
    r.subject === 'fisica' ? 'Física' : 'Química',
    `Intento ${r.attemptNumber}/3`,
    `${r.score} / ${r.maxScore}`,
    `${r.percentage}%`,
    `${r.correctCount}/${r.totalQuestions}`,
    formatSeconds(r.timeSpentSeconds),
    r.percentage >= 70 ? 'Aprobado' : 'Reprobado',
    formatDateTime(r.completedAt)
  ]);

  autoTable(doc, {
    startY: 43,
    head: [[
      '#',
      'Documento',
      'Estudiante',
      'Sección',
      'Asignatura',
      'Intento',
      'Puntaje',
      '%',
      'Aciertos',
      'Tiempo',
      'Estado',
      'Fecha'
    ]],
    body: tableBody.length > 0
      ? tableBody
      : [['—', '—', 'Sin resultados para los filtros seleccionados', '—', '—', '—', '—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const fileName = `Acta_Resultados_Fisica_Quimica_10mo_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}

