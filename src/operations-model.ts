import { z } from 'zod';

export const Policy = z.object({
  id: z.string(),
  kind: z.enum(['privacidad', 'compra', 'devoluciones']),
  version: z.number().int().positive(),
  title: z.string().min(3).max(100),
  body: z.string().min(30).max(12000),
  status: z.enum(['borrador', 'aprobada']),
  approvedBy: z.string().max(100),
  updatedAt: z.iso.datetime(),
});
export const Consent = z.object({
  id: z.string(),
  userId: z.string(),
  purpose: z.enum(['registro', 'compra', 'diagnostico']),
  policyIds: z.array(z.string()),
  date: z.iso.datetime(),
  demo: z.boolean(),
});
export const SupportTicket = z.object({
  id: z.string(),
  reference: z.string(),
  userId: z.string(),
  ownerId: z.string(),
  kind: z.enum(['soporte', 'reclamo']),
  category: z.enum(['acceso', 'pago', 'contenido', 'mentoria', 'otro']),
  subject: z.string().min(3).max(120),
  request: z.string().max(2000),
  status: z.enum(['abierta', 'en_revision', 'respondida', 'cerrada']),
  createdAt: z.iso.datetime(),
  messages: z.array(
    z.object({
      id: z.string(),
      authorId: z.string(),
      text: z.string().min(2).max(4000),
      date: z.iso.datetime(),
    }),
  ),
  events: z.array(z.object({ authorId: z.string(), text: z.string(), date: z.iso.datetime() })),
});
export const PracticeCase = z.object({
  id: z.string(),
  title: z.string().min(3).max(120),
  intro: z.string().min(20).max(2000),
  moduleId: z.string(),
  published: z.boolean(),
  version: z.number().int().positive(),
  steps: z
    .array(
      z.object({
        question: z.string().min(10).max(1000),
        options: z
          .array(
            z.object({
              text: z.string().min(2).max(500),
              feedback: z.string().min(10).max(1000),
              points: z.number().int().min(0).max(2),
            }),
          )
          .length(3),
      }),
    )
    .min(1)
    .max(5),
});
export const CaseAttempt = z.object({
  id: z.string(),
  userId: z.string(),
  purchaseId: z.string(),
  caseId: z.string(),
  version: z.number(),
  title: z.string(),
  answers: z.array(z.number().int().min(0).max(2)),
  score: z.number(),
  maximum: z.number(),
  feedback: z.array(z.string()),
  reflection: z.string().min(10).max(2000),
  date: z.iso.datetime(),
});
export const QuizAttempt = z.object({
  id: z.string(),
  userId: z.string(),
  purchaseId: z.string(),
  lessonId: z.string(),
  question: z.string(),
  answer: z.string(),
  correct: z.boolean(),
  date: z.iso.datetime(),
});
export const DeliverySettings = z.object({
  domain: z.string().max(200),
  businessOwner: z.string().max(100),
  academicOwner: z.string().max(100),
  supportOwner: z.string().max(100),
  supportHours: z.string().max(300),
  trainingAt: z.string().max(100),
  trainingNotes: z.string().max(3000),
});
export const defaultDelivery = {
  domain: '',
  businessOwner: '',
  academicOwner: '',
  supportOwner: '',
  supportHours: '',
  trainingAt: '',
  trainingNotes: '',
};

export function initialPolicies() {
  return (['privacidad', 'compra', 'devoluciones'] as const).map((kind) => ({
    id: `demo-${kind}-1`,
    kind,
    version: 1,
    title: {
      privacidad: 'Privacidad y uso de datos',
      compra: 'Condiciones del programa',
      devoluciones: 'Devoluciones y atención',
    }[kind],
    body: {
      privacidad:
        'Borrador de demostración. Los datos de esta versión se guardan en tu navegador. Puedes exportarlos y restablecer la muestra desde Datos locales. Utiliza datos ficticios. Antes de operar, Mentorinc debe aprobar responsable, finalidades, conservación, derechos y canales de atención.',
      compra:
        'Borrador de demostración. Los precios, vigencia y cupos son ejemplos. No se realiza ningún cobro. El acceso local requiere un pago simulado confirmado y aprobación del equipo. Mentorinc debe aprobar oferta, alcance académico, duración y reglas de inscripción antes de la venta real.',
      devoluciones:
        'Borrador de demostración. Puedes abrir una solicitud local de apoyo o un reclamo y descargar su constancia de prueba. No se envía a una entidad ni sustituye un canal oficial. Mentorinc debe aprobar las condiciones de devolución, responsable y plazos antes de operar.',
    }[kind],
    status: 'borrador' as const,
    approvedBy: '',
    updatedAt: new Date().toISOString(),
  }));
}

