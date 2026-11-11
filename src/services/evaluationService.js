import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import axios from 'axios';
import { auth, db, functions, isFirebaseConfigured } from '../lib/firebase';
import { INITIAL_QUESTIONS, INITIAL_SECTIONS, INITIAL_SETTINGS } from '../data/initialQuestions';

const STORAGE_KEYS = {
  SECTIONS: 'eval10_sections_v1',
  SETTINGS: 'eval10_settings_v1',
  QUESTIONS: 'eval10_questions_v1',
  PARTICIPANTS: 'eval10_participants_v1',
  PARTICIPANTS_BY_DOC: 'eval10_participants_by_doc_v1',
  ACTIVE_ATTEMPTS: 'eval10_active_attempts_v1',
  ATTEMPT_SECRETS: 'eval10_attempt_secrets_v1',
  RESULTS: 'eval10_evaluation_results_v1',
  ADMINS: 'eval10_admins_v1',
  STUDENT_SESSION: 'eval10_student_session_v1',
  ADMIN_SESSION: 'eval10_admin_session_v1'
};

export const apiClient = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Cryptographic Fisher-Yates shuffle for questions and options
 */
export function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    let randomIndex;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      randomIndex = buf[0] % (i + 1);
    } else {
      randomIndex = Math.floor(Math.random() * (i + 1));
    }
    [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
  }
  return arr;
}

/**
 * Normalize identity document / student ID to prevent duplicate registrations
 */
export function normalizeDocumento(rawDoc) {
  if (!rawDoc || typeof rawDoc !== 'string') return '';
  return rawDoc.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function readLocalCollection(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (defaultData !== undefined) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return defaultData !== undefined ? JSON.parse(JSON.stringify(defaultData)) : [];
  }
}

