const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { INITIAL_SECTIONS, INITIAL_SETTINGS } = require('./seedPayload');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

/**
 * Fisher-Yates cryptographic shuffle to randomize questions and options
 */
function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Normalize identity document string to prevent duplicates with spaces/hyphens
 */
function normalizeDocumento(rawDoc) {
  if (!rawDoc || typeof rawDoc !== 'string') return '';
  return rawDoc.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Verify if caller is an authorized Administrator
 */
async function assertAdmin(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debe iniciar sesión como administrador.');
  }
  if (request.auth.token && request.auth.token.admin === true) {
    return true;
  }
  const adminDoc = await db.collection('admins').doc(request.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'No cuenta con privilegios administrativos para esta operación.');
  }
  return true;
}

/**
 * Internal helper to grade an active attempt inside a Firestore transaction
 */
async function gradeAttemptInTransaction(transaction, attemptRef, attemptData, secretData, participantRef, participantData, reason = 'manual_submit') {
  const now = Timestamp.now();
  const startedAtMs = attemptData.startedAt?.toMillis ? attemptData.startedAt.toMillis() : Date.now();
  const completedAtMs = now.toMillis();
  const timeSpentSeconds = Math.max(1, Math.min(attemptData.durationSeconds || 1500, Math.round((completedAtMs - startedAtMs) / 1000)));

  const selectedAnswers = attemptData.selectedAnswers || {};
  const answerKey = secretData?.answerKey || {};
  const questions = attemptData.questions || [];

  let correctCount = 0;
  let score = 0;
  let maxScore = 0;

  const answersBreakdown = questions.map((q) => {
    const qPoints = Number(q.points) || 10;
    maxScore += qPoints;
    const chosenOptionId = selectedAnswers[q.id] || null;
    const secretInfo = answerKey[q.id] || {};
    const isCorrect = Boolean(chosenOptionId && chosenOptionId === secretInfo.correctOptionId);
    if (isCorrect) {
      correctCount += 1;
      score += qPoints;
    }
    const chosenOption = (q.options || []).find((o) => o.id === chosenOptionId);
    const correctOption = (q.options || []).find((o) => o.id === secretInfo.correctOptionId);

    return {
      questionId: q.id,
      prompt: q.prompt,
      topic: q.topic || 'General',
      chosenOptionId,
      chosenOptionText: chosenOption ? chosenOption.text : 'Sin responder',
      correctOptionId: secretInfo.correctOptionId || null,
      correctOptionText: correctOption ? correctOption.text : '',
      isCorrect,
      pointsEarned: isCorrect ? qPoints : 0,
      maxPoints: qPoints,
      explanation: secretInfo.explanation || ''
    };
  });

  const totalQuestions = questions.length || 1;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;

  const resultRef = db.collection('evaluation_results').doc(attemptData.attemptId);
  const resultRecord = {
    attemptId: attemptData.attemptId,
    participantId: attemptData.participantId,
    uid: attemptData.uid,
    documento: participantData.documento,
    fullName: participantData.fullName,
    sectionId: participantData.sectionId,
    sectionName: participantData.sectionName,
    grade: participantData.grade || 'Décimo Grado',
    subject: attemptData.subject,
    attemptNumber: attemptData.attemptNumber,
    score,
    maxScore,
    percentage,
    correctCount,
    totalQuestions,
    answeredCount: Object.keys(selectedAnswers).length,
    timeSpentSeconds,
    completionReason: reason,
    answersBreakdown,
    startedAt: attemptData.startedAt,
    completedAt: now
  };

  // 1. Save graded result in admin-only collection
  transaction.set(resultRef, resultRecord);

  // 2. Mark active_attempt as completed WITHOUT exposing score or correct answers
  transaction.update(attemptRef, {
    status: 'completed',
    completedAt: now,
    updatedAt: now,
    completionReason: reason
  });

  // 3. Update participant attempt counter and clear activeAttemptId
  const currentSubjectAttempts = Number(participantData.attemptsCount?.[attemptData.subject] || 0);
  const newSubjectAttempts = Math.max(currentSubjectAttempts, attemptData.attemptNumber);

  transaction.update(participantRef, {
    [`attemptsCount.${attemptData.subject}`]: newSubjectAttempts,
    [`activeAttemptId.${attemptData.subject}`]: null,
    updatedAt: now
  });

  return {
    attemptId: attemptData.attemptId,
    subject: attemptData.subject,
    attemptNumber: attemptData.attemptNumber,
    status: 'completed',
    completedAt: completedAtMs,
    remainingAttempts: Math.max(0, 3 - newSubjectAttempts)
  };
}

