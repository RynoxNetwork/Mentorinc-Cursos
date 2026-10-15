import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { currentPolicies } from '../operations';
import { PracticeCase } from '../operations-model';
import { uid, now, programLessons, dateLabel } from '../model';
import { Heading, Field, Area, Select, Badge, getText, download } from '../ui';
import type { z } from 'zod';

export function Operations() {
  const { state, run } = useStore();
  const [section, setSection] = useState('entrega');
  const policies = currentPolicies(state),
    lessons = state.lessons.filter((l) => l.published),
    delivery = state.delivery;
  const inventory = [
    [
      'Contenido académico',
      `${lessons.filter((l) => l.contentStatus === 'validado').length}/${lessons.length} lecciones marcadas como validadas`,
      lessons.length > 0 && lessons.every((l) => l.contentStatus === 'validado'),
    ],
    [
      'Videos y material equivalente',
      `${lessons.filter((l) => l.video || l.transcript).length}/${lessons.length} lecciones con video o transcripción`,
      lessons.length > 0 && lessons.every((l) => l.video || l.transcript),
    ],
    [
      'Políticas aprobadas',
      `${policies.filter((p) => p.status === 'aprobada').length}/3 documentos con validación declarada`,
      policies.length === 3 && policies.every((p) => p.status === 'aprobada'),
    ],
    [
      'Temarios de programas',
      `${state.programs.filter((p) => p.published && programLessons(state, p.id).length > 0).length} programas publicados con contenido`,
      state.programs
        .filter((p) => p.published)
        .every((p) => programLessons(state, p.id).length > 0),
    ],
    [
      'Responsables',
      'Negocio, académico y soporte',
      !!delivery.businessOwner && !!delivery.academicOwner && !!delivery.supportOwner,
    ],
    ['Dominio acordado', delivery.domain || 'Por confirmar con Mentorinc', !!delivery.domain],
    [
      'Capacitación de 60 minutos',
      delivery.trainingAt
        ? `${delivery.trainingAt} · ${delivery.trainingNotes || 'Falta acta o notas'}`
        : 'Por programar y realizar',
      !!delivery.trainingAt && !!delivery.trainingNotes,
    ],
  ] as const;
  function exportInventory() {
    download(
      'Mentorinc-preparacion-entrega.json',
      JSON.stringify(
        {
          generatedAt: now(),
          mode: 'local',
          delivery,
          inventory: inventory.map(([item, detail, complete]) => ({ item, detail, complete })),
          pendingServices: [
            'Autenticación y permisos en servidor',
            'API y base de datos',
            'Pagos y webhooks',
            'Correo transaccional y recordatorios',
            'IA orientativa',
            'Archivos y video autorizados',
            'Backups diarios y restauración',
            'Observabilidad y responsables operativos',
          ],
          content: lessons.map((l) => ({
            id: l.id,
            title: l.title,
            status: l.contentStatus || 'muestra',
            hasVideo: !!l.video,
            hasTranscript: !!l.transcript,
            hasResource: !!l.resource,
            rubric: l.rubric || '',
          })),
        },
        null,
        2,
      ),
      'application/json',
    );
  }
  return (
    <>
      <Heading title="Preparar una entrega completa">
        Configura la experiencia local y conserva visibles los insumos pendientes.
      </Heading>
      <div className="tabs">
        {[
          ['entrega', 'Preparación'],
          ['politicas', 'Políticas'],
          ['casos', 'Casos guiados'],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={section === id} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
      </div>
      {section === 'entrega' ? (
        <>
          <div className="split">
            <section>
              <h2>Estado de preparación</h2>
              <p>
                Estas marcas describen esta copia local. No acreditan contratación, conexión de
                servicios ni aceptación final del cliente.
              </p>
              {inventory.map(([title, detail, complete]) => (
                <div className="readiness-row" key={title}>
                  <div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </div>
                  <Badge tone={complete ? 'good' : 'pending'}>
                    {complete ? 'Registrado' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
              <button className="action secondary" onClick={exportInventory}>
                Exportar inventario de entrega
              </button>
              <h2 className="section-spaced">Conexiones de la siguiente etapa</h2>
              <ul>
                <li>Identidad, sesiones y permisos de servidor.</li>
                <li>API, base de datos y almacenamiento compartido.</li>
                <li>Pasarela, validación de eventos y conciliación.</li>
                <li>Correo, recordatorios y recomendación con IA.</li>
                <li>Archivos y video con autorización, respaldo y monitoreo.</li>
              </ul>
              <p>Todos siguen pendientes. No se guardan claves ni contraseñas en este panel.</p>
              <div className="actions">
                <Link to="/admin/contenido">Completar contenido →</Link>
                <Link to="/admin/programas">Configurar programas →</Link>
                <Link to="/ayuda">Guía y capacitación →</Link>
                <Link to="/recordatorios">Preparar recordatorios locales →</Link>
              </div>
            </section>
            <form
              className="journey-next"
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                run(
                  {
                    type: 'delivery',
                    value: {
                      domain: getText(f, 'domain'),
                      businessOwner: getText(f, 'businessOwner'),
                      academicOwner: getText(f, 'academicOwner'),
                      supportOwner: getText(f, 'supportOwner'),
                      supportHours: getText(f, 'supportHours'),
                      trainingAt: getText(f, 'trainingAt'),
                      trainingNotes: getText(f, 'trainingNotes'),
                    },
                  },
                  'Preparación guardada',
                );
              }}
            >
              <h2>Responsables y entrega</h2>
              <Field
                label="Dominio acordado"
                name="domain"
                defaultValue={delivery.domain}
                maxLength={200}
                placeholder="Pendiente de confirmar"
              />
              <Field
                label="Responsable del negocio"
                name="businessOwner"
                defaultValue={delivery.businessOwner}
                maxLength={100}
              />
              <Field
                label="Responsable académico"
                name="academicOwner"
                defaultValue={delivery.academicOwner}
                maxLength={100}
              />
              <Field
                label="Responsable de atención"
                name="supportOwner"
                defaultValue={delivery.supportOwner}
                maxLength={100}
              />
              <Field
                label="Horario de atención"
                name="supportHours"
                defaultValue={delivery.supportHours}
                maxLength={300}
              />
              <Field
                label="Fecha de capacitación realizada"
                type="date"
                name="trainingAt"
                defaultValue={delivery.trainingAt}
              />
              <Area
                label="Acta breve de capacitación y acuerdos"
                name="trainingNotes"
                defaultValue={delivery.trainingNotes}
                maxLength={3000}
              />
              <button className="action">Guardar preparación</button>
            </form>
          </div>
          <section className="section-spaced">
            <h2>Material pendiente de completar</h2>
            {lessons
              .filter((l) => l.contentStatus !== 'validado' || !l.video || !l.resource)
              .map((l) => (
                <div className="simple-row" key={l.id}>
                  <strong>{l.title}</strong>
                  <span>
                    {l.contentStatus !== 'validado' ? 'Validación académica · ' : ''}
                    {!l.video ? 'Video · ' : ''}
                    {!l.resource ? 'Recurso complementario' : ''}
                  </span>
                </div>
              ))}
          </section>
        </>
      ) : section === 'politicas' ? (
        <>
          <p>
            Al guardar se crea una nueva versión. Las aceptaciones previas conservan el documento
            que se consultó. Los borradores no se presentan como textos aprobados.
          </p>
          {policies.map((p) => (
            <details className="editor-panel" key={p.id}>
              <summary>
                <h2>{p.title}</h2>
                <Badge>
                  {p.status} · v{p.version}
                </Badge>
              </summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  run(
                    {
                      type: 'policy',
                      policy: {
                        ...p,
                        title: getText(f, 'title'),
                        body: getText(f, 'body'),
                        status: getText(f, 'status') as 'borrador',
                        approvedBy: getText(f, 'approvedBy'),
                        updatedAt: now(),
                      },
                    },
                    'Nueva versión guardada',
                  );
                }}
              >
                <Field
                  label="Título"
                  name="title"
                  required
                  defaultValue={p.title}
                  maxLength={100}
                />
                <Area
                  label="Texto del documento"
                  name="body"
                  required
                  minLength={30}
                  maxLength={12000}
                  defaultValue={p.body}
                />
                <Select label="Estado editorial" name="status" defaultValue="borrador">
                  <option value="borrador">Borrador pendiente de revisión</option>
                  <option value="aprobada">Texto validado por Mentorinc</option>
                </Select>
                <Field
                  label="Persona que validó el texto (si corresponde)"
                  name="approvedBy"
                  maxLength={100}
                />
                <p className="support-note">
                  Registra una validación solo cuando haya ocurrido. Guardar aquí no sustituye la
                  aprobación del responsable.
                </p>
                <button className="action">Guardar nueva versión</button>
                <Link to={`/politicas/${p.kind}`}>Consultar documento →</Link>
              </form>
            </details>
          ))}
          <h2 className="section-spaced">Versiones conservadas</h2>
          {state.policies.map((p) => (
            <details className="route-item" key={p.id}>
              <summary>
                {p.title} · v{p.version} · {p.status}
              </summary>
              <p>{dateLabel(p.updatedAt)}</p>
              <p className="preserve">{p.body}</p>
            </details>
          ))}
          <h2 className="section-spaced">Aceptaciones de la demostración</h2>
          {state.consents.length ? (
            state.consents.map((c) => (
              <p key={c.id}>
                {state.users.find((u) => u.id === c.userId)?.name} · {c.purpose} ·{' '}
                {dateLabel(c.date)} ·{' '}
                {c.policyIds
                  .map((id) => {
                    const p = state.policies.find((p) => p.id === id);
                    return p ? `${p.kind} v${p.version}` : 'Versión no disponible';
                  })
                  .join(', ')}
              </p>
            ))
          ) : (
            <p>No hay aceptaciones registradas todavía.</p>
          )}
        </>
      ) : (
        <>
          <p>
            Contenido educativo de muestra. Edita cada situación, las alternativas y el feedback.
            Los intentos conservan el resultado y la versión resuelta.
          </p>
          {state.cases.map((c) => (
            <CaseEditor key={`${c.id}-${c.version}`} value={c} />
          ))}
          <CaseEditor
            key={`new-${state.cases.length}`}
            value={PracticeCase.parse({
              id: 'new',
              title: 'Nuevo caso',
              intro: 'Describe una situación concreta que el alumno pueda practicar.',
              moduleId: state.modules[0]?.id || '',
              published: false,
              version: 1,
              steps: [
                {
                  question: '¿Qué harías en esta situación?',
                  options: [0, 1, 2].map((i) => ({
                    text: `Alternativa ${i + 1}`,
                    feedback:
                      'Explica la consecuencia de esta decisión y qué puede aprender el alumno.',
                    points: i,
                  })),
                },
              ],
            })}
          />
        </>
      )}
    </>
  );
}
function CaseEditor({ value }: { value: z.infer<typeof PracticeCase> }) {
  const { state, run } = useStore(),
    [draft, setDraft] = useState(value);
  return (
    <details className="editor-panel">
      <summary>
        <h2>{draft.title}</h2>
        <Badge>{draft.published ? 'Publicado' : 'Borrador'}</Badge>
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            {
              type: 'practiceCase',
              practice: { ...draft, id: draft.id === 'new' ? uid() : draft.id },
            },
            'Caso guardado',
          );
        }}
      >
        <Field
          label="Título del caso"
          required
          value={draft.title}
          maxLength={120}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <Area
          label="Situación"
          required
          minLength={20}
          maxLength={2000}
          value={draft.intro}
          onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
        />
        <Select
          label="Módulo del caso"
          value={draft.moduleId}
          onChange={(e) => setDraft({ ...draft, moduleId: e.target.value })}
        >
          {state.modules
            .filter((m) => !m.archived)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
        </Select>
        {draft.steps.map((step, i) => (
          <fieldset className="case-step" key={i}>
            <legend>Decisión {i + 1}</legend>
            <Field
              label={`Pregunta ${i + 1}`}
              required
              minLength={10}
              maxLength={1000}
              value={step.question}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  steps: draft.steps.map((s, k) =>
                    k === i ? { ...s, question: e.target.value } : s,
                  ),
                })
              }
            />
            {step.options.map((o, j) => (
              <div key={j}>
                <Field
                  label={`Alternativa ${i + 1}.${j + 1}`}
                  required
                  maxLength={500}
                  value={o.text}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      steps: draft.steps.map((s, k) =>
                        k === i
                          ? {
                              ...s,
                              options: s.options.map((x, n) =>
                                n === j ? { ...x, text: e.target.value } : x,
                              ),
                            }
                          : s,
                      ),
                    })
                  }
                />
                <Area
                  label={`Feedback ${i + 1}.${j + 1}`}
                  required
                  minLength={10}
                  maxLength={1000}
                  value={o.feedback}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      steps: draft.steps.map((s, k) =>
                        k === i
                          ? {
                              ...s,
                              options: s.options.map((x, n) =>
                                n === j ? { ...x, feedback: e.target.value } : x,
                              ),
                            }
                          : s,
                      ),
                    })
                  }
                />
                <Select
                  label={`Puntos ${i + 1}.${j + 1}`}
                  value={o.points}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      steps: draft.steps.map((s, k) =>
                        k === i
                          ? {
                              ...s,
                              options: s.options.map((x, n) =>
                                n === j ? { ...x, points: Number(e.target.value) } : x,
                              ),
                            }
                          : s,
                      ),
                    })
                  }
                >
                  <option value="0">0 · revisar decisión</option>
                  <option value="1">1 · avance parcial</option>
                  <option value="2">2 · decisión orientada al objetivo</option>
                </Select>
              </div>
            ))}
          </fieldset>
        ))}
        <div className="actions">
          <button
            type="button"
            className="action secondary"
            disabled={draft.steps.length >= 5}
            onClick={() =>
              setDraft({ ...draft, steps: [...draft.steps, structuredClone(draft.steps[0])] })
            }
          >
            Añadir decisión
          </button>
          <button
            type="button"
            className="quiet"
            disabled={draft.steps.length <= 1}
            onClick={() => setDraft({ ...draft, steps: draft.steps.slice(0, -1) })}
          >
            Quitar última decisión del borrador
          </button>
        </div>
        <Select
          label="Visibilidad del caso"
          value={draft.published ? 'si' : 'no'}
          onChange={(e) => setDraft({ ...draft, published: e.target.value === 'si' })}
        >
          <option value="si">Publicado</option>
          <option value="no">Borrador / archivado</option>
        </Select>
        <button className="action">Guardar caso</button>
      </form>
    </details>
  );
}