function writeLocalCollection(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

/**
 * Ensure initial seed data exists
 */
export async function ensureInitialized() {
  const sections = readLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  if (!sections || sections.length === 0) {
    writeLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  }
  const questions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  if (!questions || questions.length === 0) {
    writeLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  }
  const settings = readLocalCollection(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  if (!settings || !settings.id) {
    writeLocalCollection(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
}

ensureInitialized();

/**
 * Ensure anonymous student session in Firebase Auth when configured
 */
async function ensureStudentAuth() {
  if (isFirebaseConfigured && auth) {
    try {
      if (!auth.currentUser) {
        const cred = await signInAnonymously(auth);
        return cred.user.uid;
      }
      return auth.currentUser.uid;
    } catch (e) {
      console.warn('Anonymous auth fallback:', e.message);
    }
  }
  let localUid = sessionStorage.getItem('eval10_anon_uid');
  if (!localUid) {
    localUid = 'stu_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('eval10_anon_uid', localUid);
  }
  return localUid;
}

// ============================================================================
// STUDENT SESSION PERSISTENCE
// ============================================================================

export function getSavedStudentSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudentSession(participant) {
  if (!participant) {
    localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
    return;
  }
  const safeParticipant = {
    id: participant.id,
    uid: participant.uid,
    documento: participant.documento,
    documentoDisplay: participant.documentoDisplay || participant.documento,
    fullName: participant.fullName,
    grade: participant.grade || 'Décimo Grado',
    sectionId: participant.sectionId,
    sectionName: participant.sectionName,
    sectionCode: participant.sectionCode,
    email: participant.email || '',
    phone: participant.phone || '',
    attemptsCount: participant.attemptsCount || { fisica: 0, quimica: 0 },
    activeAttemptId: participant.activeAttemptId || { fisica: null, quimica: null },
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt
  };
  localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(safeParticipant));
}

export function clearStudentSession() {
  localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
}

// ============================================================================
// PUBLIC / STUDENT OPERATIONS
// ============================================================================

export async function getActiveSections() {
  await ensureInitialized();
  if (isFirebaseConfigured && db) {
    try {
      await ensureStudentAuth();
      const snap = await getDocs(collection(db, 'sections'));
      if (!snap.empty) {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        writeLocalCollection(STORAGE_KEYS.SECTIONS, list);
        return list.filter((s) => s.active !== false).sort((a, b) => a.code.localeCompare(b.code));
      }
    } catch (err) {
      console.warn('Fallback to local sections cache:', err.message);
    }
  }
  const sections = readLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  return sections.filter((s) => s.active !== false).sort((a, b) => a.code.localeCompare(b.code));
}

export async function getExamSettings() {
  await ensureInitialized();
  if (isFirebaseConfigured && db) {
    try {
      await ensureStudentAuth();
      const snap = await getDoc(doc(db, 'settings', 'exam_config'));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        writeLocalCollection(STORAGE_KEYS.SETTINGS, data);
        return data;
      }
    } catch (err) {
      console.warn('Fallback to local settings cache:', err.message);
    }
  }
  return readLocalCollection(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
}

/**
 * Register a new 10th-grade participant with duplicate identity validation
 */
export async function registerParticipant({ documento, fullName, sectionId, email = '', phone = '' }) {
  const cleanDoc = normalizeDocumento(documento);
  const cleanName = (fullName || '').trim().replace(/\s+/g, ' ');

  if (!cleanDoc || cleanDoc.length < 5 || cleanDoc.length > 20) {
    throw new Error('El número de documento o carnet estudiantil debe contener entre 5 y 20 caracteres alfanuméricos.');
  }
  if (!cleanName || cleanName.length < 5 || !cleanName.includes(' ')) {
    throw new Error('Por favor ingrese su nombre y apellido completos (mínimo 5 caracteres).');
  }
  if (!sectionId) {
    throw new Error('Debe seleccionar su sección de Décimo Grado.');
  }

  const uid = await ensureStudentAuth();
  const sections = await getActiveSections();
  const section = sections.find((s) => s.id === sectionId && s.active !== false);
  if (!section) {
    throw new Error('La sección seleccionada no es válida o está inactiva.');
  }

  // Check Cloud Firestore uniqueness index when connected
  if (isFirebaseConfigured && db) {
    try {
      const remoteDocIndex = await getDoc(doc(db, 'participants_by_doc', cleanDoc));
      if (remoteDocIndex.exists()) {
        throw new Error(
          `El documento/carnet "${cleanDoc}" ya se encuentra registrado en el sistema. Si usted ya se registró anteriormente, utilice la pestaña "Ya estoy registrado" para continuar sus evaluaciones.`
        );
      }
    } catch (err) {
      if (err.message?.includes('ya se encuentra registrado')) throw err;
    }
  }

  const docIndex = readLocalCollection(STORAGE_KEYS.PARTICIPANTS_BY_DOC, {});
  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);

  if (docIndex[cleanDoc] || participants.some((p) => normalizeDocumento(p.documento) === cleanDoc)) {
    throw new Error(
      `El documento/carnet "${cleanDoc}" ya se encuentra registrado en el sistema. Si usted ya se registró anteriormente, utilice la pestaña "Ya estoy registrado" para continuar sus evaluaciones.`
    );
  }

  const now = Date.now();
  const newParticipant = {
    id: 'part_' + cleanDoc.toLowerCase() + '_' + now.toString(36),
    uid,
    documento: cleanDoc,
    documentoDisplay: documento.trim(),
    fullName: cleanName,
    grade: 'Décimo Grado',
    sectionId: section.id,
    sectionName: section.name,
    sectionCode: section.code,
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

  const docIndexEntry = {
    documento: cleanDoc,
    participantId: newParticipant.id,
    uid,
    fullName: cleanName,
    createdAt: now
  };

  if (isFirebaseConfigured && db) {
    try {
      await runTransaction(db, async (tx) => {
        const idxRef = doc(db, 'participants_by_doc', cleanDoc);
        const idxSnap = await tx.get(idxRef);
        if (idxSnap.exists()) {
          throw new Error(
            `El documento/carnet "${cleanDoc}" ya se encuentra registrado en el sistema.`
          );
        }
        tx.set(doc(db, 'participants', newParticipant.id), newParticipant);
        tx.set(idxRef, docIndexEntry);
      });
    } catch (err) {
      if (err.message?.includes('ya se encuentra registrado')) throw err;
      console.warn('Firestore registerParticipant sync notice:', err.message);
    }
  }

  docIndex[cleanDoc] = docIndexEntry;
  participants.push(newParticipant);

  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS_BY_DOC, docIndex);
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
  saveStudentSession(newParticipant);

  return newParticipant;
}

/**
 * Login / Recover session for an already registered student
 */
export async function loginParticipantByDocumento({ documento, sectionId = '' }) {
  const cleanDoc = normalizeDocumento(documento);
  if (!cleanDoc || cleanDoc.length < 5) {
    throw new Error('Ingrese un número de documento o carnet estudiantil válido.');
  }

  const uid = await ensureStudentAuth();

  // Check Cloud Firestore first when connected
  if (isFirebaseConfigured && db) {
    try {
      const idxSnap = await getDoc(doc(db, 'participants_by_doc', cleanDoc));
      if (idxSnap.exists()) {
        const { participantId } = idxSnap.data();
        const partSnap = await getDoc(doc(db, 'participants', participantId));
        if (partSnap.exists()) {
          const remotePart = { id: partSnap.id, ...partSnap.data() };
          if (sectionId && remotePart.sectionId !== sectionId) {
            throw new Error('La sección seleccionada no coincide con la sección registrada para este documento.');
          }
          remotePart.uid = uid;
          remotePart.updatedAt = Date.now();
          await updateDoc(doc(db, 'participants', participantId), {
            uid,
            updatedAt: remotePart.updatedAt
          }).catch(() => {});

          const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
          const localIdx = participants.findIndex((p) => p.id === remotePart.id);
          if (localIdx >= 0) participants[localIdx] = remotePart;
          else participants.push(remotePart);
          writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
          saveStudentSession(remotePart);
          return remotePart;
        }
      }
    } catch (err) {
      if (err.message?.includes('no coincide')) throw err;
      console.warn('Firestore loginParticipant notice:', err.message);
    }
  }

  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = participants.findIndex((p) => normalizeDocumento(p.documento) === cleanDoc);
  if (idx === -1) {
    throw new Error('No se encontró ningún estudiante registrado con ese número de documento. Verifique los datos o regístrese primero.');
  }

  const participant = participants[idx];
  if (sectionId && participant.sectionId !== sectionId) {
    throw new Error('La sección seleccionada no coincide con la sección registrada para este documento.');
  }

  participant.uid = uid;
  participant.updatedAt = Date.now();
  participants[idx] = participant;
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
  saveStudentSession(participant);

  return participant;
}

/**
 * Refresh current student dashboard status (attempts count, active attempts, expired check)
 * Notice: NEVER returns scores or answers to the student!
 */
export async function getStudentDashboardStatus(participantId) {
  await ensureInitialized();
  const settings = await getExamSettings();

  if (isFirebaseConfigured && db) {
    try {
      await ensureStudentAuth();
      const remoteSnap = await getDoc(doc(db, 'participants', participantId));
      if (remoteSnap.exists()) {
        const remoteData = { id: remoteSnap.id, ...remoteSnap.data() };
        const localParts = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
        const lIdx = localParts.findIndex((p) => p.id === participantId);
        if (lIdx >= 0) localParts[lIdx] = remoteData;
        else localParts.push(remoteData);
        writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, localParts);

        for (const subj of ['fisica', 'quimica']) {
          const actId = remoteData.activeAttemptId?.[subj];
          if (actId) {
            const actSnap = await getDoc(doc(db, 'active_attempts', actId));
            if (actSnap.exists()) {
              const localActs = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});
              localActs[actId] = { attemptId: actSnap.id, ...actSnap.data() };
              writeLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, localActs);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Dashboard remote sync notice:', e.message);
    }
  }

  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const pIdx = participants.findIndex((p) => p.id === participantId);

  if (pIdx === -1) {
    const saved = getSavedStudentSession();
    if (!saved || saved.id !== participantId) {
      throw new Error('Sesión de estudiante no encontrada.');
    }
    participants.push(saved);
    writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
  }

  const participant = participants.find((p) => p.id === participantId);
  const activeAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});

  for (const subj of ['fisica', 'quimica']) {
    const activeId = participant.activeAttemptId?.[subj];
    if (activeId && activeAttempts[activeId]) {
      const att = activeAttempts[activeId];
      if (att.status === 'in_progress' && Date.now() >= att.expiresAt) {
        await submitEvaluationAttempt({
          attemptId: activeId,
          selectedAnswers: att.selectedAnswers || {},
          reason: 'timeout_auto_close'
        });
      }
    }
  }

  const updatedParticipants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const freshParticipant = updatedParticipants.find((p) => p.id === participantId) || participant;
  const freshAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});

  saveStudentSession(freshParticipant);

  const buildSubjectSummary = (subject) => {
    const maxAttempts = Number(settings.maxAttemptsPerSubject) || 3;
    const completedCount = Number(freshParticipant.attemptsCount?.[subject] || 0);
    const activeId = freshParticipant.activeAttemptId?.[subject] || null;
    const activeAttempt = activeId && freshAttempts[activeId]?.status === 'in_progress'
      ? {
          attemptId: freshAttempts[activeId].attemptId,
          attemptNumber: freshAttempts[activeId].attemptNumber,
          startedAt: freshAttempts[activeId].startedAt,
          expiresAt: freshAttempts[activeId].expiresAt,
          answeredCount: Object.keys(freshAttempts[activeId].selectedAnswers || {}).length,
          totalQuestions: (freshAttempts[activeId].questions || []).length
        }
      : null;

    const completedHistory = Object.values(freshAttempts)
      .filter((a) => a.participantId === participantId && a.subject === subject && a.status === 'completed')
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map((a) => ({
        attemptId: a.attemptId,
        attemptNumber: a.attemptNumber,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        answeredCount: Object.keys(a.selectedAnswers || {}).length,
        totalQuestions: (a.questions || []).length,
        status: 'Procesado y enviado al comité evaluador'
      }));

    return {
      subject,
      maxAttempts,
      completedCount,
      remainingAttempts: Math.max(0, maxAttempts - completedCount),
      canStartNew: completedCount < maxAttempts && !activeAttempt,
      activeAttempt,
      completedHistory,
      durationMinutes: subject === 'fisica'
        ? (Number(settings.fisicaDurationMinutes) || 25)
        : (Number(settings.quimicaDurationMinutes) || 25),
      questionsPerAttempt: Number(settings.questionsPerAttempt) || 10
    };
  };

  return {
    participant: freshParticipant,
    settings,
    subjects: {
      fisica: buildSubjectSummary('fisica'),
      quimica: buildSubjectSummary('quimica')
    }
  };
}

