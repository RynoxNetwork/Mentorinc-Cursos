import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { activeAccess, dateLabel, visibleLessons, type LearnerContext } from '../model';
import { canFinish, experienceLabels, hasAttended, questions, sessionBalance } from '../insights';
import { Comparison, RatingScale } from '../measurement-ui';
import { Heading, Area, Select, Empty, ButtonLink, getText } from '../ui';

export function Diagnostic() {
  const { user, run } = useStore();
  const navigate = useNavigate();
  const [values, setValues] = useState(
    user?.diagnostic.length === 4 ? user.diagnostic : [0, 0, 0, 0],
  );
  if (!user || user.role !== 'alumno')
    return <Empty title="El diagnóstico es parte del recorrido del alumno" />;
  if (!user.verified)
    return (
      <Empty
        title="Confirma tu correo para comenzar"
        action={<ButtonLink to="/correo">Revisar correo de prueba</ButtonLink>}
      />
    );
  const initial = user.initialAssessment;
  return (
    <>
      <Heading title={initial ? 'Tu contexto, tu forma de crecer' : 'Tu punto de partida'}>
        {initial
          ? 'Actualiza lo que quieres trabajar con tu mentor. La medición inicial se conserva.'
          : 'Cuéntanos de tu experiencia y cómo te sientes hoy. No hay respuestas buenas o malas.'}
      </Heading>
      <div className="split">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const context = {
              experience: getText(form, 'experience') as LearnerContext['experience'],
              context: getText(form, 'context'),
              style: getText(form, 'style'),
            };
            const goal = getText(form, 'goal');
            if (
              run(
                initial
                  ? { type: 'onboarding', context, goal }
                  : { type: 'diagnostic', context, goal, values },
                initial
                  ? 'Contexto actualizado. Tu punto de partida se conserva.'
                  : 'Tu punto de partida está guardado',
              )
            )
              navigate('/resultados');
          }}
        >
          <h2>Tu experiencia al vender</h2>
          <Select
            label="Tiempo de experiencia comercial"
            name="experience"
            defaultValue={user.onboarding?.experience ?? ''}
            required
          >
            <option value="" disabled>
              Selecciona tu experiencia
            </option>
            {Object.entries(experienceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Area
            label="¿Qué vendes o te gustaría vender y a quién?"
            name="context"
            required
            minLength={10}
            maxLength={500}
            defaultValue={user.onboarding?.context ?? ''}
            placeholder="Producto o servicio, tipo de cliente y canal de venta…"
          />
          <Area
            label="¿Cómo sueles abordar una conversación de venta?"
            name="style"
            required
            minLength={10}
            maxLength={500}
            defaultValue={user.onboarding?.style ?? ''}
            placeholder="Describe tu estilo con tus palabras: qué te resulta natural y qué te cuesta…"
          />
          <Area
            label="¿Qué te gustaría lograr?"
            name="goal"
            required
            minLength={10}
            maxLength={500}
            defaultValue={user.goal}
            placeholder="Quiero aprender a…"
          />
          {!initial && (
            <section className="section-spaced">
              <h2>Cómo te sientes hoy</h2>
              <p className="soft">
                Estas cuatro respuestas se guardarán como tu medición inicial y no se reemplazarán.
              </p>
              {questions.map((question, i) => (
                <RatingScale
                  key={question}
                  name={`initial-${i}`}
                  question={question}
                  value={values[i]}
                  onChange={(n) => setValues(values.map((v, j) => (i === j ? n : v)))}
                />
              ))}
            </section>
          )}
          <button className="action" type="submit">
            {initial ? 'Guardar mi contexto' : 'Guardar mi punto de partida'}
            <ArrowRight size={18} />
          </button>
        </form>
        <aside className="aside">
          <img src="/images/progress.webp" alt="" />
          <h3>Una orientación, no una etiqueta.</h3>
          <p>
            Tu experiencia y tu estilo ayudan al mentor a conocerte. La sugerencia local prioriza el
            área con la puntuación más baja y el mentor puede ajustarla contigo.
          </p>
          <p className="soft">
            Esta muestra no utiliza IA ni constituye una evaluación clínica, DISC o PPDC.
          </p>
          {initial && (
            <Link className="quiet" to="/resultados">
              Ver mi medición inicial →
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}

export function Results() {
  const { state, user } = useStore();
  if (!user || user.role !== 'alumno')
    return (
      <Empty
        title="Este es el recorrido del alumno"
        action={<ButtonLink to="/">Volver a mi espacio</ButtonLink>}
      />
    );
  const balance = sessionBalance(state, [user.id]);
  const remaining = visibleLessons(state).filter((l) => !user.completed.includes(l.id)).length;
  const ready = canFinish(state, user);
  return (
    <>
      <Heading
        title="Mira tu recorrido"
        action={
          <ButtonLink secondary to="/diagnostico">
            {user.initialAssessment ? 'Mi contexto' : 'Definir punto de partida'}
          </ButtonLink>
        }
      >
        Reconoce tus avances, lo que quieres seguir practicando y cómo fue tu experiencia.
      </Heading>
      <div className="journey-layout">
        <Comparison user={user} />
        <aside className="journey-next">
          <img src="/images/progress.webp" alt="" />
          <h2>{user.finalAssessment ? 'Un cierre, nuevos comienzos.' : 'Tu siguiente paso'}</h2>
          {!user.initialAssessment ? (
            <>
              <p>Guarda tu medición inicial para poder comparar después.</p>
              <ButtonLink to="/diagnostico">Comenzar</ButtonLink>
            </>
          ) : !user.finalAssessment ? (
            <>
              <p>
                {ready
                  ? 'Ya completaste las lecciones. Vuelve a las mismas cuatro preguntas para reconocer tu cambio.'
                  : `La evaluación final se habilita al completar las lecciones publicadas. Te faltan ${remaining}.`}
              </p>
              {ready ? (
                <ButtonLink to="/evaluacion-final">Hacer evaluación final</ButtonLink>
              ) : (
                <ButtonLink to={activeAccess(state, user.id) ? '/ruta' : '/compras'}>
                  {activeAccess(state, user.id) ? 'Continuar mi ruta' : 'Revisar mi acceso'}
                </ButtonLink>
              )}
            </>
          ) : (
            <>
              <p>
                Comparte qué te ayudó y qué podríamos mejorar. Tu opinión acompaña el cierre de tu
                recorrido.
              </p>
              <ButtonLink to="/satisfaccion">
                {user.satisfaction ? 'Revisar mi opinión' : 'Compartir mi experiencia'}
              </ButtonLink>
            </>
          )}
          {!user.onboarding && (
            <Link className="quiet" to="/diagnostico">
              Completar mi contexto comercial →
            </Link>
          )}
          <div className="session-mini">
            <h3>Tu mentoría</h3>
            <p>
              {balance.attended} realizadas · {balance.reserved} reservadas
            </p>
            <p>
              {balance.available} disponibles de {balance.acquired} cupos habilitados
            </p>
            <Link to="/agenda">Ver mi agenda →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export function FinalAssessment() {
  const { state, user, run } = useStore();
  const navigate = useNavigate();
  const [values, setValues] = useState([0, 0, 0, 0]);
  if (!user || user.role !== 'alumno')
    return <Empty title="La evaluación final corresponde al alumno" />;
  if (user.finalAssessment)
    return (
      <Empty
        title="Tu evaluación final ya está guardada"
        action={<ButtonLink to="/resultados">Ver mi comparación</ButtonLink>}
      />
    );
  if (!canFinish(state, user))
    return (
      <Empty
        title="Tu recorrido todavía está en marcha"
        action={
          <ButtonLink to={user.initialAssessment ? '/ruta' : '/diagnostico'}>
            {user.initialAssessment ? 'Continuar mi ruta' : 'Definir punto de partida'}
          </ButtonLink>
        }
      >
        Necesitas una medición inicial, un programa aprobado y todas las lecciones publicadas
        completadas.
      </Empty>
    );
  return (
    <>
      <Heading title="Reconoce lo que cambió">
        Responde pensando en cómo te sientes hoy, sin buscar una puntuación más alta.
      </Heading>
      <div className="split">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              run(
                {
                  type: 'finalAssessment',
                  values,
                  reflection: getText(e.currentTarget, 'reflection'),
                },
                'Evaluación final guardada',
              )
            )
              navigate('/resultados');
          }}
        >
          {questions.map((question, i) => (
            <RatingScale
              key={question}
              name={`final-${i}`}
              question={question}
              value={values[i]}
              onChange={(n) => setValues(values.map((v, j) => (i === j ? n : v)))}
            />
          ))}
          <Area
            label="¿Qué cambió en tu práctica y qué quieres seguir trabajando?"
            name="reflection"
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="support-note">
            Al guardar, esta medición queda como cierre de tu recorrido. Tu medición inicial
            permanece intacta.
          </p>
          <button className="action">
            Guardar evaluación final
            <CheckCircle2 size={18} />
          </button>
        </form>
        <aside className="aside">
          <img src="/images/progress.webp" alt="" />
          <h3>Observar también es avanzar.</h3>
          <p>
            Un resultado igual o menor puede ayudarte a reconocer lo que ahora ves con más claridad.
            Conversa sobre ello con tu mentor.
          </p>
          <p className="soft">
            Escalas orientativas de muestra. No sustituyen la revisión de tus actividades.
          </p>
        </aside>
      </div>
    </>
  );
}

export function SatisfactionPage() {
  const { state, user, run } = useStore();
  const [overall, setOverall] = useState(user?.satisfaction?.overall ?? 0);
  const [learning, setLearning] = useState(user?.satisfaction?.learning ?? 0);
  const [mentoring, setMentoring] = useState(user?.satisfaction?.mentoring ?? 0);
  if (!user || user.role !== 'alumno') return <Empty title="La encuesta corresponde al alumno" />;
  if (!user.finalAssessment || !activeAccess(state, user.id))
    return (
      <Empty
        title="Tu opinión tiene un lugar al cierre"
        action={<ButtonLink to="/resultados">Ver mi recorrido</ButtonLink>}
      >
        Completa la evaluación final con tu programa aprobado para responder.
      </Empty>
    );
  const attended = hasAttended(state, user.id);
  return (
    <>
      <Heading title="Tu experiencia nos ayuda a crecer">
        Una respuesta por alumno. Puedes corregirla después sin duplicar los resultados.
      </Heading>
      <div className="split">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              {
                type: 'satisfaction',
                overall,
                learning,
                mentoring: attended ? mentoring : null,
                comment: getText(e.currentTarget, 'comment'),
              },
              'Gracias. Tu opinión quedó guardada.',
            );
          }}
        >
          {user.satisfaction && (
            <div className="notice">
              <CheckCircle2 size={20} />
              <span>Respuesta guardada · {dateLabel(user.satisfaction.updatedAt)}</span>
            </div>
          )}
          <RatingScale
            name="overall"
            question="¿Cómo valorarías tu experiencia general?"
            value={overall}
            onChange={setOverall}
            low="Muy insatisfecho"
            high="Muy satisfecho"
          />
          <RatingScale
            name="learning"
            question="¿Qué tan útil fue el aprendizaje para tu práctica?"
            value={learning}
            onChange={setLearning}
            low="Poco útil"
            high="Muy útil"
          />
          {attended ? (
            <RatingScale
              name="mentoring"
              question="¿Cómo valorarías tus sesiones de mentoría?"
              value={mentoring}
              onChange={setMentoring}
              low="Poco útiles"
              high="Muy útiles"
            />
          ) : (
            <p className="notice">
              Aún no tienes sesiones registradas como realizadas. La valoración de mentoría no
              aplica y no se incluye en su promedio.
            </p>
          )}
          <Area
            label="¿Qué conservarías y qué mejorarías? (opcional)"
            name="comment"
            maxLength={1000}
            defaultValue={user.satisfaction?.comment ?? ''}
          />
          <p className="support-note">
            Tu respuesta no es anónima: tu mentor y administración pueden verla en esta demostración
            local.
          </p>
          <div className="actions">
            <button className="action">
              {user.satisfaction ? 'Actualizar mi opinión' : 'Enviar mi opinión'}
            </button>
            <Link to="/resultados">Volver a mis resultados</Link>
          </div>
        </form>
        <aside className="aside">
          <img src="/images/learn.webp" alt="" />
          <h3>Lo que viviste importa.</h3>
          <p>
            Una observación concreta nos ayuda a mejorar el contenido y el acompañamiento. No
            necesitas una valoración positiva para terminar.
          </p>
        </aside>
      </div>
    </>
  );
}
