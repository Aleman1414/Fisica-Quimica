export const INITIAL_SECTIONS = [
  { id: 'sec-10a', code: '10-A', name: 'Décimo Grado - Sección A', grade: 'Décimo Grado', active: true },
  { id: 'sec-10b', code: '10-B', name: 'Décimo Grado - Sección B', grade: 'Décimo Grado', active: true },
  { id: 'sec-10c', code: '10-C', name: 'Décimo Grado - Sección C', grade: 'Décimo Grado', active: true },
  { id: 'sec-10d', code: '10-D', name: 'Décimo Grado - Sección D', grade: 'Décimo Grado', active: true }
];

export const INITIAL_SETTINGS = {
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

export const INITIAL_QUESTIONS = [
  // ==================== FÍSICA (20 PREGUNTAS - DÉCIMO GRADO) ====================
  {
    id: 'fis-001',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Sistema Internacional y Conversiones',
    difficulty: 'Básico',
    prompt: '¿Cuál de las siguientes opciones contiene únicamente magnitudes fundamentales del Sistema Internacional (SI)?',
    options: [
      { id: 'a', text: 'Longitud, masa, tiempo y temperatura termodinámica' },
      { id: 'b', text: 'Fuerza, velocidad, aceleración y trabajo' },
      { id: 'c', text: 'Masa, peso, densidad y volumen' },
      { id: 'd', text: 'Longitud, energía, potencia y presión' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'El SI define 7 magnitudes fundamentales: longitud (m), masa (kg), tiempo (s), corriente eléctrica (A), temperatura (K), cantidad de sustancia (mol) e intensidad luminosa (cd).'
  },
  {
    id: 'fis-002',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Sistema Internacional y Conversiones',
    difficulty: 'Intermedio',
    prompt: 'Un automóvil viaja por una carretera a una rapidez constante de 72 km/h. ¿Cuál es su rapidez expresada en metros por segundo (m/s)?',
    options: [
      { id: 'a', text: '20 m/s' },
      { id: 'b', text: '25 m/s' },
      { id: 'c', text: '15 m/s' },
      { id: 'd', text: '259.2 m/s' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Para convertir km/h a m/s se divide entre 3.6: 72 / 3.6 = 20 m/s.'
  },
  {
    id: 'fis-003',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Vectores y Escalares',
    difficulty: 'Básico',
    prompt: '¿Cuál es la diferencia fundamental entre una magnitud escalar y una magnitud vectorial?',
    options: [
      { id: 'a', text: 'La magnitud vectorial requiere magnitud, dirección y sentido; la escalar solo número y unidad' },
      { id: 'b', text: 'La magnitud escalar siempre es negativa y la vectorial siempre positiva' },
      { id: 'c', text: 'Las magnitudes escalares no tienen unidades de medida en el SI' },
      { id: 'd', text: 'Las magnitudes vectoriales solo se aplican en reposo' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Un escalar queda completamente definido por su valor numérico y su unidad (ej. masa, tiempo), mientras que un vector requiere módulo, dirección y sentido (ej. desplazamiento, fuerza).'
  },
  {
    id: 'fis-004',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Vectores y Escalares',
    difficulty: 'Intermedio',
    prompt: 'Dos fuerzas perpendiculares entre sí de 6 N (hacia el Este) y 8 N (hacia el Norte) actúan simultáneamente sobre un cuerpo. ¿Cuál es la magnitud de la fuerza resultante?',
    options: [
      { id: 'a', text: '10 N' },
      { id: 'b', text: '14 N' },
      { id: 'c', text: '2 N' },
      { id: 'd', text: '48 N' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Por el teorema de Pitágoras: R = √(6² + 8²) = √(36 + 64) = √100 = 10 N.'
  },
  {
    id: 'fis-005',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Cinemática - MRU',
    difficulty: 'Básico',
    prompt: 'Un ciclista se desplaza en línea recta con velocidad constante de 8 m/s durante 15 segundos. ¿Qué distancia recorre en ese intervalo?',
    options: [
      { id: 'a', text: '120 m' },
      { id: 'b', text: '90 m' },
      { id: 'c', text: '1.875 m' },
      { id: 'd', text: '23 m' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En el MRU, d = v · t = (8 m/s)(15 s) = 120 m.'
  },
  {
    id: 'fis-006',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Cinemática - MRUA',
    difficulty: 'Intermedio',
    prompt: 'Un móvil parte del reposo y acelera uniformemente a razón de 3 m/s² durante 6 segundos. ¿Cuál es su velocidad final al cabo de ese tiempo?',
    options: [
      { id: 'a', text: '18 m/s' },
      { id: 'b', text: '54 m/s' },
      { id: 'c', text: '9 m/s' },
      { id: 'd', text: '2 m/s' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Usando vf = vi + a·t = 0 + (3 m/s²)(6 s) = 18 m/s.'
  },
  {
    id: 'fis-007',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Cinemática - MRUA',
    difficulty: 'Avanzado',
    prompt: 'Un vehículo parte del reposo con aceleración constante de 4 m/s². ¿Qué distancia habrá recorrido transcurridos 5 segundos?',
    options: [
      { id: 'a', text: '50 m' },
      { id: 'b', text: '20 m' },
      { id: 'c', text: '100 m' },
      { id: 'd', text: '40 m' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La distancia en MRUA partiendo del reposo es d = ½·a·t² = 0.5 × 4 × (5)² = 2 × 25 = 50 m.'
  },
  {
    id: 'fis-008',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Caída Libre',
    difficulty: 'Intermedio',
    prompt: 'Se deja caer libremente una esfera desde lo alto de un edificio (sin resistencia del aire, usando g = 9.8 m/s²). ¿Cuál es la magnitud de su velocidad a los 3 segundos de caída?',
    options: [
      { id: 'a', text: '29.4 m/s' },
      { id: 'b', text: '44.1 m/s' },
      { id: 'c', text: '9.8 m/s' },
      { id: 'd', text: '19.6 m/s' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En caída libre desde el reposo, v = g·t = (9.8 m/s²)(3 s) = 29.4 m/s.'
  },
  {
    id: 'fis-009',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Leyes de Newton',
    difficulty: 'Básico',
    prompt: '¿Qué establece la Primera Ley de Newton o Ley de la Inercia?',
    options: [
      { id: 'a', text: 'Todo cuerpo permanece en reposo o en MRU a menos que actúe sobre él una fuerza neta externa no nula' },
      { id: 'b', text: 'La aceleración de un objeto es directamente proporcional a su masa' },
      { id: 'c', text: 'Un objeto solo se mueve si hay una fuerza constante empujándolo en todo instante' },
      { id: 'd', text: 'Las fuerzas de acción y reacción actúan siempre sobre el mismo cuerpo' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La Primera Ley de Newton indica que si la sumatoria de fuerzas externas es cero (ΣF = 0), el cuerpo mantiene su estado de reposo o de velocidad constante en línea recta.'
  },
  {
    id: 'fis-010',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Leyes de Newton',
    difficulty: 'Intermedio',
    prompt: '¿Qué fuerza neta se requiere para producir una aceleración de 3.5 m/s² en un bloque cuya masa es de 12 kg?',
    options: [
      { id: 'a', text: '42 N' },
      { id: 'b', text: '15.5 N' },
      { id: 'c', text: '3.43 N' },
      { id: 'd', text: '84 N' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Por la Segunda Ley de Newton: F = m · a = (12 kg)(3.5 m/s²) = 42 N.'
  },
  {
    id: 'fis-011',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Masa y Peso',
    difficulty: 'Básico',
    prompt: 'Un astronauta tiene una masa de 70 kg en la Tierra (g = 9.8 m/s²). Si viaja a la Luna donde la gravedad es 1.6 m/s², ¿cuál es su masa y su peso en la Luna?',
    options: [
      { id: 'a', text: 'Masa: 70 kg; Peso: 112 N' },
      { id: 'b', text: 'Masa: 11.4 kg; Peso: 686 N' },
      { id: 'c', text: 'Masa: 70 kg; Peso: 686 N' },
      { id: 'd', text: 'Masa: 112 kg; Peso: 70 N' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La masa es una propiedad intrínseca invariable (70 kg). El peso depende de la gravedad local: W = m·g_luna = 70 kg × 1.6 m/s² = 112 N.'
  },
  {
    id: 'fis-012',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Leyes de Newton - Fricción',
    difficulty: 'Avanzado',
    prompt: 'Una caja de 20 kg descansa sobre una superficie horizontal con coeficiente de fricción cinética μk = 0.25. Si se empuja horizontalmente con una fuerza de 89 N (use g = 9.8 m/s²), ¿cuál es la fuerza de fricción cinética que actúa sobre la caja?',
    options: [
      { id: 'a', text: '49 N' },
      { id: 'b', text: '196 N' },
      { id: 'c', text: '40 N' },
      { id: 'd', text: '22.25 N' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La fuerza normal en plano horizontal es N = m·g = 20 × 9.8 = 196 N. La fricción cinética es fk = μk·N = 0.25 × 196 N = 49 N.'
  },
  {
    id: 'fis-013',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Trabajo y Energía',
    difficulty: 'Intermedio',
    prompt: 'Una fuerza horizontal constante de 50 N desplaza un objeto 8 metros en la misma dirección de la fuerza. ¿Cuánto trabajo mecánico realiza dicha fuerza?',
    options: [
      { id: 'a', text: '400 J' },
      { id: 'b', text: '58 J' },
      { id: 'c', text: '6.25 J' },
      { id: 'd', text: '0 J' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'El trabajo mecánico cuando θ = 0° es W = F·d·cos(0°) = (50 N)(8 m)(1) = 400 Joules (J).'
  },
  {
    id: 'fis-014',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Energía Cinética',
    difficulty: 'Intermedio',
    prompt: '¿Cuál es la energía cinética de una pelota de 2 kg que se mueve con una rapidez de 10 m/s?',
    options: [
      { id: 'a', text: '100 J' },
      { id: 'b', text: '20 J' },
      { id: 'c', text: '200 J' },
      { id: 'd', text: '50 J' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La energía cinética se calcula como Ek = ½·m·v² = 0.5 × 2 kg × (10 m/s)² = 1 × 100 = 100 J.'
  },
  {
    id: 'fis-015',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Energía Potencial Gravitatoria',
    difficulty: 'Intermedio',
    prompt: 'Un bloque de 5 kg se eleva hasta una altura de 6 metros respecto al suelo (use g = 9.8 m/s²). ¿Cuál es su energía potencial gravitatoria?',
    options: [
      { id: 'a', text: '294 J' },
      { id: 'b', text: '30 J' },
      { id: 'c', text: '147 J' },
      { id: 'd', text: '49 J' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Ep = m·g·h = (5 kg)(9.8 m/s²)(6 m) = 294 J.'
  },
  {
    id: 'fis-016',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Potencia Mecánica',
    difficulty: 'Intermedio',
    prompt: 'Una grúa realiza un trabajo mecánico de 15,000 J para elevar una carga en un tiempo de 30 segundos. ¿Qué potencia media desarrolló la grúa?',
    options: [
      { id: 'a', text: '500 W' },
      { id: 'b', text: '450,000 W' },
      { id: 'c', text: '50 W' },
      { id: 'd', text: '1,500 W' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La potencia es P = W / t = 15,000 J / 30 s = 500 Watts (W).'
  },
  {
    id: 'fis-017',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Conservación de la Energía',
    difficulty: 'Avanzado',
    prompt: 'En ausencia de fuerzas de fricción, cuando un objeto cae libremente desde cierta altura hacia el suelo, ¿qué ocurre con sus energías potencial (Ep) y cinética (Ek)?',
    options: [
      { id: 'a', text: 'La Ep disminuye, la Ek aumenta en igual proporción y la energía mecánica total permanece constante' },
      { id: 'b', text: 'Tanto la Ep como la Ek disminuyen hasta anularse al llegar al suelo' },
      { id: 'c', text: 'La Ep aumenta mientras la Ek permanece constante durante toda la caída' },
      { id: 'd', text: 'La energía mecánica total se duplica cada segundo de caída' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Por el principio de conservación de la energía mecánica (Em = Ek + Ep = constante), la pérdida de energía potencial se transforma íntegramente en ganancia de energía cinética.'
  },
  {
    id: 'fis-018',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Movimiento Circular Uniforme',
    difficulty: 'Intermedio',
    prompt: 'En el Movimiento Circular Uniforme (MCU), ¿hacia dónde apunta siempre el vector de la aceleración centrípeta?',
    options: [
      { id: 'a', text: 'Hacia el centro de la trayectoria circular' },
      { id: 'b', text: 'Tangente a la trayectoria en el sentido del movimiento' },
      { id: 'c', text: 'Radialmente hacia afuera del círculo' },
      { id: 'd', text: 'En dirección opuesta a la velocidad tangencial' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La aceleración centrípeta cambia la dirección de la velocidad tangencial y apunta siempre radialmente hacia el centro de curvatura.'
  },
  {
    id: 'fis-019',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Termodinámica y Escalas de Temperatura',
    difficulty: 'Básico',
    prompt: 'En un laboratorio la temperatura ambiente es de 27 °C. ¿A cuántos Kelvin (K) equivale esta temperatura en la escala absoluta?',
    options: [
      { id: 'a', text: '300.15 K' },
      { id: 'b', text: '246.15 K' },
      { id: 'c', text: '273.15 K' },
      { id: 'd', text: '80.6 K' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La conversión de Celsius a Kelvin es T(K) = T(°C) + 273.15 = 27 + 273.15 = 300.15 K.'
  },
  {
    id: 'fis-020',
    subject: 'fisica',
    grade: 'Décimo Grado',
    topic: 'Hidrostática y Presión',
    difficulty: 'Intermedio',
    prompt: 'Una fuerza perpendicular de 600 N se aplica uniformemente sobre una superficie de área igual a 0.5 m². ¿Cuál es la presión ejercida sobre la superficie?',
    options: [
      { id: 'a', text: '1,200 Pa' },
      { id: 'b', text: '300 Pa' },
      { id: 'c', text: '600.5 Pa' },
      { id: 'd', text: '120 Pa' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La presión se define como P = F / A = 600 N / 0.5 m² = 1,200 Pascales (Pa).'
  },

  // ==================== QUÍMICA (20 PREGUNTAS - DÉCIMO GRADO) ====================
  {
    id: 'qui-001',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Materia y sus Propiedades',
    difficulty: 'Básico',
    prompt: '¿Cuál de los siguientes procesos corresponde a un cambio químico de la materia?',
    options: [
      { id: 'a', text: 'La combustión de una hoja de papel produciendo cenizas, CO₂ y vapor de agua' },
      { id: 'b', text: 'La fusión de un cubo de hielo al dejarlo a temperatura ambiente' },
      { id: 'c', text: 'La disolución de cloruro de sodio (sal común) en un vaso con agua' },
      { id: 'd', text: 'La trituración de un trozo de mármol hasta obtener polvo fino' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En un cambio químico se altera la composición interna de las sustancias, formándose nuevas especies químicas (como ocurre en la combustión).'
  },
  {
    id: 'qui-002',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Estructura Atómica',
    difficulty: 'Básico',
    prompt: 'Un átomo neutro de Sodio (Na) tiene número atómico Z = 11 y número de masa A = 23. ¿Cuántos protones, electrones y neutrones posee respectivamente?',
    options: [
      { id: 'a', text: '11 protones, 11 electrones y 12 neutrones' },
      { id: 'b', text: '11 protones, 12 electrones y 23 neutrones' },
      { id: 'c', text: '23 protones, 11 electrones y 12 neutrones' },
      { id: 'd', text: '12 protones, 11 electrones y 11 neutrones' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En un átomo neutro: protones = Z = 11, electrones = Z = 11, y neutrones = A - Z = 23 - 11 = 12.'
  },
  {
    id: 'qui-003',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Estructura Atómica - Isótopos',
    difficulty: 'Básico',
    prompt: '¿Qué son los isótopos de un mismo elemento químico (como el Carbono-12 y el Carbono-14)?',
    options: [
      { id: 'a', text: 'Átomos con el mismo número de protones (Z) pero diferente número de neutrones y masa atómica (A)' },
      { id: 'b', text: 'Átomos de distintos elementos que poseen igual número de neutrones' },
      { id: 'c', text: 'Átomos con igual número de masa (A) pero diferente número atómico (Z)' },
      { id: 'd', text: 'Iones que han ganado o perdido protones en su núcleo' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Los isótopos pertenecen al mismo elemento (igual Z, igual cantidad de protones) pero difieren en la cantidad de neutrones en su núcleo.'
  },
  {
    id: 'qui-004',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Configuración Electrónica',
    difficulty: 'Intermedio',
    prompt: '¿Cuál es la configuración electrónica basal correcta para el elemento Oxígeno (Z = 8)?',
    options: [
      { id: 'a', text: '1s² 2s² 2p⁴' },
      { id: 'b', text: '1s² 2s⁴ 2p²' },
      { id: 'c', text: '1s² 2s² 2p⁶' },
      { id: 'd', text: '1s² 2p⁶' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Siguiendo el principio de Aufbau para 8 electrones: 2 en 1s, 2 en 2s y 4 en 2p → 1s² 2s² 2p⁴.'
  },
  {
    id: 'qui-005',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Números Cuánticos',
    difficulty: 'Intermedio',
    prompt: '¿Cuál es el número máximo de electrones que puede alojar el subnivel de energía "d" (donde el número cuántico secundario es l = 2)?',
    options: [
      { id: 'a', text: '10 electrones' },
      { id: 'b', text: '6 electrones' },
      { id: 'c', text: '14 electrones' },
      { id: 'd', text: '2 electrones' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'El subnivel d posee 5 orbitales (-2, -1, 0, +1, +2) y cada orbital admite máximo 2 electrones con espines opuestos: 5 × 2 = 10 electrones.'
  },
  {
    id: 'qui-006',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Tabla Periódica',
    difficulty: 'Básico',
    prompt: 'En la Tabla Periódica moderna, ¿cómo se denominan los elementos situados en el Grupo 18 (VIIIA) como el Helio, Neón y Argón?',
    options: [
      { id: 'a', text: 'Gases nobles' },
      { id: 'b', text: 'Metales alcalinos' },
      { id: 'c', text: 'Halógenos' },
      { id: 'd', text: 'Metales alcalinotérreos' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'El grupo 18 (VIIIA) corresponde a los gases nobles, caracterizados por tener su capa de valencia completa y baja reactividad química.'
  },
  {
    id: 'qui-007',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Propiedades Periódicas',
    difficulty: 'Intermedio',
    prompt: '¿Cómo varía generalmente la electronegatividad en la Tabla Periódica y cuál es el elemento más electronegativo?',
    options: [
      { id: 'a', text: 'Aumenta de izquierda a derecha en un periodo y de abajo hacia arriba en un grupo; el más electronegativo es el Flúor (F)' },
      { id: 'b', text: 'Aumenta de derecha a izquierda y de arriba hacia abajo; el más electronegativo es el Francio (Fr)' },
      { id: 'c', text: 'Permanece constante en todos los periodos; el más electronegativo es el Helio (He)' },
      { id: 'd', text: 'Disminuye hacia la derecha en un periodo; el más electronegativo es el Sodio (Na)' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En la escala de Pauling, la electronegatividad crece hacia arriba y hacia la derecha (excluyendo gases nobles), alcanzando su valor máximo en el Flúor (4.0).'
  },
  {
    id: 'qui-008',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Enlace Químico',
    difficulty: 'Básico',
    prompt: '¿Qué tipo de enlace químico se forma por la transferencia de uno o más electrones de valencia desde un metal (como el Potasio, K) hacia un no metal (como el Cloro, Cl)?',
    options: [
      { id: 'a', text: 'Enlace iónico' },
      { id: 'b', text: 'Enlace covalente apolar' },
      { id: 'c', text: 'Enlace metálico' },
      { id: 'd', text: 'Puente de hidrógeno' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La transferencia de electrones entre un metal de baja energía de ionización y un no metal de alta afinidad electrónica genera iones de carga opuesta unidos por enlace iónico (KCl).'
  },
  {
    id: 'qui-009',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Enlace Químico',
    difficulty: 'Intermedio',
    prompt: 'En la molécula diatómica de Nitrógeno gaseoso (N₂, donde N está en el grupo VA), ¿qué tipo de enlace covalente une a los dos átomos de nitrógeno para cumplir la regla del octeto?',
    options: [
      { id: 'a', text: 'Un enlace covalente triple (comparten tres pares de electrones)' },
      { id: 'b', text: 'Un enlace covalente simple (comparten un solo par de electrones)' },
      { id: 'c', text: 'Un enlace iónico por transferencia de 3 electrones' },
      { id: 'd', text: 'Un enlace covalente doble polar' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Cada átomo de nitrógeno tiene 5 electrones de valencia; al compartir 3 pares de electrones forman un enlace covalente triple (:N≡N:) completando su octeto.'
  },
  {
    id: 'qui-010',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Estados de Oxidación',
    difficulty: 'Intermedio',
    prompt: '¿Cuál es el número (estado) de oxidación del Azufre (S) en la molécula de ácido sulfúrico (H₂SO₄)?',
    options: [
      { id: 'a', text: '+6' },
      { id: 'b', text: '+4' },
      { id: 'c', text: '-2' },
      { id: 'd', text: '+2' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En H₂SO₄ la suma de estados de oxidación es 0: 2(+1) + x + 4(-2) = 0 → 2 + x - 8 = 0 → x = +6.'
  },
  {
    id: 'qui-011',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Nomenclatura Inorgánica',
    difficulty: 'Básico',
    prompt: 'De acuerdo con la nomenclatura Stock e IUPAC, ¿cuál es el nombre correcto del compuesto Fe₂O₃?',
    options: [
      { id: 'a', text: 'Óxido de hierro (III) / Trióxido de dihierro' },
      { id: 'b', text: 'Óxido de hierro (II) / Monóxido de hierro' },
      { id: 'c', text: 'Hidróxido de hierro (III)' },
      { id: 'd', text: 'Peróxido de hierro (VI)' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En Fe₂O₃ el oxígeno actúa con -2 y el hierro con +3, por lo que se nombra Óxido de hierro (III) en Stock o Trióxido de dihierro en sistemática IUPAC.'
  },
  {
    id: 'qui-012',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Nomenclatura Inorgánica',
    difficulty: 'Intermedio',
    prompt: '¿A qué función química inorgánica pertenece el compuesto Ca(OH)₂ y cuál es su nombre común en nomenclatura de hidróxidos?',
    options: [
      { id: 'a', text: 'Función Hidróxido (Base): Hidróxido de calcio' },
      { id: 'b', text: 'Función Ácido Oxácido: Ácido cálcico' },
      { id: 'c', text: 'Función Óxido Básico: Dióxido de calcio' },
      { id: 'd', text: 'Función Sal Haloidea: Hidruro de calcio' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La presencia del grupo funcional hidroxilo (OH⁻) unido a un metal identifica a los hidróxidos o bases: Ca(OH)₂ es el hidróxido de calcio.'
  },
  {
    id: 'qui-013',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Reacciones Químicas y Ley de Lavoisier',
    difficulty: 'Intermedio',
    prompt: 'Al balancear la ecuación química de síntesis del amoníaco: a N₂ + b H₂ → c NH₃, ¿cuáles son los coeficientes estequiométricos mínimos enteros (a, b, c)?',
    options: [
      { id: 'a', text: 'a = 1, b = 3, c = 2' },
      { id: 'b', text: 'a = 2, b = 2, c = 2' },
      { id: 'c', text: 'a = 1, b = 2, c = 3' },
      { id: 'd', text: 'a = 2, b = 3, c = 1' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La ecuación balanceada que cumple la Ley de Conservación de la Masa es: 1 N₂ + 3 H₂ → 2 NH₃ (2 átomos de N y 6 átomos de H a ambos lados).'
  },
  {
    id: 'qui-014',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Tipos de Reacciones Químicas',
    difficulty: 'Básico',
    prompt: '¿Cómo se clasifica la siguiente reacción química: 2 KClO₃(s) → 2 KCl(s) + 3 O₂(g)?',
    options: [
      { id: 'a', text: 'Reacción de descomposición (análisis)' },
      { id: 'b', text: 'Reacción de síntesis o adición' },
      { id: 'c', text: 'Reacción de doble desplazamiento (metátesis)' },
      { id: 'd', text: 'Reacción de neutralización ácido-base' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Un solo reactivo (KClO₃) se divide para formar dos o más productos más simples (KCl y O₂), lo que define una reacción de descomposición.'
  },
  {
    id: 'qui-015',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Estequiometría y Masa Molar',
    difficulty: 'Intermedio',
    prompt: 'Sabiendo que las masas atómicas son H = 1 g/mol, S = 32 g/mol y O = 16 g/mol, ¿cuál es la masa molar del ácido sulfúrico (H₂SO₄)?',
    options: [
      { id: 'a', text: '98 g/mol' },
      { id: 'b', text: '49 g/mol' },
      { id: 'c', text: '82 g/mol' },
      { id: 'd', text: '64 g/mol' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'Masa molar de H₂SO₄ = 2(1) + 1(32) + 4(16) = 2 + 32 + 64 = 98 g/mol.'
  },
  {
    id: 'qui-016',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'El Mol y Número de Avogadro',
    difficulty: 'Intermedio',
    prompt: 'Si la masa molar del agua (H₂O) es de 18 g/mol, ¿cuántos moles de agua hay en una muestra de 90 gramos de H₂O pura?',
    options: [
      { id: 'a', text: '5 moles' },
      { id: 'b', text: '0.2 moles' },
      { id: 'c', text: '18 moles' },
      { id: 'd', text: '1,620 moles' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'El número de moles se calcula como n = masa / Masa Molar = 90 g / (18 g/mol) = 5 moles.'
  },
  {
    id: 'qui-017',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Estequiometría de Reacciones',
    difficulty: 'Avanzado',
    prompt: 'Dada la reacción balanceada: CH₄ + 2 O₂ → CO₂ + 2 H₂O. Si reaccionan completamente 3 moles de metano (CH₄) con suficiente oxígeno, ¿cuántos moles de agua (H₂O) se producen?',
    options: [
      { id: 'a', text: '6 moles de H₂O' },
      { id: 'b', text: '3 moles de H₂O' },
      { id: 'c', text: '1.5 moles de H₂O' },
      { id: 'd', text: '2 moles de H₂O' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La relación molar estequiométrica es 1 mol CH₄ : 2 moles H₂O. Por tanto, 3 moles de CH₄ producen 3 × 2 = 6 moles de H₂O.'
  },
  {
    id: 'qui-018',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Gases Ideales',
    difficulty: 'Intermedio',
    prompt: 'De acuerdo con la Ley de Boyle para un gas ideal a temperatura constante, si la presión de un gas se duplica, ¿qué sucede con su volumen?',
    options: [
      { id: 'a', text: 'Se reduce a la mitad de su volumen inicial' },
      { id: 'b', text: 'Se duplica proporcionalmente' },
      { id: 'c', text: 'Permanece exactamente igual' },
      { id: 'd', text: 'Se cuadruplica' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La Ley de Boyle establece que a T constante, P₁·V₁ = P₂·V₂ (presión y volumen son inversamente proporcionales). Al duplicar P, V se reduce a la mitad.'
  },
  {
    id: 'qui-019',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Soluciones y Concentración',
    difficulty: 'Intermedio',
    prompt: 'Se disuelven 2 moles de soluto en suficiente agua hasta completar un volumen total de 4 litros de solución. ¿Cuál es la molaridad (M) de la solución resultante?',
    options: [
      { id: 'a', text: '0.5 M (mol/L)' },
      { id: 'b', text: '2.0 M (mol/L)' },
      { id: 'c', text: '8.0 M (mol/L)' },
      { id: 'd', text: '4.0 M (mol/L)' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'La molaridad se define como M = moles de soluto / litros de solución = 2 mol / 4 L = 0.5 mol/L (0.5 M).'
  },
  {
    id: 'qui-020',
    subject: 'quimica',
    grade: 'Décimo Grado',
    topic: 'Ácidos, Bases y Escala de pH',
    difficulty: 'Básico',
    prompt: 'Una solución acuosa a 25 °C presenta un valor de pH igual a 3. ¿Cómo se clasifica esta solución?',
    options: [
      { id: 'a', text: 'Solución ácida' },
      { id: 'b', text: 'Solución básica (alcalina)' },
      { id: 'c', text: 'Solución perfectamente neutra' },
      { id: 'd', text: 'Solución sobresaturada apolar' }
    ],
    correctOptionId: 'a',
    points: 10,
    active: true,
    explanation: 'En la escala de pH (0 a 14 a 25 °C), valores menores que 7 corresponden a disoluciones ácidas, 7 es neutro y mayores que 7 son básicas.'
  }
];