/**
 * Start a new evaluation or resume an interrupted evaluation for a subject ('fisica' or 'quimica')
 */
export async function startOrResumeEvaluation({ participantId, subject }) {
  if (!participantId || !['fisica', 'quimica'].includes(subject)) {
    throw new Error('Asignatura o participante inválido.');
  }

  await ensureInitialized();
  const uid = await ensureStudentAuth();
  const settings = await getExamSettings();
  const maxAttempts = Number(settings.maxAttemptsPerSubject) || 3;
  const questionsPerAttempt = Number(settings.questionsPerAttempt) || 10;
  const durationMinutes = subject === 'fisica'
    ? (Number(settings.fisicaDurationMinutes) || 25)
    : (Number(settings.quimicaDurationMinutes) || 25);

  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const pIdx = participants.findIndex((p) => p.id === participantId);
  if (pIdx === -1) {
    throw new Error('Participante no encontrado. Inicie sesión nuevamente.');
  }

  const participant = participants[pIdx];
  const activeAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});
  const attemptSecrets = readLocalCollection(STORAGE_KEYS.ATTEMPT_SECRETS, {});

  const existingActiveId = participant.activeAttemptId?.[subject];
  if (existingActiveId && activeAttempts[existingActiveId]) {
    const existingAttempt = activeAttempts[existingActiveId];
    const now = Date.now();
    if (existingAttempt.status === 'in_progress' && now < existingAttempt.expiresAt) {
      return {
        resumed: true,
        attempt: {
          ...existingAttempt,
          serverNow: now
        }
      };
    } else if (existingAttempt.status === 'in_progress' && now >= existingAttempt.expiresAt) {
      await submitEvaluationAttempt({
        attemptId: existingActiveId,
        selectedAnswers: existingAttempt.selectedAnswers || {},
        reason: 'timeout_auto_close'
      });
    }
  }

  const refreshedParticipants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const refreshedIdx = refreshedParticipants.findIndex((p) => p.id === participantId);
  const currentParticipant = refreshedParticipants[refreshedIdx];
  const completedAttempts = Number(currentParticipant.attemptsCount?.[subject] || 0);

  if (completedAttempts >= maxAttempts) {
    throw new Error(
      `Ha alcanzado el límite máximo de ${maxAttempts} intentos permitidos para la asignatura de ${subject === 'fisica' ? 'Física' : 'Química'}.`
    );
  }

  // Load questions from remote questions_public (without correctOptionId) if connected, or local cache
  let subjectQuestions = [];
  if (isFirebaseConfigured && db) {
    try {
      const pubSnap = await getDocs(collection(db, 'questions_public'));
      if (!pubSnap.empty) {
        const pubList = [];
        pubSnap.forEach((d) => pubList.push({ id: d.id, ...d.data() }));
        subjectQuestions = pubList.filter((q) => q.subject === subject && q.active !== false);
      }
    } catch (e) {
      console.warn('questions_public fetch notice:', e.message);
    }
  }

  const allQuestions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  if (subjectQuestions.length === 0) {
    subjectQuestions = allQuestions.filter((q) => q.subject === subject && q.active !== false);
  }

  if (subjectQuestions.length === 0) {
    throw new Error(`No hay preguntas disponibles en el banco activo de ${subject === 'fisica' ? 'Física' : 'Química'}.`);
  }

  const selectedPool = shuffleArray(subjectQuestions).slice(0, Math.min(questionsPerAttempt, subjectQuestions.length));
  const answerKey = {};

  const sanitizedQuestions = selectedPool.map((q, index) => {
    const fullQuestion = allQuestions.find((fq) => fq.id === q.id) || q;
    const shuffledOptions = shuffleArray(q.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text
    }));

    answerKey[q.id] = {
      correctOptionId: fullQuestion.correctOptionId,
      points: Number(q.points) || 10,
      explanation: fullQuestion.explanation || ''
    };

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

  const now = Date.now();
  const durationSeconds = durationMinutes * 60;
  const expiresAt = now + durationSeconds * 1000;
  const nextAttemptNumber = completedAttempts + 1;
  const attemptId = `att_${subject}_${participantId}_${nextAttemptNumber}_${now.toString(36)}`;

  const activeAttemptDoc = {
    attemptId,
    participantId,
    uid: currentParticipant.uid || uid,
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

  attemptSecrets[attemptId] = {
    attemptId,
    participantId,
    subject,
    attemptNumber: nextAttemptNumber,
    answerKey,
    createdAt: now
  };

  const latestActiveAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});
  latestActiveAttempts[attemptId] = activeAttemptDoc;

  currentParticipant.activeAttemptId = {
    ...(currentParticipant.activeAttemptId || {}),
    [subject]: attemptId
  };
  currentParticipant.updatedAt = now;
  refreshedParticipants[refreshedIdx] = currentParticipant;

  writeLocalCollection(STORAGE_KEYS.ATTEMPT_SECRETS, attemptSecrets);
  writeLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, latestActiveAttempts);
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, refreshedParticipants);
  saveStudentSession(currentParticipant);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'active_attempts', attemptId), activeAttemptDoc);
      await updateDoc(doc(db, 'participants', participantId), {
        [`activeAttemptId.${subject}`]: attemptId,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore startOrResumeEvaluation sync notice:', e.message);
    }
  }

  return {
    resumed: false,
    attempt: {
      ...activeAttemptDoc,
      serverNow: now
    }
  };
}