/**
 * 1. Register or Validate Student Participant (Transactional duplicate control)
 */
exports.registerParticipant = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sesión de seguridad no iniciada.');
  }

  const { documento, fullName, sectionId, email, phone } = request.data || {};
  const cleanDoc = normalizeDocumento(documento);
  const cleanName = (fullName || '').trim().replace(/\s+/g, ' ');

  if (!cleanDoc || cleanDoc.length < 5 || cleanDoc.length > 20) {
    throw new HttpsError('invalid-argument', 'El número de identidad / carnet estudiantil debe tener entre 5 y 20 caracteres alfanuméricos.');
  }
  if (!cleanName || cleanName.length < 5) {
    throw new HttpsError('invalid-argument', 'Debe ingresar el nombre completo del estudiante (mínimo 5 caracteres).');
  }
  if (!sectionId) {
    throw new HttpsError('invalid-argument', 'Debe seleccionar una sección válida de Décimo Grado.');
  }

  const docIndexRef = db.collection('participants_by_doc').doc(cleanDoc);
  const sectionRef = db.collection('sections').doc(sectionId);

  return db.runTransaction(async (transaction) => {
    const [docIndexSnap, sectionSnap] = await Promise.all([
      transaction.get(docIndexRef),
      transaction.get(sectionRef)
    ]);

    if (!sectionSnap.exists || !sectionSnap.data().active) {
      throw new HttpsError('not-found', 'La sección seleccionada no existe o no se encuentra activa.');
    }

    if (docIndexSnap.exists) {
      throw new HttpsError(
        'already-exists',
        `El documento/carnet ${cleanDoc} ya se encuentra registrado en el sistema. Si ya se registró anteriormente, utilice la opción "Ingresar con mi Documento".`
      );
    }

    const sectionData = sectionSnap.data();
    const participantRef = db.collection('participants').doc();
    const now = Timestamp.now();

    const participantData = {
      id: participantRef.id,
      uid: request.auth.uid,
      documento: cleanDoc,
      documentoDisplay: documento.trim(),
      fullName: cleanName,
      grade: 'Décimo Grado',
      sectionId: sectionSnap.id,
      sectionName: sectionData.name,
      sectionCode: sectionData.code,
      email: (email || '').trim().toLowerCase(),
      phone: (phone || '').trim(),
      attemptsCount: {
        fisica: 0,
        quimica: 0
      },
      activeAttemptId: {
        fisica: null,
        quimica: null
      },
      createdAt: now,
      updatedAt: now
    };

    transaction.set(participantRef, participantData);
    transaction.set(docIndexRef, {
      documento: cleanDoc,
      participantId: participantRef.id,
      uid: request.auth.uid,
      fullName: cleanName,
      createdAt: now
    });

    return {
      participant: {
        ...participantData,
        createdAt: now.toMillis(),
        updatedAt: now.toMillis()
      }
    };
  });
});

/**
 * 2. Student Login / Session Recovery by Identity Document
 */
