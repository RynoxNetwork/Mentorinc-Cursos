import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, ArrowRight, Users, BookOpen, CreditCard, Download } from 'lucide-react';
import { useStore } from '../store';
import {
  activeAccess,
  progress,
  money,
  dateLabel,
  uid,
  type CourseProgram,
  type CourseModule,
  type CourseLesson,
  type Person,
} from '../model';
import { Heading, Badge, Field, Area, Select, Avatar, Empty, getText, download } from '../ui';

export default function Admin() {
  const { section } = useParams();
  return section === 'compras' ? (
    <PurchasesAdmin />
  ) : section === 'personas' ? (
    <PeopleAdmin />
  ) : section === 'contenido' ? (
    <ContentAdmin />
  ) : section === 'programas' ? (
    <ProgramsAdmin />
  ) : (
    <Overview />
  );
}
function Overview() {
  const { state } = useStore();
  const students = state.users.filter((u) => u.role === 'alumno');
  const active = students.filter((u) => u.active && activeAccess(state, u.id));
  const pending = state.purchases.filter(
    (p) => p.payment === 'confirmado' && p.approval === 'pendiente',
  );
  return (
    <>
      <Heading title="Una vista de todo el recorrido">
        Administra los programas, acompaña al equipo y habilita cada nuevo comienzo.
      </Heading>
      <section className="admin-hero">
        <div>
          <h2>El aprendizaje también necesita un buen equipo detrás.</h2>
          <p>Hay {pending.length} solicitudes con pago confirmado listas para revisar.</p>
          <Link className="action" to="/admin/compras">
            Revisar accesos
            <ArrowRight size={18} />
          </Link>
        </div>
        <img src="/images/progress.webp" alt="" />
      </section>
      <div className="overview">
        <div>
          <strong>{students.length}</strong>
          <span>alumnos registrados</span>
        </div>
        <div>
          <strong>{active.length}</strong>
          <span>con acceso activo</span>
        </div>
        <div>
          <strong>
            {active.length
              ? Math.round(active.reduce((n, u) => n + progress(state, u), 0) / active.length)
              : 0}
            %
          </strong>
          <span>avance medio de activos</span>
        </div>
        <div>
          <strong>{state.submissions.filter((s) => s.status === 'pendiente').length}</strong>
          <span>actividades por revisar</span>
        </div>
      </div>
      <div className="three-up">
        {[
          ['/admin/personas', 'Personas', 'Asigna mentores y gestiona roles.', Users],
          ['/admin/contenido', 'Contenido', 'Organiza módulos, lecciones y recursos.', BookOpen],
          [
            '/admin/compras',
            'Compras y accesos',
            'Revisa pagos y aprueba solicitudes.',
            CreditCard,
          ],
        ].map(([to, title, desc, Icon]) => {
          const I = Icon as typeof Users;
          return (
            <Link className="admin-link" to={String(to)} key={String(to)}>
              <I size={26} />
              <h2>{String(title)}</h2>
              <p>{String(desc)}</p>
              <ArrowRight size={20} />
            </Link>
          );
        })}
      </div>
      <div className="section-spaced">
        <h2>Actividad reciente</h2>
        {state.notices.slice(0, 6).map((n) => (
          <div className="simple-row" key={n.id}>
            <div>
              <h3>{n.title}</h3>
              <p className="soft">
                {state.users.find((u) => u.id === n.userId)?.name} · {dateLabel(n.date)}
              </p>
            </div>
            <Badge>Local</Badge>
          </div>
        ))}
      </div>
    </>
  );
}
function PurchasesAdmin() {
  const { state, run } = useStore();
  const [filter, setFilter] = useState('pendientes');
  const items = state.purchases.filter(
    (p) =>
      filter === 'todas' ||
      (filter === 'pendientes' ? p.approval === 'pendiente' : p.approval === 'aprobado'),
  );
  return (
    <>
      <Heading title="Compras y accesos">
        Un pago confirmado permite revisar la solicitud. La aprobación habilita el aula.
      </Heading>
      <div className="tabs">
        {['pendientes', 'aprobadas', 'todas'].map((v) => (
          <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
            {v === 'pendientes' ? 'Por revisar' : v === 'aprobadas' ? 'Aprobadas' : 'Todas'}
          </button>
        ))}
      </div>
      {items.map((p) => (
        <article className="purchase-card" key={p.id}>
          <div className="section-title">
            <div>
              <h2>{state.users.find((u) => u.id === p.userId)?.name}</h2>
              <p className="soft">
                {state.programs.find((x) => x.id === p.programId)?.name} · {money(p.amount)} ·{' '}
                {dateLabel(p.date)}
              </p>
            </div>
            <Avatar name={state.users.find((u) => u.id === p.userId)?.name || ''} />
          </div>
          <div className="actions">
            <Badge tone={p.payment === 'confirmado' ? 'good' : 'pending'}>Pago {p.payment}</Badge>
            <Badge tone={p.approval === 'aprobado' ? 'good' : 'pending'}>Acceso {p.approval}</Badge>
          </div>
          <div className="actions section-spaced">
            {p.approval === 'pendiente' && (
              <>
                <button
                  className="action"
                  disabled={p.payment !== 'confirmado'}
                  onClick={() =>
                    run(
                      { type: 'approval', id: p.id, status: 'aprobado' },
                      'Acceso aprobado y alumno notificado',
                    )
                  }
                >
                  Aprobar acceso
                </button>
                <button
                  className="action secondary"
                  onClick={() =>
                    run({ type: 'approval', id: p.id, status: 'rechazado' }, 'Solicitud rechazada')
                  }
                >
                  Rechazar solicitud
                </button>
                {p.payment !== 'confirmado' && (
                  <button
                    className="quiet"
                    onClick={() =>
                      run(
                        { type: 'payment', id: p.id, status: 'confirmado' },
                        'Pago de prueba confirmado',
                      )
                    }
                  >
                    Confirmar pago de prueba
                  </button>
                )}
              </>
            )}
            {p.approval === 'aprobado' && (
              <button
                className="action secondary"
                onClick={() =>
                  run(
                    { type: 'approval', id: p.id, status: 'rechazado' },
                    'Acceso revocado; reservas futuras canceladas',
                  )
                }
              >
                Revocar acceso
              </button>
            )}
            {p.payment === 'confirmado' && (
              <details className="inline-confirm">
                <summary>Reembolso de prueba</summary>
                <p>
                  Se cerrará el acceso y se cancelarán sus reservas futuras. No se mueve dinero.
                </p>
                <button
                  className="action secondary"
                  onClick={() =>
                    run(
                      { type: 'payment', id: p.id, status: 'reembolsado' },
                      'Reembolso simulado y acceso cerrado',
                    )
                  }
                >
                  Confirmar reembolso simulado
                </button>
              </details>
            )}
          </div>
          {p.payment !== 'confirmado' && p.approval === 'pendiente' && (
            <p className="support-note">La aprobación requiere un pago confirmado.</p>
          )}
        </article>
      ))}
      {!items.length && <Empty title="No hay solicitudes en este estado" />}
    </>
  );
}
function PeopleAdmin() {
  const { state } = useStore();
  const [search, setSearch] = useState(''),
    [role, setRole] = useState('todos');
  const list = state.users.filter(
    (u) =>
      (role === 'todos' || u.role === role) &&
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  function csv() {
    const escape = (s: string) => `"${(/^[=+\-@]/.test(s) ? "'" : '') + s.replaceAll('"', '""')}"`;
    download(
      'mentorinc-personas.csv',
      '\uFEFFNombre,Correo,Rol,Activo,Avance\r\n' +
        list
          .map((u) =>
            [u.name, u.email, u.role, String(u.active), `${progress(state, u)}%`]
              .map(escape)
              .join(','),
          )
          .join('\r\n'),
      'text/csv;charset=utf-8',
    );
  }
  return (
    <>
      <Heading
        title="Personas y acompañamiento"
        action={
          <button className="action secondary" onClick={csv}>
            <Download size={17} /> Exportar lista
          </button>
        }
      >
        Los alumnos nuevos se registran desde el acceso público. Aquí puedes asignarles un mentor.
      </Heading>
      <div className="fields">
        <Field
          label="Buscar persona"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nombre o correo"
        />
        <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="todos">Todos los roles</option>
          <option value="alumno">Alumnos</option>
          <option value="mentor">Mentores</option>
          <option value="admin">Administración</option>
        </Select>
      </div>
      {list.map((u) => (
        <PersonEditor key={`${u.id}-${u.role}-${u.mentorId}-${u.active}`} person={u} />
      ))}
      {!list.length && <Empty title="No encontramos personas con ese filtro" />}
    </>
  );
}
function PersonEditor({ person: u }: { person: Person }) {
  const { state, user, run } = useStore();
  const [role, setRole] = useState(u.role);
  return (
    <details className="person-editor">
      <summary>
        <div className="person">
          <Avatar name={u.name} />
          <div>
            <h3>{u.name}</h3>
            <p className="soft">{u.email}</p>
          </div>
        </div>
        <Badge tone={u.active ? 'good' : ''}>{u.active ? u.role : 'Desactivado'}</Badge>
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          run(
            {
              type: 'user',
              userId: u.id,
              role,
              mentorId: getText(f, 'mentor'),
              active: getText(f, 'active') === 'si',
            },
            'Persona actualizada',
          );
        }}
      >
        <div className="three-up">
          <Select
            label="Rol de la cuenta"
            value={role}
            disabled={u.id === user?.id}
            onChange={(e) => setRole(e.target.value as Person['role'])}
          >
            <option value="alumno">Alumno</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Administración</option>
          </Select>
          <Select
            label="Mentor asignado"
            name="mentor"
            defaultValue={u.mentorId}
            disabled={role !== 'alumno'}
          >
            <option value="">Sin asignar</option>
            {state.users
              .filter((m) => m.role === 'mentor' && m.active)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </Select>
          <Select
            label="Estado"
            name="active"
            defaultValue={u.active ? 'si' : 'no'}
            disabled={u.id === user?.id}
          >
            <option value="si">Activo</option>
            <option value="no">Desactivado</option>
          </Select>
        </div>
        <p className="support-note">
          Reasignar un mentor o desactivar la cuenta cancela sus reservas futuras. El historial se
          conserva.
        </p>
        <button className="action" disabled={u.id === user?.id}>
          Guardar persona
        </button>
      </form>
    </details>
  );
}
function ProgramsAdmin() {
  const { state } = useStore();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <Heading
        title="Programas y niveles"
        action={
          <button className="action" onClick={() => setAdding(!adding)}>
            <Plus size={18} /> Nuevo programa
          </button>
        }
      >
        Los cambios se aplican a compras nuevas; las compras anteriores conservan precio y cupos.
      </Heading>
      {adding && (
        <ProgramEditor
          value={{
            id: uid(),
            name: '',
            description: '',
            price: 0,
            sessions: 2,
            minutes: 30,
            published: false,
          }}
          onSaved={() => setAdding(false)}
          open
        />
      )}
      {state.programs.map((p) => (
        <ProgramEditor key={p.id} value={p} />
      ))}
    </>
  );
}
function ProgramEditor({
  value: p,
  onSaved,
  open = false,
}: {
  value: CourseProgram;
  onSaved?: () => void;
  open?: boolean;
}) {
  const { run } = useStore();
  return (
    <details className="editor-panel" open={open || undefined}>
      <summary>
        <div>
          <h2>{p.name || 'Nuevo programa'}</h2>
          <p className="soft">
            {money(p.price)} · {p.sessions} sesiones de {p.minutes} minutos
          </p>
        </div>
        <Badge>{p.published ? 'Publicado' : 'Borrador'}</Badge>
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          if (
            run(
              {
                type: 'saveProgram',
                program: {
                  id: p.id,
                  name: getText(f, 'name'),
                  description: getText(f, 'description'),
                  price: Number(getText(f, 'price')),
                  sessions: Number(getText(f, 'sessions')),
                  minutes: Number(getText(f, 'minutes')),
                  published: getText(f, 'published') === 'si',
                },
              },
              'Programa guardado',
            )
          )
            onSaved?.();
        }}
      >
        <Field
          label="Nombre del programa"
          name="name"
          defaultValue={p.name}
          required
          minLength={2}
          maxLength={80}
        />
        <Area
          label="Descripción"
          name="description"
          defaultValue={p.description}
          required
          minLength={10}
          maxLength={500}
        />
        <div className="three-up">
          <Field
            label="Precio de muestra (PEN)"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={p.price}
            required
          />
          <Field
            label="Número de sesiones"
            name="sessions"
            type="number"
            min="0"
            max="20"
            defaultValue={p.sessions}
            required
          />
          <Select label="Duración" name="minutes" defaultValue={p.minutes}>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">60 minutos</option>
          </Select>
        </div>
        <Select label="Visibilidad" name="published" defaultValue={p.published ? 'si' : 'no'}>
          <option value="si">Publicado en el catálogo</option>
          <option value="no">Borrador / archivado</option>
        </Select>
        <button className="action">Guardar programa</button>
      </form>
    </details>
  );
}
function ContentAdmin() {
  const { state } = useStore();
  const [moduleId, setModuleId] = useState(state.modules[0]?.id || ''),
    [lessonId, setLessonId] = useState(''),
    [newModule, setNewModule] = useState(false);
  const module = state.modules.find((m) => m.id === moduleId);
  const lesson = state.lessons.find((l) => l.id === lessonId);
  const blank: CourseLesson = {
    id: 'new',
    moduleId,
    title: '',
    intro: '',
    minutes: 10,
    steps: ['', '', ''],
    activity: '',
    question: '',
    options: ['', '', ''],
    correct: 0,
    video: '',
    resource: '',
    published: false,
  };
  return (
    <>
      <Heading
        title="Dale forma al aprendizaje"
        action={
          <button className="action secondary" onClick={() => setNewModule(!newModule)}>
            <Plus size={17} /> Nuevo módulo
          </button>
        }
      >
        Edita contenido, actividades, evaluaciones y recursos. Archivar conserva el historial.
      </Heading>
      {newModule && (
        <ModuleEditor
          value={{
            id: uid(),
            title: '',
            description: '',
            order: state.modules.length,
            archived: false,
          }}
          onSaved={() => setNewModule(false)}
        />
      )}
      <div className="content-layout">
        <aside className="content-nav">
          <h3>Módulos</h3>
          {state.modules
            .toSorted((a, b) => a.order - b.order)
            .map((m) => (
              <button
                className={moduleId === m.id ? 'active' : ''}
                key={m.id}
                onClick={() => {
                  setModuleId(m.id);
                  setLessonId('');
                }}
              >
                {m.title}
                {m.archived && <span className="soft">Archivado</span>}
              </button>
            ))}
        </aside>
        <section>
          {module && !lessonId && (
            <>
              <ModuleEditor key={module.id} value={module} />
              <div className="section-title section-spaced">
                <h2>Lecciones</h2>
                <button className="action" onClick={() => setLessonId('new')}>
                  <Plus size={17} /> Añadir lección
                </button>
              </div>
              {state.lessons
                .filter((l) => l.moduleId === moduleId)
                .map((l) => (
                  <div className="simple-row" key={l.id}>
                    <div>
                      <h3>{l.title}</h3>
                      <Badge>{l.published ? 'Publicada' : 'Borrador'}</Badge>
                    </div>
                    <button className="quiet" onClick={() => setLessonId(l.id)}>
                      Editar →
                    </button>
                  </div>
                ))}
            </>
          )}
          {lessonId && (
            <>
              <button className="quiet back" onClick={() => setLessonId('')}>
                ← Todas las lecciones
              </button>
              <LessonEditor
                key={lessonId}
                value={lesson || blank}
                onSaved={() => setLessonId('')}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
function ModuleEditor({ value: m, onSaved }: { value: CourseModule; onSaved?: () => void }) {
  const { run } = useStore();
  return (
    <details className="editor-panel" open={!m.title || undefined}>
      <summary>
        <h2>{m.title || 'Nuevo módulo'}</h2>
        <span className="quiet">Editar módulo</span>
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          if (
            run(
              {
                type: 'saveModule',
                module: {
                  id: m.id,
                  title: getText(f, 'title'),
                  description: getText(f, 'description'),
                  order: Number(getText(f, 'order')),
                  archived: getText(f, 'archived') === 'si',
                },
              },
              'Módulo guardado',
            )
          )
            onSaved?.();
        }}
      >
        <Field
          label="Nombre del módulo"
          name="title"
          defaultValue={m.title}
          required
          minLength={2}
          maxLength={100}
        />
        <Area
          label="Descripción del módulo"
          name="description"
          defaultValue={m.description}
          maxLength={300}
        />
        <div className="fields">
          <Field
            label="Orden (desde 0)"
            name="order"
            type="number"
            min="0"
            defaultValue={m.order}
            required
          />
          <Select label="Estado del módulo" name="archived" defaultValue={m.archived ? 'si' : 'no'}>
            <option value="no">Visible</option>
            <option value="si">Archivado</option>
          </Select>
        </div>
        <button className="action">Guardar módulo</button>
      </form>
    </details>
  );
}
function LessonEditor({ value: l, onSaved }: { value: CourseLesson; onSaved: () => void }) {
  const { state, run } = useStore();
  return (
    <form
      className="lesson-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget;
        if (
          run(
            {
              type: 'saveLesson',
              lesson: {
                id: l.id === 'new' ? uid() : l.id,
                moduleId: getText(f, 'moduleId'),
                title: getText(f, 'title'),
                intro: getText(f, 'intro'),
                minutes: Number(getText(f, 'minutes')),
                steps: [getText(f, 'step0'), getText(f, 'step1'), getText(f, 'step2')],
                activity: getText(f, 'activity'),
                question: getText(f, 'question'),
                options: [getText(f, 'option0'), getText(f, 'option1'), getText(f, 'option2')],
                correct: Number(getText(f, 'correct')),
                video: getText(f, 'video'),
                resource: getText(f, 'resource'),
                published: getText(f, 'published') === 'si',
              },
            },
            'Lección guardada',
          )
        )
          onSaved();
      }}
    >
      <h2>{l.id === 'new' ? 'Nueva lección' : l.title}</h2>
      <Field
        label="Título"
        name="title"
        defaultValue={l.title}
        minLength={2}
        maxLength={120}
        required
      />
      <div className="fields">
        <Select label="Módulo" name="moduleId" defaultValue={l.moduleId}>
          {state.modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
        <Field
          label="Duración estimada (minutos)"
          name="minutes"
          type="number"
          min="1"
          max="180"
          defaultValue={l.minutes}
          required
        />
      </div>
      <Area
        label="Introducción"
        name="intro"
        defaultValue={l.intro}
        minLength={10}
        maxLength={1000}
        required
      />
      {[0, 1, 2].map((i) => (
        <Area
          key={i}
          label={`Idea ${i + 1} de la guía`}
          name={`step${i}`}
          defaultValue={l.steps[i] || ''}
          minLength={10}
          maxLength={2000}
          required
        />
      ))}
      <Area
        label="Actividad práctica"
        name="activity"
        defaultValue={l.activity}
        minLength={10}
        maxLength={1000}
        required
      />
      <h3 className="section-spaced">Comprobación de aprendizaje</h3>
      <Field label="Pregunta" name="question" defaultValue={l.question} minLength={5} required />
      {[0, 1, 2].map((i) => (
        <Field
          key={i}
          label={`Respuesta ${i + 1}`}
          name={`option${i}`}
          defaultValue={l.options[i] || ''}
          required
        />
      ))}
      <Select label="Respuesta correcta" name="correct" defaultValue={l.correct}>
        {[0, 1, 2].map((i) => (
          <option value={i} key={i}>
            Respuesta {i + 1}
          </option>
        ))}
      </Select>
      <h3 className="section-spaced">Recursos</h3>
      <Field
        label="URL de video (archivo HTTPS compatible)"
        name="video"
        type="url"
        defaultValue={l.video}
        placeholder="https://…/video.mp4"
      />
      <Field
        label="URL del recurso complementario"
        name="resource"
        type="url"
        defaultValue={l.resource}
        placeholder="https://…"
      />
      <p className="support-note">
        El reproductor admite archivos de video directos. Los enlaces de páginas de YouTube o Vimeo
        no son archivos de video.
      </p>
      <Select
        label="Estado de publicación"
        name="published"
        defaultValue={l.published ? 'si' : 'no'}
      >
        <option value="si">Publicada</option>
        <option value="no">Borrador / archivada</option>
      </Select>
      <button className="action">Guardar lección</button>
    </form>
  );
}