/**
 * Save progress of selected answers during an active evaluation
 */
export async function saveAttemptProgress({ attemptId, selectedAnswers }) {
  if (!attemptId || typeof selectedAnswers !== 'object') {
    throw new Error('Datos de progreso inválidos.');
  }

  const activeAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});
  const attempt = activeAttempts[attemptId];
  if (!attempt) {
    throw new Error('Evaluación activa no encontrada.');
  }
  if (attempt.status !== 'in_progress') {
    throw new Error('Esta evaluación ya fue finalizada y no puede modificarse.');
  }
  const now = Date.now();
  if (now > attempt.expiresAt + 5000) {
    throw new Error('El tiempo de la evaluación ha expirado.');
  }

  attempt.selectedAnswers = { ...selectedAnswers };
  attempt.updatedAt = now;
  activeAttempts[attemptId] = attempt;
  writeLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, activeAttempts);

  if (isFirebaseConfigured && db) {
    updateDoc(doc(db, 'active_attempts', attemptId), {
      selectedAnswers: attempt.selectedAnswers,
      updatedAt: now
    }).catch(() => {});
  }

  return { saved: true, updatedAt: now };
}

/**
 * Submit and automatically grade evaluation, storing results in admin-only evaluation_results
 * and hiding scores/correct answers from the student return payload.
 */
