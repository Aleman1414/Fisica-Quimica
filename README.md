# EvalCiencias 10° — Sistema Integral de Evaluaciones de Física y Química

Plataforma educativa web profesional para la aplicación, control y auditoría de evaluaciones académicas de **Física** y **Química** para estudiantes de **Décimo Grado**, construida con **React + Vite + Tailwind CSS + Firebase (Authentication, Cloud Firestore, Cloud Functions, App Check)** y desplegada en **Vercel**.

---

## 1. Arquitectura Desarrollada

El sistema implementa una arquitectura desacoplada con separación estricta de responsabilidades entre cliente y servidor:

- **Capa de Presentación y Distribución (Vercel + React/Vite)**:
  - SPA servida globalmente mediante la CDN de Vercel con reglas de reescritura en `vercel.json` para todas las rutas internas (`/registro`, `/estudiante`, `/evaluacion/fisica`, `/evaluacion/quimica`, `/admin`, `/admin/participantes`, `/admin/resultados`, `/admin/preguntas`, `/admin/reportes`).
- **Capa de Identidad y Persistencia (Firebase Authentication + Cloud Firestore)**:
  - Autenticación estudiantil y administrativa con verificación de rol en `/admins/{uid}`.
  - Colecciones aisladas por nivel de privilegio (`questions`, `attempt_secrets`, `active_attempts`, `evaluation_results`, `participants`, `participants_by_doc`, `sections`, `settings`).
- **Capa de Procesamiento Sensible (Firebase Cloud Functions)**:
  - Generación aleatoria de preguntas y opciones (algoritmo Fisher-Yates criptográfico).
  - Resguardo exclusivo de claves de respuesta en `attempt_secrets/{attemptId}` (nunca enviadas al navegador).
  - Control transaccional del límite estricto de **3 intentos por asignatura**.
  - Calificación automática en el servidor y ocultamiento de puntajes para el estudiante.

---

## 2. Tecnologías Utilizadas

- **Frontend**: React 19, Vite 6, JavaScript ES6+, React Router DOM v7, Tailwind CSS v4, Lucide React, SweetAlert2, Recharts, Axios.
- **Exportación de Reportes Reales**: SheetJS (`xlsx`) para libros Excel multipestaña (`.xlsx`) y `jsPDF` + `jspdf-autotable` para actas oficiales en PDF (`.pdf`).
- **Backend y Seguridad**: Firebase Authentication, Cloud Firestore, Firebase Cloud Functions v2 (Node.js 20), Firebase App Check (reCAPTCHA v3), Firebase Emulator Suite.
- **Pruebas y Calidad**: Vitest + Testing Library + JSDOM.
- **Despliegue y CI/CD**: Vercel + GitHub Actions (`.github/workflows/deploy.yml`).

---

## 3. Estructura de Carpetas

```text
fisica/
├── .github/workflows/deploy.yml     # Pipeline CI/CD de pruebas y compilación
├── functions/
│   ├── index.js                     # Cloud Functions (registro, intentos, calificación segura)
│   ├── initialData.js               # Exportación de datos semilla para Functions
│   ├── seedPayload.js               # Secciones y configuración inicial
│   └── package.json                 # Dependencias de Firebase Functions (Node 20)
├── scripts/
│   └── seedDatabase.js              # Script CLI de inicialización de Firestore
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Barra de navegación institucional
│   │   └── AdminLayout.jsx          # Guardia de seguridad y layout del Panel Docente
│   ├── data/
│   │   └── initialQuestions.js      # Banco oficial de 40 preguntas (20 Física, 20 Química)
│   ├── lib/
│   │   └── firebase.js              # Inicialización de Firebase SDK, App Check y Emuladores
│   ├── pages/
│   │   ├── HomePage.jsx             # Ruta /
│   │   ├── RegistroPage.jsx         # Ruta /registro (Registro y recuperación por documento)
│   │   ├── EstudianteDashboard.jsx  # Ruta /estudiante (Selección Física/Química y control 3 intentos)
│   │   ├── EvaluacionPage.jsx       # Rutas /evaluacion/fisica y /evaluacion/quimica
│   │   └── admin/
│   │       ├── AdminOverviewPage.jsx      # Ruta /admin
│   │       ├── AdminParticipantesPage.jsx # Ruta /admin/participantes
│   │       ├── AdminResultadosPage.jsx    # Ruta /admin/resultados
│   │       ├── AdminPreguntasPage.jsx     # Ruta /admin/preguntas
│   │       └── AdminReportesPage.jsx      # Ruta /admin/reportes
│   ├── services/
│   │   └── evaluationService.js     # Capa de servicios transaccionales y conexión Firebase
│   ├── tests/
│   │   ├── setup.js                 # Configuración del entorno de pruebas
│   │   └── evaluationSystem.test.js # Suite de pruebas funcionales y de seguridad
│   ├── utils/
│   │   └── reportExporter.js        # Generador real de reportes Excel (.xlsx) y PDF (.pdf)
│   ├── App.jsx                      # Enrutador principal React Router DOM
│   ├── main.jsx                     # Punto de entrada React
│   └── index.css                    # Estilos globales Tailwind CSS
├── .env.example                     # Plantilla de variables de entorno
├── .firebaserc.example              # Plantilla de vinculación de proyecto Firebase
├── firebase.json                    # Configuración de Firestore, Functions, Auth y Emuladores
├── firestore.indexes.json           # Índices compuestos de Cloud Firestore
├── firestore.rules                  # Reglas de seguridad endurecidas de Firestore
├── vercel.json                      # Configuración de build y rewrites SPA para Vercel
├── vite.config.js                   # Configuración de Vite y Vitest
└── package.json                     # Scripts y dependencias del proyecto
```

---

## 4. Instrucciones de Administración y Uso

### Credenciales Docentes Iniciales (`/admin`)
- **Correo institucional**: `admin@ciencias10.edu.hn`
- **Contraseña**: `AdminCiencias2026!`

### Agregar Nuevas Preguntas (`/admin/preguntas`)
1. Ingrese a `/admin/preguntas`.
2. Haga clic en **Nueva Pregunta Física** o **Nueva Pregunta Química**.
3. Complete el tema curricular, dificultad (`Básico`, `Intermedio`, `Avanzado`), puntaje, enunciado, las 4 opciones y seleccione el radio de la respuesta correcta.
4. Presione **Guardar Pregunta**.

### Consultar y Exportar Resultados (`/admin/resultados` y `/admin/reportes`)
1. En `/admin/resultados`, filtre por asignatura, sección (`10-A` a `10-D`), número de intento (`1`, `2`, `3`) o estado (`Aprobado`/`Reprobado`).
2. Haga clic en **Desglose** en cualquier fila para auditar pregunta por pregunta las respuestas del estudiante.
3. Haga clic en **Exportar Excel (.xlsx)** o **Exportar Acta PDF (.pdf)** para descargar los reportes generados con los datos reales.
