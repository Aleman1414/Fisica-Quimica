import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensureInitialized,
  getActiveSections,
  registerParticipant,
  loginParticipantByDocumento,
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

  it('1. Inicializa el banco oficial de 40 preguntas (20 Física y 20 Química) y 2 secciones de Décimo Grado (Décimo - 1 y Décimo - 2)', async () => {
    const sections = await getActiveSections();
    expect(sections.length).toBe(2);
    expect(sections.map((s) => s.code)).toEqual(['Décimo - 1', 'Décimo - 2']);
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

  it('4. Permite guardar respuestas, recuperar evaluaciones interrumpidas y ocultar el puntaje al finalizar', async () => {
    const student = await registerParticipant({
      documento: '0801-2010-00333',
      fullName: 'Diego Alejandro Paz',
      sectionId: 'sec-10-1'
    });

    const started = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });

    const firstQuestionId = started.attempt.questions[0].id;
    await saveAttemptProgress({
      attemptId: started.attempt.attemptId,
      selectedAnswers: { [firstQuestionId]: 'a' }
    });

    const resumed = await startOrResumeEvaluation({
      participantId: student.id,
      subject: 'quimica'
    });

    expect(resumed.resumed).toBe(true);
    expect(resumed.attempt.attemptId).toBe(started.attempt.attemptId);
    expect(resumed.attempt.selectedAnswers[firstQuestionId]).toBe('a');

    const submitRes = await submitEvaluationAttempt({
      attemptId: started.attempt.attemptId,
      selectedAnswers: { [firstQuestionId]: 'a' }
    });

    expect(submitRes.success).toBe(true);
    expect(submitRes.summary.score).toBeUndefined();
    expect(submitRes.summary.percentage).toBeUndefined();
    expect(submitRes.summary.remainingAttempts).toBe(2);

    await expect(
      saveAttemptProgress({
        attemptId: started.attempt.attemptId,
        selectedAnswers: { [firstQuestionId]: 'b' }
      })
    ).rejects.toThrow(/finalizada/i);
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
    expect(overview.questions.length).toBe(40);

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
    expect(updatedOverview.questions.length).toBe(41);
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