export async function submitEvaluationAttempt({ attemptId, selectedAnswers = {}, reason = 'student_submit' }) {
  if (!attemptId) {
    throw new Error('ID de evaluación requerido.');
  }

  const activeAttempts = readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {});
  const attemptSecrets = readLocalCollection(STORAGE_KEYS.ATTEMPT_SECRETS, {});
  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const results = readLocalCollection(STORAGE_KEYS.RESULTS, []);
  const allQuestions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);

  const attempt = activeAttempts[attemptId];
  if (!attempt) {
    throw new Error('Evaluación no encontrada.');
  }
  if (attempt.status === 'completed') {
    throw new Error('Esta evaluación ya fue finalizada anteriormente y no admite modificaciones.');
  }

  const pIdx = participants.findIndex((p) => p.id === attempt.participantId);
  if (pIdx === -1) {
    throw new Error('Participante no encontrado.');
  }
  const participant = participants[pIdx];

  const now = Date.now();
  if (selectedAnswers && typeof selectedAnswers === 'object' && now <= attempt.expiresAt + 15000) {
    attempt.selectedAnswers = {
      ...(attempt.selectedAnswers || {}),
      ...selectedAnswers
    };
  }

  const secretData = attemptSecrets[attemptId] || { answerKey: {} };
  const answerKey = secretData.answerKey || {};
  const finalSelected = attempt.selectedAnswers || {};
  const questions = attempt.questions || [];

  let correctCount = 0;
  let score = 0;
  let maxScore = 0;

  const answersBreakdown = questions.map((q) => {
    const fallbackQuestion = allQuestions.find((bq) => bq.id === q.id) || {};
    const secretInfo = answerKey[q.id] || {
      correctOptionId: fallbackQuestion.correctOptionId,
      points: q.points || 10,
      explanation: fallbackQuestion.explanation || ''
    };
    const qPoints = Number(q.points) || 10;
    maxScore += qPoints;

    const chosenOptionId = finalSelected[q.id] || null;
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
      correctOptionId: secretInfo.correctOptionId,
      correctOptionText: correctOption ? correctOption.text : '',
      isCorrect,
      pointsEarned: isCorrect ? qPoints : 0,
      maxPoints: qPoints,
      explanation: secretInfo.explanation || ''
    };
  });

  const timeSpentSeconds = Math.max(1, Math.min(attempt.durationSeconds || 1500, Math.round((now - attempt.startedAt) / 1000)));
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;

  const resultRecord = {
    attemptId: attempt.attemptId,
    participantId: participant.id,
    uid: attempt.uid || participant.uid,
    documento: participant.documento,
    fullName: participant.fullName,
    sectionId: participant.sectionId,
    sectionName: participant.sectionName,
    sectionCode: participant.sectionCode,
    grade: participant.grade || 'Décimo Grado',
    subject: attempt.subject,
    attemptNumber: attempt.attemptNumber,
    score,
    maxScore,
    percentage,
    correctCount,
    totalQuestions: questions.length,
    answeredCount: Object.keys(finalSelected).length,
    timeSpentSeconds,
    completionReason: reason,
    answersBreakdown,
    startedAt: attempt.startedAt,
    completedAt: now
  };

  const existingResIdx = results.findIndex((r) => r.attemptId === attempt.attemptId);
  if (existingResIdx >= 0) {
    results[existingResIdx] = resultRecord;
  } else {
    results.push(resultRecord);
  }

  attempt.status = 'completed';
  attempt.completedAt = now;
  attempt.updatedAt = now;
  attempt.completionReason = reason;
  activeAttempts[attemptId] = attempt;

  const prevCount = Number(participant.attemptsCount?.[attempt.subject] || 0);
  const newCount = Math.max(prevCount, attempt.attemptNumber);
  participant.attemptsCount = {
    ...(participant.attemptsCount || {}),
    [attempt.subject]: newCount
  };
  participant.activeAttemptId = {
    ...(participant.activeAttemptId || {}),
    [attempt.subject]: null
  };
  participant.updatedAt = now;
  participants[pIdx] = participant;

  writeLocalCollection(STORAGE_KEYS.RESULTS, results);
  writeLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, activeAttempts);
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
  saveStudentSession(participant);

  if (isFirebaseConfigured && db) {
    try {
      await ensureStudentAuth();
      await setDoc(doc(db, 'evaluation_results', attempt.attemptId), resultRecord);
      await updateDoc(doc(db, 'active_attempts', attempt.attemptId), {
        selectedAnswers: finalSelected,
        status: 'completed',
        completedAt: now,
        updatedAt: now,
        completionReason: reason
      });
      await updateDoc(doc(db, 'participants', participant.id), {
        attemptsCount: participant.attemptsCount,
        activeAttemptId: participant.activeAttemptId,
        updatedAt: now
      });
    } catch (e) {
      console.warn('Firestore submitEvaluationAttempt sync notice:', e.message);
    }
  }

  const maxAttempts = Number((await getExamSettings()).maxAttemptsPerSubject) || 3;

  // Notice: Return payload to student contains NO score, NO percentage, and NO correct answers!
  return {
    success: true,
    message: 'Su evaluación ha sido finalizada y enviada correctamente. Los resultados han sido registrados para revisión exclusiva del comité docente.',
    summary: {
      attemptId: attempt.attemptId,
      subject: attempt.subject,
      attemptNumber: attempt.attemptNumber,
      status: 'completed',
      completedAt: now,
      answeredCount: Object.keys(finalSelected).length,
      totalQuestions: questions.length,
      remainingAttempts: Math.max(0, maxAttempts - newCount)
    }
  };
}

