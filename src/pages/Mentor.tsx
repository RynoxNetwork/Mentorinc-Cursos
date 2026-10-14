import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { activeAccess, progress, dateLabel, type AppState } from '../model';
import { Heading, Badge, Field, Area, Select, Avatar, Empty, getText } from '../ui';

export default function Mentor() {
  const { state, user } = useStore();
  const { section } = useParams();
  const [search, setSearch] = useState(''),
    [selected, setSelected] = useState(''),
    [filter, setFilter] = useState('pendiente');
  const students = state.users.filter((u) => u.role === 'alumno' && u.mentorId === user?.id);
  const submissions = state.submissions.filter((s) => students.some((u) => u.id === s.userId));
  const student = students.find((s) => s.id === selected);
  return (
    <>
      <Heading
        title={
          section === 'entregas' ? 'Una mirada que ayuda a crecer' : 'Acompaña cada siguiente paso'
        }
      >
        {section === 'entregas'
          ? 'Revisa la práctica, comparte una observación concreta y orienta la siguiente mejora.'
          : `Hola, ${user?.name.split(' ')[0]}. Así van tus alumnos.`}
      </Heading>
      <div className="overview">
        <div>
          <strong>{students.length}</strong>
          <span>alumnos asignados</span>
        </div>
        <div>
          <strong>{submissions.filter((s) => s.status === 'pendiente').length}</strong>
          <span>entregas por revisar</span>
        </div>
        <div>
          <strong>
            {state.threads.filter((t) => t.mentorId === user?.id && t.status === 'abierta').length}
          </strong>
          <span>consultas abiertas</span>
        </div>
      </div>
      {section === 'entregas' ? (
        <>
          <div className="tabs">
            {['pendiente', 'revisar', 'aprobada', 'todas'].map((v) => (
              <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
                {v === 'pendiente'
                  ? 'Por revisar'
                  : v === 'revisar'
                    ? 'Con ajustes'
                    : v === 'aprobada'
                      ? 'Aprobadas'
                      : 'Todas'}
              </button>
            ))}
          </div>
          {submissions
            .filter((s) => filter === 'todas' || s.status === filter)
            .map((s) => (
              <Review key={`${s.id}-${s.date}`} submission={s} />
            ))}
          {!submissions.some((s) => filter === 'todas' || s.status === filter) && (
            <Empty title="No hay entregas en este estado">
              Las actividades de tus alumnos aparecerán aquí cuando las envíen.
            </Empty>
          )}
        </>
      ) : (
        <div className="split">
          <section>
            <Field
              label="Buscar alumno"
              type="search"
              placeholder="Nombre o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {students
              .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
              .map((u) => (
                <div className={`student ${selected === u.id ? 'selected' : ''}`} key={u.id}>
                  <div className="person">
                    <Avatar name={u.name} />
                    <div>
                      <h3>{u.name}</h3>
                      <p className="soft">
                        {activeAccess(state, u.id)
                          ? state.programs.find(
                              (p) => p.id === activeAccess(state, u.id)?.programId,
                            )?.name
                          : 'Acceso pendiente'}
                      </p>
                    </div>
                  </div>
                  <div className="student-progress">
                    <span>{progress(state, u)}% de su ruta</span>
                    <progress
                      value={progress(state, u)}
                      max="100"
                      aria-label={`Progreso de ${u.name}`}
                    />
                  </div>
                  <button
                    className="action secondary"
                    aria-label={`Ver seguimiento de ${u.name}`}
                    onClick={() => setSelected(u.id)}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            {!students.length && (
              <Empty title="Aún no tienes alumnos asignados">
                Administración puede asignarlos desde Personas.
              </Empty>
            )}
          </section>
          <aside className="aside">
            {student ? (
              <StudentDetail key={student.id} id={student.id} />
            ) : (
              <>
                <img src="/images/learn.webp" alt="" />
                <h3>Pequeños avances, conversaciones valiosas.</h3>
                <p>
                  Selecciona un alumno para revisar su objetivo, ajustar el foco de su ruta y
                  acompañar su práctica.
                </p>
                <Link to="/mentor/entregas" className="quiet">
                  Revisar entregas →
                </Link>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
function StudentDetail({ id }: { id: string }) {
  const { state, run } = useStore();
  const u = state.users.find((u) => u.id === id)!;
  return (
    <>
      <Avatar name={u.name} />
      <h2>{u.name}</h2>
      <p className="soft">{u.email}</p>
      <h3>Su objetivo</h3>
      <p>{u.goal || 'Todavía no ha definido su objetivo.'}</p>
      <h3>Punto de partida</h3>
      {u.diagnostic.length ? (
        <div className="diagnostic-results">
          {['El Yo', 'Comunicación', 'Producto', 'Negociación'].map((name, i) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{u.diagnostic[i]}/5</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="soft">Diagnóstico pendiente.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            { type: 'route', userId: id, focus: getText(e.currentTarget, 'focus') },
            'Ruta ajustada y alumno notificado',
          );
        }}
      >
        <Select label="Foco recomendado" name="focus" defaultValue={u.focus}>
          {state.modules
            .filter((m) => !m.archived)
            .map((m) => (
              <option value={m.id} key={m.id}>
                {m.title}
              </option>
            ))}
        </Select>
        <button className="action full">Actualizar ruta</button>
      </form>
      <div className="vertical-links">
        <Link to="/mentor/entregas">Revisar actividades →</Link>
        <Link to="/consultas">Responder consultas →</Link>
      </div>
    </>
  );
}
function Review({ submission: s }: { submission: AppState['submissions'][number] }) {
  const { state, run } = useStore();
  return (
    <article className="review">
      <div className="section-title">
        <div>
          <h2>{state.lessons.find((l) => l.id === s.lessonId)?.title || 'Lección archivada'}</h2>
          <p className="soft">
            {state.users.find((u) => u.id === s.userId)?.name} · {dateLabel(s.date)}
          </p>
        </div>
        <Badge tone={s.status === 'aprobada' ? 'good' : 'pending'}>{s.status}</Badge>
      </div>
      <div className="two-up">
        <section>
          <h3>La práctica del alumno</h3>
          <blockquote className="preserve">{s.text}</blockquote>
          {s.attachment && (
            <a href={s.attachment.data} download={s.attachment.name} className="quiet">
              Descargar {s.attachment.name}
            </a>
          )}
        </section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            run(
              {
                type: 'review',
                id: s.id,
                feedback: getText(f, 'feedback'),
                score: Number(getText(f, 'score')),
                status: getText(f, 'status') as 'aprobada' | 'revisar',
              },
              'Feedback enviado al alumno',
            );
          }}
        >
          <Area
            label="Feedback para el alumno"
            name="feedback"
            defaultValue={s.feedback}
            required
            minLength={10}
            maxLength={3000}
            placeholder="Reconoce un avance y sugiere una mejora concreta…"
          />
          <div className="fields">
            <Field
              label="Calificación (0 a 20)"
              name="score"
              type="number"
              min="0"
              max="20"
              step="1"
              defaultValue={s.score ?? 16}
              required
            />
            <Select
              label="Resultado"
              name="status"
              defaultValue={s.status === 'revisar' ? 'revisar' : 'aprobada'}
            >
              <option value="aprobada">Aprobar actividad</option>
              <option value="revisar">Solicitar ajustes</option>
            </Select>
          </div>
          <button className="action">
            Enviar feedback
            <CheckCircle2 size={18} />
          </button>
        </form>
      </div>
    </article>
  );
}