exports.loginParticipant = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sesión de seguridad no iniciada.');
  }

  const { documento, sectionId } = request.data || {};
  const cleanDoc = normalizeDocumento(documento);

  if (!cleanDoc) {
    throw new HttpsError('invalid-argument', 'Ingrese su número de documento o carnet estudiantil.');
  }

  const docIndexRef = db.collection('participants_by_doc').doc(cleanDoc);

  return db.runTransaction(async (transaction) => {
    const docIndexSnap = await transaction.get(docIndexRef);
    if (!docIndexSnap.exists) {
      throw new HttpsError('not-found', 'No se encontró ningún estudiante registrado con ese documento. Por favor regístrese primero.');
    }

    const { participantId } = docIndexSnap.data();
    const participantRef = db.collection('participants').doc(participantId);
    const participantSnap = await transaction.get(participantRef);

    if (!participantSnap.exists) {
      throw new HttpsError('not-found', 'El perfil del participante no existe.');
    }

    const participantData = participantSnap.data();
    if (sectionId && participantData.sectionId !== sectionId) {
      throw new HttpsError('permission-denied', 'La sección seleccionada no coincide con el registro del estudiante.');
    }

    const now = Timestamp.now();
    // Rebind current anonymous/student auth uid so the student can recover interrupted attempts
    transaction.update(participantRef, {
      uid: request.auth.uid,
      updatedAt: now
    });
    transaction.update(docIndexRef, {
      uid: request.auth.uid,
      updatedAt: now
    });

    for (const subj of ['fisica', 'quimica']) {
      const activeId = participantData.activeAttemptId?.[subj];
      if (activeId) {
        const activeRef = db.collection('active_attempts').doc(activeId);
        transaction.update(activeRef, { uid: request.auth.uid });
      }
    }

    return {
      participant: {
        ...participantData,
        id: participantSnap.id,
        uid: request.auth.uid,
        createdAt: participantData.createdAt?.toMillis ? participantData.createdAt.toMillis() : Date.now(),
        updatedAt: now.toMillis()
      }
    };
  });
});

/**
 * 3. Start or Resume Evaluation (Enforces 3 attempts max, randomized questions & options, hides answers)
 */