// ============================================================================
// ADMINISTRATOR AUTHENTICATION & AUTHORIZATION
// ============================================================================

const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@ciencias10.edu.hn',
  passwordHash: 'AdminCiencias2026!',
  name: 'Coordinación Académica de Ciencias Naturales',
  role: 'admin'
};

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loginAdmin({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Debe ingresar el correo institucional y la contraseña administrativa.');
  }

  if (isFirebaseConfigured && auth && db) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
      if (adminDoc.exists() && adminDoc.data().role === 'admin') {
        const session = {
          uid: cred.user.uid,
          email: cred.user.email,
          name: adminDoc.data().name || 'Administrador Docente',
          role: 'admin',
          loggedInAt: Date.now()
        };
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        return session;
      }
    } catch (err) {
      console.warn('Firebase Auth admin check notice:', err.message);
    }
  }

  const allowedEmails = (import.meta.env?.VITE_ADMIN_ALLOWED_EMAILS || DEFAULT_ADMIN_CREDENTIALS.email)
    .split(',')
    .map((e) => e.trim().toLowerCase());

  if (
    (cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email || allowedEmails.includes(cleanEmail)) &&
    password === DEFAULT_ADMIN_CREDENTIALS.passwordHash
  ) {
    // Also sign in to Firebase Auth in the background if configured so Firestore rules recognize isAdmin()
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, DEFAULT_ADMIN_CREDENTIALS.email, DEFAULT_ADMIN_CREDENTIALS.passwordHash);
      } catch {
        // ignore
      }
    }
    const session = {
      uid: auth?.currentUser?.uid || 'admin_master_10mo',
      email: cleanEmail,
      name: DEFAULT_ADMIN_CREDENTIALS.name,
      role: 'admin',
      loggedInAt: Date.now()
    };
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
    return session;
  }

  throw new Error('Credenciales administrativas inválidas o cuenta sin privilegios de rol administrador.');
}

export async function logoutAdmin() {
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  }
}

function assertAdminSession() {
  const session = getAdminSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Acceso denegado: Se requiere autorización administrativa activa.');
  }
  return session;
}

// ============================================================================
// ADMIN MODULE: DASHBOARD, PARTICIPANTS, SECTIONS, QUESTIONS & REPORTS
// ============================================================================

