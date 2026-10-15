import { areas, deltaLabel, experienceLabels } from './insights';
import { dateLabel, type Person } from './model';

export function RatingScale({
  name,
  question,
  value,
  onChange,
  low = 'Quiero fortalecerlo',
  high = 'Me siento seguro',
}: {
  name: string;
  question: string;
  value: number;
  onChange: (value: number) => void;
  low?: string;
  high?: string;
}) {
  return (
    <fieldset className="diagnostic-question">
      <legend>{question}</legend>
      <div className="rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n}>
            <input
              type="radio"
              name={name}
              value={n}
              required
              checked={value === n}
              onChange={() => onChange(n)}
            />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <div className="range-labels">
        <span>1 · {low}</span>
        <span>5 · {high}</span>
      </div>
    </fieldset>
  );
}
export function Comparison({ user }: { user: Person }) {
  const initial = user.initialAssessment,
    final = user.finalAssessment;
  return (
    <section className="comparison" aria-label={`Comparación de ${user.name}`}>
      <h2>De tu punto de partida a hoy</h2>
      <p className="soft">
        Autoevaluación orientativa de 1 a 5. No es una nota académica ni una evaluación clínica.
      </p>
      {!initial ? (
        <p className="empty-inline">La medición inicial todavía está pendiente.</p>
      ) : (
        <>
          <div className="comparison-dates">
            <p>
              <strong>Inicial</strong>
              <span>
                {initial.date ? dateLabel(initial.date) : 'Registro anterior · fecha no disponible'}
              </span>
            </p>
            <p>
              <strong>Final</strong>
              <span>{final?.date ? dateLabel(final.date) : 'Pendiente'}</span>
            </p>
          </div>
          {initial.source === 'anterior' && (
            <p className="support-note">
              Conservamos el último diagnóstico de la versión anterior como referencia. No podemos
              reconstruir respuestas previas ni su fecha original.
            </p>
          )}
          <div className="comparison-legend">
            <span>
              <i className="initial-dot" /> Inicial
            </span>
            <span>
              <i className="final-dot" /> Final
            </span>
          </div>
          {areas.map((name, i) => (
            <div className="comparison-row" key={name}>
              <div className="comparison-title">
                <h3>{name}</h3>
                <span>
                  {final
                    ? `${deltaLabel(final.values[i] - initial.values[i])} ${Math.abs(final.values[i] - initial.values[i]) === 1 ? 'punto' : 'puntos'}`
                    : 'Sin comparación aún'}
                </span>
              </div>
              <div className="score-track">
                <span
                  className="score-fill initial"
                  style={{ width: `${initial.values[i] * 20}%` }}
                />
                <b>{initial.values[i]}/5 inicial</b>
              </div>
              <div className={`score-track ${final ? '' : 'score-pending'}`}>
                <span
                  className="score-fill final"
                  style={{ width: `${(final?.values[i] ?? 0) * 20}%` }}
                />
                <b>{final ? `${final.values[i]}/5 final` : 'Final pendiente'}</b>
              </div>
            </div>
          ))}
          <div className="reflection">
            <h3>Objetivo al comenzar</h3>
            <p className="preserve">{initial.goal || 'No registrado en la versión anterior.'}</p>
          </div>
          {final && (
            <div className="reflection">
              <h3>Lo que se lleva del recorrido</h3>
              <p className="preserve">{final.reflection}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function ContextSummary({ user }: { user: Person }) {
  return (
    <section className="context-summary">
      <h3>Contexto comercial</h3>
      {user.onboarding ? (
        <dl>
          <dt>Experiencia</dt>
          <dd>{experienceLabels[user.onboarding.experience]}</dd>
          <dt>Qué vende y a quién</dt>
          <dd className="preserve">{user.onboarding.context}</dd>
          <dt>Su forma de vender</dt>
          <dd className="preserve">{user.onboarding.style}</dd>
          <dt>Objetivo actual</dt>
          <dd className="preserve">{user.goal || 'Pendiente de definir.'}</dd>
        </dl>
      ) : (
        <p className="soft">
          Todavía no ha completado su experiencia, contexto y estilo comercial.
        </p>
      )}
    </section>
  );
}