export function initialCases() {
  return [
    {
      id: 'escucha',
      moduleId: 'com',
      title: 'Primero, entender',
      intro:
        'Una emprendedora pide una propuesta de formación. Tiene poco tiempo y todavía no ha explicado qué necesita su equipo.',
      situations: [
        [
          '¿Cómo abres la conversación?',
          'Pregunto qué quiere cambiar y escucho un ejemplo.',
          'Una pregunta abierta permite comprender el contexto antes de ofrecer.',
          'Presento todos los módulos de inmediato.',
          'Una lista de módulos todavía no responde al problema que necesita resolver.',
        ],
        [
          'Dice que su equipo no da seguimiento. ¿Qué haces?',
          'Pido un ejemplo reciente y cómo hacen seguimiento hoy.',
          'Un ejemplo permite separar los hechos de una impresión general.',
          'Asumo que necesitan aprender a cerrar.',
          'Aún no sabemos dónde se interrumpe el proceso.',
        ],
        [
          '¿Cómo cierras esta primera conversación?',
          'Resumo lo entendido y acuerdo un siguiente paso.',
          'Confirmar lo entendido y acordar una acción concreta ordena la relación.',
          'Envío una propuesta genérica sin confirmar.',
          'La propuesta debería responder a necesidades que ambos reconocen.',
        ],
      ],
    },
    {
      id: 'valor',
      moduleId: 'pro',
      title: 'Del producto al valor',
      intro:
        'Un cliente compara tu servicio con una alternativa más económica. Debes conectar las características con una necesidad concreta.',
      situations: [
        [
          '¿Qué necesitas conocer primero?',
          'Los criterios que usa para comparar las propuestas.',
          'Los criterios del cliente permiten explicar valor sin inventar ventajas.',
          'Qué descuento basta para cerrar.',
          'Reducir el precio antes de comprender los criterios puede ocultar la necesidad.',
        ],
        [
          '¿Cómo explicas una característica?',
          'La relaciono con un resultado relevante y comprobable.',
          'Una característica se vuelve útil cuando responde a una necesidad real.',
          'Prometo que duplicará sus ventas.',
          'No prometas resultados que no puedes demostrar.',
        ],
        [
          'El cliente pide una garantía no disponible. ¿Qué respondes?',
          'Aclaro los límites y propongo revisar evidencia real.',
          'La transparencia permite decidir con expectativas razonables.',
          'Acepto la garantía para ganar la venta.',
          'Un compromiso que no puedes cumplir perjudica la confianza.',
        ],
      ],
    },
    {
      id: 'acuerdo',
      moduleId: 'neg',
      title: 'Un acuerdo posible',
      intro:
        'La propuesta interesa, pero el cliente pide menor precio y un plazo más corto. Busca un acuerdo que ambas partes puedan cumplir.',
      situations: [
        [
          '¿Cómo exploras la objeción?',
          'Pregunto cuál de las condiciones es prioritaria y por qué.',
          'Comprender intereses ayuda a proponer alternativas viables.',
          'Respondo que es la última oferta.',
          'Cerrar la conversación impide conocer la necesidad detrás de la objeción.',
        ],
        [
          '¿Cómo propones una alternativa?',
          'Cambio alcance o calendario explicando cada condición.',
          'Intercambiar condiciones de forma explícita permite evaluar el acuerdo.',
          'Bajo precio y plazo sin revisar capacidad.',
          'Antes de prometer, verifica qué puedes entregar.',
        ],
        [
          '¿Cómo confirmas el acuerdo?',
          'Resumo alcance, responsables y próximo paso por escrito.',
          'Un acuerdo claro evita supuestos diferentes entre las partes.',
          'Doy por aceptado el silencio del cliente.',
          'La aceptación necesita una confirmación explícita.',
        ],
      ],
    },
  ].map((c) =>
    PracticeCase.parse({
      ...c,
      published: true,
      version: 1,
      steps: c.situations.map(([question, good, why, bad, whyBad], i) => ({
        question,
        options:
          i % 2 === 0
            ? [
                { text: good, feedback: why, points: 2 },
                { text: bad, feedback: whyBad, points: 0 },
                {
                  text: 'Pido más tiempo para revisar la información antes de responder.',
                  feedback:
                    'Pausar puede ayudar; acuerda cuándo retomarás la conversación y qué necesitas revisar.',
                  points: 1,
                },
              ]
            : [
                { text: bad, feedback: whyBad, points: 0 },
                { text: good, feedback: why, points: 2 },
                {
                  text: 'Pido más tiempo para revisar la información antes de responder.',
                  feedback:
                    'Pausar puede ayudar; acuerda cuándo retomarás la conversación y qué necesitas revisar.',
                  points: 1,
                },
              ],
      })),
    }),
  );
}
