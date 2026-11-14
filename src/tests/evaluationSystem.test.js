import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensureInitialized,
  getActiveSections,
  getExamSettings,
  registerParticipant,
  loginParticipantByDocumento,
  getStudentDashboardStatus,
  startOrResumeEvaluation,
  saveAttemptProgress,
  submitEvaluationAttempt,
  loginAdmin,
  logoutAdmin,
  registerTeacherAccount,
  adminGetTeachers,
  adminGetOverviewData,
  adminSaveQuestion
} from '../services/evaluationService';

describe('Sistema Integral de Evaluaciones de Física y Química (10° Grado)', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await ensureInitialized();
  });

  it('1. Inicializa el banco oficial de 33 preguntas (13 Física sin temas de fuerza y 20 Química), horario oficial y 2 secciones de Décimo Grado', async () => {
    const sections = await getActiveSections();
    expect(sections.length).toBe(2);
    expect(sections.map((s) => s.code)).toEqual(['Décimo - 1', 'Décimo - 2']);

    const settings = await getExamSettings();
    expect(settings.examWindowStart).toBe('2026-11-14T13:00:00-06:00');
    expect(settings.examWindowEnd).toBe('2026-11-15T23:59:59-06:00');
  });

  it('2. Registra participantes y previene duplicados por número de documento', async () => {
    const p1 = await registerParticipant({
      documento: '0801-2010-00111',
      fullName: 'Carlos Eduardo Mejía',
      sectionId: 'sec-10-1',
      email: 'carlos@colegio.edu'
    });
    expect(p1.documento).toBe('0801201000111');
    expect(p1.attemptsCount).toEqual({ fisica: 0, quimica: 0 });

    await expect(
      registerParticipant({
        documento: '0801201000111',
        fullName: 'Otro Estudiante',
        sectionId: 'sec-10-2'
      })
    ).rejects.toThrow(/ya se encuentra registrado/i);

    const recovered = await loginParticipantByDocumento({ documento: '0801-2010-00111' });
    expect(recovered.id).toBe(p1.id);
  });

  it('3. Genera evaluaciones con preguntas y opciones aleatorias SIN exponer respuestas correctas al estudiante', async () => {
    const student = await registerParticipant({
      documento: '0801-2010-00222',
      fullName: 'Ana Sofía Valladares',
      sectionId: 'sec-10-2'
    });

    const evalRes = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'fisica'
    });

    expect(evalRes.resumed).toBe(false);
    expect(evalRes.attempt.questions.length).toBe(10);

    evalRes.attempt.questions.forEach((q) => {
      expect(q.correctOptionId).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.options.length).toBe(4);
    });
  });

  it('4. Permite guardar respuestas, recuperar evaluaciones interrumpidas y calcular la Calificación Final como la más alta de los 3 intentos', async () => {
    const student = await registerParticipant({
      documento: '0801-2010-00333',
      fullName: 'Diego Alejandro Paz',
      sectionId: 'sec-10-1'
    });

    // Intento #1: responder todas con 'a' (correctOptionId es 'a' en las preguntas iniciales)
    const started1 = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });

    const firstQuestionId = started1.attempt.questions[0].id;
    await saveAttemptProgress({
      attemptId: started1.attempt.attemptId,
      selectedAnswers: { [firstQuestionId]: 'a' }
    });

    const resumed = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });

    expect(resumed.resumed).toBe(true);
    expect(resumed.attempt.attemptId).toBe(started1.attempt.attemptId);
    expect(resumed.attempt.selectedAnswers[firstQuestionId]).toBe('a');

    // Responder 8 preguntas correctas ('a') en el Intento #1 -> 80%
    const answersAttempt1 = {};
    started1.attempt.questions.slice(0, 8).forEach((q) => {
      answersAttempt1[q.id] = 'a';
    });

    const submitRes1 = await submitEvaluationAttempt({
      attemptId: started1.attempt.attemptId,
      selectedAnswers: answersAttempt1
    });

    expect(submitRes1.success).toBe(true);
    expect(submitRes1.summary.score).toBe(80);
    expect(submitRes1.summary.percentage).toBe(80);
    expect(submitRes1.summary.finalPercentage).toBe(80);
    expect(submitRes1.summary.startedAt).toBeDefined();
    expect(submitRes1.summary.expiresAt).toBeDefined();
    expect(submitRes1.summary.durationSeconds).toBe(1500);
    expect(submitRes1.summary.remainingAttempts).toBe(2);

    await expect(
      saveAttemptProgress({
        attemptId: started1.attempt.attemptId,
        selectedAnswers: { [firstQuestionId]: 'b' }
      })
    ).rejects.toThrow(/finalizada/i);

    // Intento #2: obtener una nota menor (30%) y verificar que la Calificación Final sigue siendo 80% (la más alta)
    const started2 = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });
    const answersAttempt2 = {};
    started2.attempt.questions.slice(0, 3).forEach((q) => {
      answersAttempt2[q.id] = 'a';
    });
    const submitRes2 = await submitEvaluationAttempt({
      attemptId: started2.attempt.attemptId,
      selectedAnswers: answersAttempt2
    });
    expect(submitRes2.summary.percentage).toBe(30);
    expect(submitRes2.summary.finalPercentage).toBe(80);
    expect(submitRes2.summary.bestAttemptNumber).toBe(1);

    const dashboard = await getStudentDashboardStatus(student.id);
    expect(dashboard.subjects.quimica.finalGrade.percentage).toBe(80);
    expect(dashboard.subjects.quimica.finalGrade.attemptNumber).toBe(1);
  });

  it('5. Controla estrictamente el límite máximo de 3 intentos por asignatura', async () => {
    const student = await registerParticipant({
      documento: '0801-2010-00444',
      fullName: 'Lucía Gabriela Flores',
      sectionId: 'sec-10-2'
    });

    for (let i = 1; i <= 3; i++) {
      const start = await startOrResumeEvaluation({
        participantId: student.id,
        subject: 'fisica'
      });
      expect(start.attempt.attemptNumber).toBe(i);
      await submitEvaluationAttempt({
        attemptId: start.attempt.attemptId,
        selectedAnswers: {}
      });
    }

    await expect(
      startOrResumeEvaluation({
        participantId: student.id,
        subject: 'fisica'
      })
    ).rejects.toThrow(/límite máximo de 3 intentos/i);

    const quimicaAttempt = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });
    expect(quimicaAttempt.attempt.attemptNumber).toBe(1);
  });

  it('6. Protege el panel administrativo y permite consultar calificaciones reales y gestionar preguntas', async () => {
    await logoutAdmin();
    await expect(adminGetOverviewData()).rejects.toThrow(/Acceso denegado/i);

    const adminSession = await loginAdmin({
      email: 'admin@ciencias10.edu.hn',
      password: 'AdminCiencias2026!'
    });
    expect(adminSession.role).toBe('admin');

    const overview = await adminGetOverviewData();
    expect(overview.questions.length).toBe(33);
    const forceTopics = overview.questions.filter(
      (q) => q.subject === 'fisica' && /fuerza|newton|fricci|peso/i.test(`${q.topic} ${q.prompt}`)
    );
    expect(forceTopics.length).toBe(0);

    const newQ = await adminSaveQuestion({
      subject: 'fisica',
      topic: 'Óptica Geométrica',
      difficulty: 'Intermedio',
      prompt: '¿Cuál es la rapidez aproximada de la luz en el vacío?',
      points: 10,
      correctOptionId: 'a',
      options: [
        { id: 'a', text: '300,000 km/s' },
        { id: 'b', text: '340 m/s' },
        { id: 'c', text: '1,500 m/s' },
        { id: 'd', text: '30,000 km/h' }
      ],
      explanation: 'c ≈ 3 × 10^8 m/s = 300,000 km/s'
    });

    expect(newQ.id).toBeDefined();
    const updatedOverview = await adminGetOverviewData();
    expect(updatedOverview.questions.length).toBe(34);
  });

  it('7. Permite registrar múltiples accesos docentes con código institucional y gestionarlos desde /admin/docentes', async () => {
    await logoutAdmin();

    // Rechazar autoregistro con código institucional incorrecto
    await expect(
      registerTeacherAccount({
        name: 'Prof. Intruso',
        email: 'intruso@colegio.edu',
        password: 'Password123!',
        specialty: 'Física',
        registrationCode: 'CODIGO-FALSO',
        autoLogin: true
      })
    ).rejects.toThrow(/Código de Autorización Docente es inválido/i);

    // Permitir autoregistro directo sin exponer credenciales de coordinación principal
    const session = await registerTeacherAccount({
      name: 'Lic. Roberto Mendoza',
      email: 'roberto.mendoza@ciencias10.edu.hn',
      password: 'FisicaDocente2026!',
      specialty: 'Física',
      autoLogin: true
    });
    expect(session.email).toBe('roberto.mendoza@ciencias10.edu.hn');
    expect(session.role).toBe('admin');

    // Desde sesión activa, registrar otro docente adicional sin perder sesión
    await registerTeacherAccount({
      name: 'MSc. Claudia Reyes',
      email: 'claudia.reyes@ciencias10.edu.hn',
      password: 'QuimicaDocente2026!',
      specialty: 'Química',
      autoLogin: false
    });

    const allTeachers = await adminGetTeachers();
    expect(allTeachers.length).toBe(2);
    expect(allTeachers.some((t) => t.email === 'admin@ciencias10.edu.hn')).toBe(false);

    // Verificar que el nuevo docente puede iniciar sesión
    await logoutAdmin();
    const claudiaSession = await loginAdmin({
      email: 'claudia.reyes@ciencias10.edu.hn',
      password: 'QuimicaDocente2026!'
    });
    expect(claudiaSession.name).toBe('MSc. Claudia Reyes');
  });
});
