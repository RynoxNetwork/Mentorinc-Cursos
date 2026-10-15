import { useState } from 'react';
import { Download } from 'lucide-react';
import { useStore } from '../store';
import { dateLabel, progress } from '../model';
import { deltaLabel, numberLabel, resultsCsv, summarize } from '../insights';
import { Comparison, ContextSummary } from '../measurement-ui';
import { Heading, Select, Field, Empty, download } from '../ui';

export default function Reports() {
  const { state, user } = useStore();
  const [mentorId, setMentorId] = useState('all');
  const [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  if (!user || !['mentor', 'admin'].includes(user.role))
    return <Empty title="Los resultados de equipo corresponden a mentoría y administración" />;
  const students = state.users.filter(
    (u) =>
      u.role === 'alumno' &&
      (user.role === 'mentor'
        ? u.mentorId === user.id
        : mentorId === 'all' || u.mentorId === mentorId),
  );
  const invalid = !!from && !!to && from > to;
  const period = { from, to },
    summary = summarize(state, students, period),
    balance = summary.balance;
  return (
    <>
      <Heading
        title="Resultados que acompañan"
        action={
          <button
            className="action secondary"
            disabled={invalid || !students.length}
            onClick={() =>
              download(
                'mentorinc-resultados.csv',
                resultsCsv(state, students, period),
                'text/csv;charset=utf-8',
              )
            }
          >
            <Download size={18} />
            Exportar resultados
          </button>
        }
      >
        {user.role === 'mentor'
          ? 'Alumnos actualmente asignados a ti, incluidos los inactivos.'
          : 'Comparación, satisfacción y uso de mentoría de los alumnos, incluidos los inactivos.'}{' '}
        Datos de este navegador.
      </Heading>
      <div className="report-filters">
        {user.role === 'admin' && (
          <Select
            label="Mentor actual"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
          >
            <option value="all">Todos los mentores</option>
            <option value="">Sin mentor</option>
            {state.users
              .filter((u) => u.role === 'mentor')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        )}
        <Field
          label="Desde (Lima)"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field
          label="Hasta (Lima)"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
        />
        <button
          className="quiet"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Todo el historial
        </button>
      </div>
      {invalid ? (
        <p className="notice error" role="alert">
          La fecha inicial no puede ser posterior a la final.
        </p>
      ) : (
        <>
          <p className="support-note">
            {from || to
              ? `Periodo: ${from || 'sin inicio'} a ${to || 'sin fin'}.`
              : 'Periodo: todo el historial.'}{' '}
            El filtro usa la fecha de evaluación final, la última actualización de la encuesta y la
            fecha programada de la sesión. Las fichas individuales conservan el historial completo.
          </p>
          <div className="overview results-overview">
            <div>
              <strong>{summary.paired.length}</strong>
              <span>
                {summary.paired.length === 1 ? 'comparación' : 'comparaciones'} en el periodo
              </span>
            </div>
            <div>
              <strong>{deltaLabel(summary.delta)}</strong>
              <span>puntos de cambio medio · escala 1–5</span>
            </div>
            <div>
              <strong>
                {numberLabel(summary.overall)}
                {summary.overall !== null && <small>/5</small>}
              </strong>
              <span>
                satisfacción · {summary.respondents.length}{' '}
                {summary.respondents.length === 1 ? 'respuesta' : 'respuestas'} en el periodo
              </span>
            </div>
          </div>
          <div className="report-pair">
            <section className="report-panel">
              <h2>Cómo cambia la autoevaluación</h2>
              <p className="soft">
                Solo se comparan alumnos con ambas mediciones; no se rellenan respuestas pendientes.
              </p>
              {summary.paired.length ? (
                <div className="area-summary">
                  {summary.areas.map((a) => (
                    <div key={a.name}>
                      <strong>{a.name}</strong>
                      <span>
                        {numberLabel(a.initial)} → {numberLabel(a.final)}
                      </span>
                      <b>{deltaLabel(a.delta)} pts</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-inline">
                  Aún no hay comparaciones en este periodo. Aparecerán cuando un alumno guarde su
                  evaluación final.
                </p>
              )}
              <p className="support-note">
                Promedio por área y diferencia final − inicial. Autoevaluación orientativa, no una
                medida validada de desempeño.
              </p>
            </section>
            <section className="report-panel">
              <h2>La experiencia del alumno</h2>
              <div className="survey-summary">
                <p>
                  <span>Utilidad del aprendizaje</span>
                  <strong>{numberLabel(summary.learning)} / 5</strong>
                </p>
                <p>
                  <span>Sesiones de mentoría</span>
                  <strong>{numberLabel(summary.mentoring)} / 5</strong>
                </p>
              </div>
              <p className="soft">
                Encuestas en el periodo: {summary.respondents.length}. Con valoración de mentoría:{' '}
                {summary.mentoringResponses}.
              </p>
              <p className="support-note">
                Alumnos con evaluación final en todo el historial: {summary.eligible.length}. Con
                encuesta: {summary.eligible.filter((u) => u.satisfaction).length}. Se cuenta la
                última respuesta de cada alumno. Sin respuestas se muestra «—».
              </p>
            </section>
          </div>
          <section className="section-spaced">
            <h2>Uso de mentoría</h2>
            <p className="soft">
              Saldo actual de compras con pago confirmado y acceso aprobado. No cambia con el filtro
              de fechas.
            </p>
            <div className="balance-grid">
              {[
                [balance.acquired, 'Cupos habilitados'],
                [balance.reserved, 'Reservados'],
                [balance.attended, 'Realizados'],
                [balance.available, 'Disponibles'],
              ].map(([n, label]) => (
                <div key={label}>
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="support-note">
              Utilización:{' '}
              {balance.acquired
                ? `${numberLabel((balance.attended / balance.acquired) * 100)}% (${balance.attended}/${balance.acquired} cupos realizados)`
                : 'sin cupos habilitados'}
              . Cancelar libera el cupo; reprogramar conserva la misma reserva. Las compras
              reembolsadas o sin aprobación no aportan saldo.
            </p>
            <div className="activity-strip">
              <h3>Sesiones programadas en el periodo</h3>
              <p>
                {summary.activity.total} reservas: {summary.activity.reserved} confirmadas ·{' '}
                {summary.activity.attended} realizadas · {summary.activity.cancelled} canceladas.
              </p>
              <p>
                {summary.activity.minutes} minutos realizados. Incluye el historial de compras
                reembolsadas.
              </p>
            </div>
          </section>
          <section className="section-spaced">
            <div className="section-title">
              <h2>El detalle de cada recorrido</h2>
              <span className="soft">{students.length} alumnos</span>
            </div>
            {students.map((student) => (
              <details className="learner-report" key={student.id}>
                <summary>
                  <div>
                    <h3>{student.name}</h3>
                    <span className="soft">
                      {progress(state, student)}% de lecciones ·{' '}
                      {student.finalAssessment
                        ? 'Evaluación final guardada'
                        : 'Evaluación final pendiente'}
                      {!student.active && ' · Inactivo'}
                    </span>
                  </div>
                  <span aria-hidden="true">+</span>
                </summary>
                <div className="learner-report-body">
                  <Comparison user={student} />
                  <div>
                    <ContextSummary user={student} />
                    <section className="reflection">
                      <h3>Su opinión</h3>
                      {student.satisfaction ? (
                        <>
                          <p>
                            General: {student.satisfaction.overall}/5 · Utilidad:{' '}
                            {student.satisfaction.learning}/5
                          </p>
                          <p>
                            Mentoría:{' '}
                            {student.satisfaction.mentoring === null
                              ? 'No aplica'
                              : `${student.satisfaction.mentoring}/5`}
                          </p>
                          <p className="preserve">
                            {student.satisfaction.comment || 'Sin comentario adicional.'}
                          </p>
                          <p className="soft">
                            Actualizada: {dateLabel(student.satisfaction.updatedAt)}
                          </p>
                        </>
                      ) : (
                        <p className="soft">Todavía no ha respondido la encuesta.</p>
                      )}
                    </section>
                  </div>
                </div>
              </details>
            ))}
            {!students.length && <p className="empty-inline">No hay alumnos en esta selección.</p>}
          </section>
        </>
      )}
    </>
  );
}