exports.startOrResumeEvaluation = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debe contar con una sesión estudiantil activa.');
  }

  const { participantId, subject } = request.data || {};
  if (!participantId || !['fisica', 'quimica'].includes(subject)) {
    throw new HttpsError('invalid-argument', 'Asignatura o participante inválido.');
  }

  // Fetch settings and active questions for the subject outside transaction
  const [settingsSnap, questionsSnap] = await Promise.all([
    db.collection('settings').doc('exam_config').get(),
    db.collection('questions').where('subject', '==', subject).where('active', '==', true).get()
  ]);

  const settings = settingsSnap.exists ? settingsSnap.data() : INITIAL_SETTINGS;
  const maxAttempts = Number(settings.maxAttemptsPerSubject) || 3;
  const questionsPerAttempt = Number(settings.questionsPerAttempt) || 10;
  const durationMinutes = subject === 'fisica'
    ? (Number(settings.fisicaDurationMinutes) || 25)
    : (Number(settings.quimicaDurationMinutes) || 25);

  const allQuestions = [];
  questionsSnap.forEach((docSnap) => {
    allQuestions.push({ id: docSnap.id, ...docSnap.data() });
  });

  if (allQuestions.length === 0) {
    throw new HttpsError('failed-precondition', `No hay preguntas activas en el banco para ${subject}. Contacte al administrador.`);
  }

  const participantRef = db.collection('participants').doc(participantId);

  return db.runTransaction(async (transaction) => {
    const participantSnap = await transaction.get(participantRef);
    if (!participantSnap.exists) {
      throw new HttpsError('not-found', 'Participante no encontrado.');
    }

    const participantData = participantSnap.data();
    if (participantData.uid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'No tiene autorización para iniciar evaluaciones de otro participante.');
    }

    const activeAttemptId = participantData.activeAttemptId?.[subject] || null;
    let completedAttempts = Number(participantData.attemptsCount?.[subject] || 0);

    // Check if there is an active interrupted attempt for this subject
    if (activeAttemptId) {
      const existingAttemptRef = db.collection('active_attempts').doc(activeAttemptId);
      const existingAttemptSnap = await transaction.get(existingAttemptRef);

      if (existingAttemptSnap.exists) {
        const existingAttempt = existingAttemptSnap.data();
        const nowMs = Date.now();
        const expiresAtMs = existingAttempt.expiresAt?.toMillis ? existingAttempt.expiresAt.toMillis() : 0;

        if (existingAttempt.status === 'in_progress' && nowMs < expiresAtMs) {
          // Recover interrupted evaluation!
          return {
            resumed: true,
            attempt: {
              ...existingAttempt,
              startedAt: existingAttempt.startedAt.toMillis(),
              expiresAt: expiresAtMs,
              serverNow: nowMs
            }
          };
        } else if (existingAttempt.status === 'in_progress' && nowMs >= expiresAtMs) {
          // Expired interrupted attempt: auto-grade it first
          const secretRef = db.collection('attempt_secrets').doc(activeAttemptId);
          const secretSnap = await transaction.get(secretRef);
          await gradeAttemptInTransaction(
            transaction,
            existingAttemptRef,
            existingAttempt,
            secretSnap.exists ? secretSnap.data() : {},
            participantRef,
            participantData,
            'timeout_auto_close'
          );
          completedAttempts = Math.max(completedAttempts, existingAttempt.attemptNumber);
        }
      }
    }

    // Strict check of maximum 3 attempts per subject
    if (completedAttempts >= maxAttempts) {
      throw new HttpsError(
        'resource-exhausted',
        `Ha alcanzado el límite máximo de ${maxAttempts} intentos permitidos para ${subject === 'fisica' ? 'Física' : 'Química'}.`
      );
    }

    // Create new attempt with randomized questions and randomized options
    const nextAttemptNumber = completedAttempts + 1;
    const shuffledPool = shuffleArray(allQuestions).slice(0, Math.min(questionsPerAttempt, allQuestions.length));

    const answerKey = {};
    const sanitizedQuestions = shuffledPool.map((q, index) => {
      const shuffledOptions = shuffleArray(q.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text
      }));

      answerKey[q.id] = {
        correctOptionId: q.correctOptionId,
        points: Number(q.points) || 10,
        explanation: q.explanation || ''
      };

      // Notice: NO correctOptionId or explanation is included in sanitizedQuestions!
      return {
        id: q.id,
        order: index + 1,
        subject: q.subject,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'Intermedio',
        prompt: q.prompt,
        points: Number(q.points) || 10,
        options: shuffledOptions
      };
    });

    const attemptRef = db.collection('active_attempts').doc();
    const secretRef = db.collection('attempt_secrets').doc(attemptRef.id);
    const now = Timestamp.now();
    const durationSeconds = durationMinutes * 60;
    const expiresAt = Timestamp.fromMillis(now.toMillis() + durationSeconds * 1000);

    const activeAttemptDoc = {
      attemptId: attemptRef.id,
      participantId,
      uid: request.auth.uid,
      subject,
      attemptNumber: nextAttemptNumber,
      status: 'in_progress',
      durationSeconds,
      startedAt: now,
      expiresAt,
      updatedAt: now,
      questions: sanitizedQuestions,
      selectedAnswers: {}
    };

    const secretDoc = {
      attemptId: attemptRef.id,
      participantId,
      subject,
      attemptNumber: nextAttemptNumber,
      answerKey,
      createdAt: now
    };

    transaction.set(attemptRef, activeAttemptDoc);
    transaction.set(secretRef, secretDoc);
    transaction.update(participantRef, {
      [`activeAttemptId.${subject}`]: attemptRef.id,
      updatedAt: now
    });

    return {
      resumed: false,
      attempt: {
        ...activeAttemptDoc,
        startedAt: now.toMillis(),
        expiresAt: expiresAt.toMillis(),
        serverNow: now.toMillis()
      }
    };
  });
});

/**
 * 4. Save Student Progress during an active attempt
 */
