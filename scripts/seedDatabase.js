/**
 * Script de Inicialización e Importación del Banco Inicial de Preguntas (Décimo Grado - Física y Química)
 * Uso:
 *   1. Con Emulador de Firestore activo: FIRESTORE_EMULATOR_HOST="localhost:8080" GCLOUD_PROJECT="demo-fisica-quimica" node scripts/seedDatabase.js
 *   2. En Producción con GOOGLE_APPLICATION_CREDENTIALS configurado: node scripts/seedDatabase.js
 *   3. También ejecutable directamente desde el Panel Administrativo (/admin/preguntas -> "Restaurar / Importar Banco Inicial")
 */
import { INITIAL_QUESTIONS, INITIAL_SECTIONS, INITIAL_SETTINGS } from '../src/data/initialQuestions.js';

async function main() {
  console.log('==============================================================');
  console.log(' Inicializador de Base de Datos - Evaluaciones Física y Química');
  console.log('==============================================================');
  console.log(`Secciones configuradas: ${INITIAL_SECTIONS.length}`);
  console.log(`Preguntas de Física (10° Grado): ${INITIAL_QUESTIONS.filter((q) => q.subject === 'fisica').length}`);
  console.log(`Preguntas de Química (10° Grado): ${INITIAL_QUESTIONS.filter((q) => q.subject === 'quimica').length}`);
  console.log('Configuración global:', JSON.stringify(INITIAL_SETTINGS, null, 2));

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('\n[INFO] El banco inicial está listo e integrado en la aplicación.');
    console.log('Para sincronizar con Firestore remoto sin credenciales de Admin SDK locales,');
    console.log('inicie sesión en /admin y presione "Sincronizar Banco Inicial en Firestore".');
    return;
  }

  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

  initializeApp({
    credential: process.env.FIRESTORE_EMULATOR_HOST ? undefined : applicationDefault(),
    projectId: process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'demo-fisica-quimica'
  });

  const db = getFirestore();
  const batch = db.batch();
  const now = Timestamp.now();

  batch.set(db.collection('settings').doc('exam_config'), { ...INITIAL_SETTINGS, updatedAt: now }, { merge: true });

  for (const section of INITIAL_SECTIONS) {
    batch.set(db.collection('sections').doc(section.id), { ...section, createdAt: now, updatedAt: now }, { merge: true });
  }

  for (const question of INITIAL_QUESTIONS) {
    batch.set(db.collection('questions').doc(question.id), { ...question, createdAt: now, updatedAt: now }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Sincronización completada exitosamente en Firestore.');
}

main().catch((err) => {
  console.error('❌ Error al ejecutar seedDatabase:', err);
  process.exit(1);
});
