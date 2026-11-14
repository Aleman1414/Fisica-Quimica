// CommonJS export of the initial Décimo Grado Physics and Chemistry seed data for Cloud Functions
const INITIAL_SECTIONS = [
  { id: 'sec-10-1', code: 'Décimo - 1', name: 'Décimo - 1', grade: 'Décimo Grado', active: true },
  { id: 'sec-10-2', code: 'Décimo - 2', name: 'Décimo - 2', grade: 'Décimo Grado', active: true }
];

const INITIAL_SETTINGS = {
  id: 'exam_config',
  institutionName: 'Instituto de Educación Media - Departamento de Ciencias Naturales',
  academicYear: '2026',
  grade: 'Décimo Grado',
  maxAttemptsPerSubject: 3,
  questionsPerAttempt: 10,
  fisicaDurationMinutes: 25,
  quimicaDurationMinutes: 25,
  examWindowStart: '2026-11-14T13:00:00-06:00',
  examWindowEnd: '2026-11-15T23:59:59-06:00',
  examWindowStartLabel: 'Sábado 14 de noviembre de 2026 • 13:00',
  examWindowEndLabel: 'Domingo 15 de noviembre de 2026 • 23:59',
  examWindowDurationLabel: '34 h 59 min (25 min por intento)',
  allowRegistration: true,
  hideResultsFromStudents: false
};

module.exports = {
  INITIAL_SECTIONS,
  INITIAL_SETTINGS
};

