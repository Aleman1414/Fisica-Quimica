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
  allowRegistration: true,
  hideResultsFromStudents: true
};

module.exports = {
  INITIAL_SECTIONS,
  INITIAL_SETTINGS
};