export async function adminGetOverviewData() {
  assertAdminSession();
  await ensureInitialized();

  if (isFirebaseConfigured && db && auth) {
    try {
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        await signInWithEmailAndPassword(auth, DEFAULT_ADMIN_CREDENTIALS.email, DEFAULT_ADMIN_CREDENTIALS.passwordHash);
      }
      const [partSnap, resSnap, qSnap, secSnap, setSnap, actSnap] = await Promise.all([
        getDocs(collection(db, 'participants')),
        getDocs(collection(db, 'evaluation_results')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'sections')),
        getDoc(doc(db, 'settings', 'exam_config')),
        getDocs(collection(db, 'active_attempts'))
      ]);

      const remoteParticipants = [];
      partSnap.forEach((d) => remoteParticipants.push({ id: d.id, ...d.data() }));
      if (remoteParticipants.length > 0) writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, remoteParticipants);

      const remoteResults = [];
      resSnap.forEach((d) => remoteResults.push({ attemptId: d.id, ...d.data() }));
      if (remoteResults.length > 0) writeLocalCollection(STORAGE_KEYS.RESULTS, remoteResults);

      const remoteQuestions = [];
      qSnap.forEach((d) => remoteQuestions.push({ id: d.id, ...d.data() }));
      if (remoteQuestions.length > 0) writeLocalCollection(STORAGE_KEYS.QUESTIONS, remoteQuestions);

      const remoteSections = [];
      secSnap.forEach((d) => remoteSections.push({ id: d.id, ...d.data() }));
      if (remoteSections.length > 0) writeLocalCollection(STORAGE_KEYS.SECTIONS, remoteSections);

      if (setSnap.exists()) {
        writeLocalCollection(STORAGE_KEYS.SETTINGS, { id: setSnap.id, ...setSnap.data() });
      }

      const remoteActiveMap = {};
      actSnap.forEach((d) => {
        remoteActiveMap[d.id] = { attemptId: d.id, ...d.data() };
      });
      if (Object.keys(remoteActiveMap).length > 0) {
        writeLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, remoteActiveMap);
      }
    } catch (e) {
      console.warn('Firestore adminGetOverviewData sync notice:', e.message);
    }
  }

  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const results = readLocalCollection(STORAGE_KEYS.RESULTS, []);
  const questions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  const sections = readLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  const settings = readLocalCollection(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  const activeAttempts = Object.values(readLocalCollection(STORAGE_KEYS.ACTIVE_ATTEMPTS, {})).filter(
    (a) => a.status === 'in_progress' && a.expiresAt > Date.now()
  );

  return {
    participants,
    results: results.sort((a, b) => b.completedAt - a.completedAt),
    questions,
    sections,
    settings,
    activeAttempts
  };
}

/**
 * Admin CRUD: Questions (Writes full question to /questions and sanitized question to /questions_public)
 */
export async function adminSaveQuestion(questionData) {
  assertAdminSession();
  const questions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);

  if (!questionData.prompt || questionData.prompt.trim().length < 10) {
    throw new Error('El enunciado de la pregunta debe tener al menos 10 caracteres.');
  }
  if (!['fisica', 'quimica'].includes(questionData.subject)) {
    throw new Error('La asignatura debe ser Física o Química.');
  }
  if (!Array.isArray(questionData.options) || questionData.options.length < 2) {
    throw new Error('La pregunta debe incluir al menos 2 opciones de respuesta.');
  }
  if (questionData.options.some((o) => !o.text || !o.text.trim())) {
    throw new Error('Todas las opciones deben tener texto válido.');
  }
  if (!questionData.options.some((o) => o.id === questionData.correctOptionId)) {
    throw new Error('Debe seleccionar cuál de las opciones es la respuesta correcta.');
  }

  const now = Date.now();
  const id = questionData.id || `${questionData.subject === 'fisica' ? 'fis' : 'qui'}-${now.toString(36)}`;
  const record = {
    id,
    subject: questionData.subject,
    grade: 'Décimo Grado',
    topic: (questionData.topic || 'General').trim(),
    difficulty: questionData.difficulty || 'Intermedio',
    prompt: questionData.prompt.trim(),
    options: questionData.options.map((o) => ({ id: o.id, text: o.text.trim() })),
    correctOptionId: questionData.correctOptionId,
    points: Number(questionData.points) || 10,
    active: questionData.active !== false,
    explanation: (questionData.explanation || '').trim(),
    updatedAt: now
  };

  const publicRecord = {
    id: record.id,
    subject: record.subject,
    grade: record.grade,
    topic: record.topic,
    difficulty: record.difficulty,
    prompt: record.prompt,
    options: record.options,
    points: record.points,
    active: record.active,
    updatedAt: now
  };

  const existingIdx = questions.findIndex((q) => q.id === id);
  if (existingIdx >= 0) {
    questions[existingIdx] = { ...questions[existingIdx], ...record };
  } else {
    questions.unshift({ ...record, createdAt: now });
  }

  writeLocalCollection(STORAGE_KEYS.QUESTIONS, questions);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'questions', id), record, { merge: true });
      await setDoc(doc(db, 'questions_public', id), publicRecord, { merge: true });
    } catch (e) {
      console.warn('Firestore question sync notice:', e.message);
    }
  }

  return record;
}

export async function adminDeleteQuestion(questionId) {
  assertAdminSession();
  const questions = readLocalCollection(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  const filtered = questions.filter((q) => q.id !== questionId);
  writeLocalCollection(STORAGE_KEYS.QUESTIONS, filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      await deleteDoc(doc(db, 'questions_public', questionId));
    } catch (e) {
      console.warn('Firestore deleteQuestion notice:', e.message);
    }
  }
  return true;
}