exports.saveAttemptProgress = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'No autenticado.');
  }

  const { attemptId, selectedAnswers } = request.data || {};
  if (!attemptId || typeof selectedAnswers !== 'object') {
    throw new HttpsError('invalid-argument', 'Datos de progreso inválidos.');
  }

  const attemptRef = db.collection('active_attempts').doc(attemptId);

  return db.runTransaction(async (transaction) => {
    const attemptSnap = await transaction.get(attemptRef);
    if (!attemptSnap.exists) {
      throw new HttpsError('not-found', 'Evaluación no encontrada.');
    }

    const attemptData = attemptSnap.data();
    if (attemptData.uid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'No puede modificar una evaluación de otro estudiante.');
    }
    if (attemptData.status !== 'in_progress') {
      throw new HttpsError('failed-precondition', 'Esta evaluación ya fue finalizada y no puede modificarse.');
    }

    const now = Timestamp.now();
    if (now.toMillis() > attemptData.expiresAt.toMillis() + 5000) {
      throw new HttpsError('deadline-exceeded', 'El tiempo de la evaluación ha expirado.');
    }

    transaction.update(attemptRef, {
      selectedAnswers,
      updatedAt: now
    });

    return {
      saved: true,
      updatedAt: now.toMillis()
    };
  });
});

/**
 * 5. Submit and Auto-Grade Evaluation on the Backend (Hiding Score from Student)
 */
exports.submitEvaluation = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'No autenticado.');
  }

  const { attemptId, selectedAnswers, reason } = request.data || {};
  if (!attemptId) {
    throw new HttpsError('invalid-argument', 'ID de evaluación requerido.');
  }

  const attemptRef = db.collection('active_attempts').doc(attemptId);
  const secretRef = db.collection('attempt_secrets').doc(attemptId);

  return db.runTransaction(async (transaction) => {
    const [attemptSnap, secretSnap] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(secretRef)
    ]);

    if (!attemptSnap.exists) {
      throw new HttpsError('not-found', 'La evaluación no existe.');
    }

    const attemptData = attemptSnap.data();
    if (attemptData.uid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'No tiene permiso para finalizar esta evaluación.');
    }

    if (attemptData.status === 'completed') {
      throw new HttpsError('already-exists', 'Esta evaluación ya fue finalizada anteriormente y no admite modificaciones.');
    }

    const participantRef = db.collection('participants').doc(attemptData.participantId);
    const participantSnap = await transaction.get(participantRef);
    if (!participantSnap.exists) {
      throw new HttpsError('not-found', 'Participante no encontrado.');
    }

    // Merge final selected answers if submitted within grace window (15s network grace)
    const nowMs = Date.now();
    const expiresAtMs = attemptData.expiresAt?.toMillis ? attemptData.expiresAt.toMillis() : nowMs;
    if (selectedAnswers && typeof selectedAnswers === 'object' && nowMs <= expiresAtMs + 15000) {
      attemptData.selectedAnswers = {
        ...(attemptData.selectedAnswers || {}),
        ...selectedAnswers
      };
    }

    const secretData = secretSnap.exists ? secretSnap.data() : { answerKey: {} };
    const summary = await gradeAttemptInTransaction(
      transaction,
      attemptRef,
      attemptData,
      secretData,
      participantRef,
      participantSnap.data(),
      reason || 'student_submit'
    );

    // Return ONLY non-sensitive confirmation to student (NO score, NO correct answers)
    return {
      success: true,
      message: 'Evaluación registrada y procesada exitosamente. Sus respuestas han sido enviadas al comité evaluador.',
      summary
    };
  });
});

/**
 * 6. Admin: Bootstrap / Seed Initial Question Bank and Sections
 */
exports.seedInitialDatabase = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  await assertAdmin(request);
  const { questions = [] } = request.data || {};
  const now = Timestamp.now();
  const batch = db.batch();

  const settingsRef = db.collection('settings').doc('exam_config');
  batch.set(settingsRef, { ...INITIAL_SETTINGS, updatedAt: now }, { merge: true });

  for (const section of INITIAL_SECTIONS) {
    const secRef = db.collection('sections').doc(section.id);
    batch.set(secRef, { ...section, createdAt: now, updatedAt: now }, { merge: true });
  }

  for (const q of questions) {
    const qRef = db.collection('questions').doc(q.id);
    batch.set(qRef, { ...q, createdAt: now, updatedAt: now }, { merge: true });
  }

  await batch.commit();
  return {
    success: true,
    seededSections: INITIAL_SECTIONS.length,
    seededQuestions: questions.length
  };
});
