import {
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useStore } from './store';
import { activeAccess } from './model';

export function Heading({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {children && <p className="soft">{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function ButtonLink({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`action ${secondary ? 'secondary' : ''}`} to={to}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
    </div>
  );
}
export function Area({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} {...props} />
    </div>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        {children}
      </select>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <img src="/images/progress.webp" alt="" />
      <h2>{title}</h2>
      <p className="soft">{children}</p>
      {action}
    </div>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name
        .split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function Access({ children }: { children: ReactNode }) {
  const { state, user } = useStore();
  if (!user)
    return (
      <Empty
        title="Tu próxima etapa empieza aquí"
        action={<ButtonLink to="/acceso">Entrar a mi cuenta</ButtonLink>}
      />
    );
  if (user.role !== 'alumno')
    return (
      <Empty
        title="Este es el espacio del alumno"
        action={<ButtonLink to="/">Volver a mi espacio</ButtonLink>}
      />
    );
  if (!user.verified)
    return (
      <Empty
        title="Confirma tu correo"
        action={<ButtonLink to="/correo">Revisar correo de prueba</ButtonLink>}
      >
        Te falta un paso para comenzar.
      </Empty>
    );
  if (!activeAccess(state, user.id))
    return (
      <div className="empty">
        <LockKeyhole size={32} />
        <h2>Tu aula te está esperando</h2>
        <p>
          El acceso se habilita cuando el pago está confirmado y Mentorinc aprueba tu solicitud.
        </p>
        <ButtonLink to="/compras">Revisar mi acceso</ButtonLink>
        <Link to="/soporte">Solicitar ayuda con el acceso</Link>
      </div>
    );
  return <>{children}</>;
}
export function download(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function getText(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) || '');
}