export async function adminRestoreInitialQuestions() {
  assertAdminSession();
  const current = readLocalCollection(STORAGE_KEYS.QUESTIONS, []);
  const map = new Map(current.map((q) => [q.id, q]));
  for (const initQ of INITIAL_QUESTIONS) {
    map.set(initQ.id, { ...initQ, updatedAt: Date.now() });
  }
  const merged = Array.from(map.values());
  writeLocalCollection(STORAGE_KEYS.QUESTIONS, merged);
  return merged;
}

/**
 * Admin CRUD: Sections
 */
export async function adminSaveSection(sectionData) {
  assertAdminSession();
  const sections = readLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  const code = (sectionData.code || '').trim().toUpperCase();
  const name = (sectionData.name || '').trim();

  if (!code || !name) {
    throw new Error('El código y el nombre de la sección son obligatorios.');
  }

  const id = sectionData.id || `sec-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
  const record = {
    id,
    code,
    name,
    grade: 'Décimo Grado',
    active: sectionData.active !== false,
    updatedAt: Date.now()
  };

  const idx = sections.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sections[idx] = { ...sections[idx], ...record };
  } else {
    sections.push(record);
  }

  writeLocalCollection(STORAGE_KEYS.SECTIONS, sections);
  if (isFirebaseConfigured && db) {
    setDoc(doc(db, 'sections', id), record, { merge: true }).catch(() => {});
  }
  return record;
}

export async function adminDeleteSection(sectionId) {
  assertAdminSession();
  const sections = readLocalCollection(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS);
  const filtered = sections.filter((s) => s.id !== sectionId);
  writeLocalCollection(STORAGE_KEYS.SECTIONS, filtered);
  if (isFirebaseConfigured && db) {
    deleteDoc(doc(db, 'sections', sectionId)).catch(() => {});
  }
  return true;
}

/**
 * Admin: Update Exam Settings
 */
export async function adminSaveSettings(newSettings) {
  assertAdminSession();
  const current = readLocalCollection(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  const updated = {
    ...current,
    ...newSettings,
    maxAttemptsPerSubject: Math.max(1, Math.min(10, Number(newSettings.maxAttemptsPerSubject) || 3)),
    questionsPerAttempt: Math.max(1, Math.min(40, Number(newSettings.questionsPerAttempt) || 10)),
    fisicaDurationMinutes: Math.max(5, Math.min(180, Number(newSettings.fisicaDurationMinutes) || 25)),
    quimicaDurationMinutes: Math.max(5, Math.min(180, Number(newSettings.quimicaDurationMinutes) || 25)),
    updatedAt: Date.now()
  };
  writeLocalCollection(STORAGE_KEYS.SETTINGS, updated);
  if (isFirebaseConfigured && db) {
    setDoc(doc(db, 'settings', 'exam_config'), updated, { merge: true }).catch(() => {});
  }
  return updated;
}

/**
 * Admin: Reset or manage participant attempts
 */
export async function adminResetParticipantAttempts(participantId, subject) {
  assertAdminSession();
  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = participants.findIndex((p) => p.id === participantId);
  if (idx === -1) throw new Error('Participante no encontrado.');

  if (subject === 'all' || subject === 'fisica') {
    participants[idx].attemptsCount.fisica = 0;
    participants[idx].activeAttemptId.fisica = null;
  }
  if (subject === 'all' || subject === 'quimica') {
    participants[idx].attemptsCount.quimica = 0;
    participants[idx].activeAttemptId.quimica = null;
  }
  participants[idx].updatedAt = Date.now();
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, participants);
  if (isFirebaseConfigured && db) {
    updateDoc(doc(db, 'participants', participantId), {
      attemptsCount: participants[idx].attemptsCount,
      activeAttemptId: participants[idx].activeAttemptId,
      updatedAt: participants[idx].updatedAt
    }).catch(() => {});
  }
  return participants[idx];
}

export async function adminDeleteParticipant(participantId) {
  assertAdminSession();
  const participants = readLocalCollection(STORAGE_KEYS.PARTICIPANTS, []);
  const target = participants.find((p) => p.id === participantId);
  const filtered = participants.filter((p) => p.id !== participantId);
  writeLocalCollection(STORAGE_KEYS.PARTICIPANTS, filtered);

  if (target) {
    const docIndex = readLocalCollection(STORAGE_KEYS.PARTICIPANTS_BY_DOC, {});
    const cleanDoc = normalizeDocumento(target.documento);
    delete docIndex[cleanDoc];
    writeLocalCollection(STORAGE_KEYS.PARTICIPANTS_BY_DOC, docIndex);
    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'participants_by_doc', cleanDoc)).catch(() => {});
    }
  }
  if (isFirebaseConfigured && db) {
    deleteDoc(doc(db, 'participants', participantId)).catch(() => {});
  }
  return true;
}
