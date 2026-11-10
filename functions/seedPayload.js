// CommonJS export of the initial Décimo Grado Physics and Chemistry seed data for Cloud Functions
const INITIAL_SECTIONS = [
  { id: 'sec-10a', code: '10-A', name: 'Décimo Grado - Sección A', grade: 'Décimo Grado', active: true },
  { id: 'sec-10b', code: '10-B', name: 'Décimo Grado - Sección B', grade: 'Décimo Grado', active: true },
  { id: 'sec-10c', code: '10-C', name: 'Décimo Grado - Sección C', grade: 'Décimo Grado', active: true },
  { id: 'sec-10d', code: '10-D', name: 'Décimo Grado - Sección D', grade: 'Décimo Grado', active: true }
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
