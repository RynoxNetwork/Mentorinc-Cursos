import { Help, Policies, ProgramDetail, Practice } from './pages/Experience';
const Support = lazy(() => import('./pages/Support'));
const Operations = lazy(() =>
  import('./pages/Operations').then((m) => ({ default: m.Operations })),
);
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Bell, ChevronDown, Menu, X, LogOut } from 'lucide-react';
import { useStore } from './store';
import { Avatar, Empty, ButtonLink } from './ui';
import {
  Home,
  Programs,
  Auth,
  Mailbox,
  Account,
  Purchases,
  Notices,
  Settings,
  About,
} from './pages/General';
import { RoutePage, LessonPage } from './pages/Learning';
import { Agenda } from './pages/Agenda';
import { Consultations } from './pages/Consultations';
import { Diagnostic, Results, FinalAssessment, SatisfactionPage } from './pages/Development';
const Reports = lazy(() => import('./pages/Reports'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Mentor = lazy(() => import('./pages/Mentor'));
const Admin = lazy(() => import('./pages/Admin'));

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty">
        <h1>No pudimos abrir esta vista</h1>
        <p>Tus datos locales siguen guardados. Recarga para volver a intentarlo.</p>
        <button className="action" onClick={() => location.reload()}>
          Recargar
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Protected({ roles }: { roles?: string[] }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/acceso" replace />;
  if (roles && !roles.includes(user.role))
    return (
      <Empty
        title="Este espacio corresponde a otro rol"
        action={<ButtonLink to="/">Volver al inicio</ButtonLink>}
      />
    );
  return <Outlet />;
}
function Layout() {
  const { state, user, run, error, message, clear } = useStore();
  const [menu, setMenu] = useState(false),
    [account, setAccount] = useState(false);
  const loc = useLocation(),
    navigate = useNavigate();
  const toggle = useRef<HTMLButtonElement>(null),
    profile = useRef<HTMLButtonElement>(null),
    region = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setMenu(false);
    setAccount(false);
    clear();
    window.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  }, [loc.pathname]);
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (account) {
          setAccount(false);
          profile.current?.focus();
        } else if (menu) {
          setMenu(false);
          toggle.current?.focus();
        }
      }
    }
    function click(e: PointerEvent) {
      if (region.current && !region.current.contains(e.target as Node)) setAccount(false);
    }
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', click);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', click);
    };
  }, [menu, account]);
  const links =
    user?.role === 'admin'
      ? [
          ['/', 'Resumen'],
          ['/admin/resultados', 'Resultados'],
          ['/admin/compras', 'Compras y accesos'],
          ['/admin/personas', 'Personas'],
          ['/admin/contenido', 'Contenido'],
          ['/admin/programas', 'Programas'],
          ['/soporte', 'Soporte'],
          ['/operacion', 'Operación'],
        ]
      : user?.role === 'mentor'
        ? [
            ['/', 'Mis alumnos'],
            ['/mentor/resultados', 'Resultados'],
            ['/mentor/entregas', 'Entregas'],
            ['/agenda', 'Agenda'],
            ['/consultas', 'Consultas'],
          ]
        : user
          ? [
              ['/', 'Inicio'],
              ['/ruta', 'Mi ruta'],
              ['/resultados', 'Mi avance'],
              ['/practica', 'Práctica'],
              ['/agenda', 'Agenda'],
              ['/consultas', 'Mi mentor'],
              ['/programas', 'Programas'],
            ]
          : [
              ['/', 'Inicio'],
              ['/programas', 'Programas'],
              ['/modelo', 'Nuestro modelo'],
            ];
  const unseen = state.notices.filter((n) => n.userId === user?.id && !n.read).length;
  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <div className="demo-bar">
        <span>Vista de prueba · datos y precios de ejemplo · sin cobros</span>
        <Link to="/ajustes">Datos locales</Link>
      </div>
      <div className="app-shell">
        <header className="top">
          <Link to="/" className="brand" aria-label="Mentorinc, inicio">
            <img src="/images/mentorinc-logo.png" alt="Mentorinc" width="149" />
          </Link>
          <div className="top-actions">
            {user && (
              <Link
                className="icon-button notification"
                to="/notificaciones"
                aria-label={`Notificaciones, ${unseen} sin leer`}
              >
                <Bell size={21} />
                {unseen > 0 && <span>{unseen}</span>}
              </Link>
            )}
            <div className="profile" ref={region}>
              <button
                className="profile-toggle"
                aria-label={user?.name.split(' ')[0] || 'Mi cuenta'}
                ref={profile}
                aria-expanded={account}
                aria-controls="account-menu"
                onClick={() => {
                  setAccount(!account);
                  setMenu(false);
                }}
              >
                <Avatar name={user?.name || 'Invitado'} />
                <span className="profile-name">{user?.name.split(' ')[0] || 'Mi cuenta'}</span>
                <ChevronDown size={16} />
              </button>
              {account && (
                <div className="profile-menu" id="account-menu">
                  <strong>{user?.name || 'Bienvenido'}</strong>
                  {user && (
                    <span className="soft">
                      {user.role === 'admin'
                        ? 'Administración'
                        : user.role === 'mentor'
                          ? 'Mentor'
                          : 'Alumno'}
                    </span>
                  )}
                  <Link to={user ? '/cuenta' : '/acceso'}>
                    {user ? 'Mi cuenta' : 'Entrar a mi cuenta'}
                  </Link>
                  <Link to="/compras">Mis compras</Link>
                  <Link to="/correo">Correo de prueba</Link>
                  <Link to="/ayuda">Ayuda y soporte</Link>
                  <Link to="/notificaciones">Notificaciones</Link>
                  <div className="menu-divider" />
                  <span className="soft">Recorrer la demostración</span>
                  {state.users
                    .filter((u) => ['maria', 'ana', 'admin', 'diego'].includes(u.id) && u.active)
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          run({ type: 'demo', userId: u.id }, '');
                          setAccount(false);
                          navigate('/');
                        }}
                      >
                        {u.name} · {u.role}
                      </button>
                    ))}
                  {user && (
                    <button
                      onClick={() => {
                        run({ type: 'logout' }, '');
                        navigate('/acceso');
                        setAccount(false);
                      }}
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              className="menu-toggle icon-button"
              aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menu}
              aria-controls="main-nav"
              ref={toggle}
              onClick={() => {
                setMenu(!menu);
                setAccount(false);
              }}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
          <nav id="main-nav" aria-label="Principal" className={`navigation ${menu ? 'open' : ''}`}>
            {links.map(([to, label]) => (
              <NavLink end={to === '/'} className="nav-item" to={to} key={to}>
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main id="contenido" className="main" tabIndex={-1} ref={main}>
          {error && (
            <div className="notice error" role="alert">
              <span>{error}</span>
              <button onClick={clear} aria-label="Cerrar aviso">
                <X size={18} />
              </button>
            </div>
          )}
          <Suspense fallback={<p role="status">Abriendo tu espacio…</p>}>
            <div className="page" key={loc.pathname}>
              <Outlet />
            </div>
          </Suspense>
        </main>
        <footer className="bottom">
          <span>Mentorinc · Crecer desde quien eres.</span>
          <div>
            <Link to="/modelo">Nuestro modelo</Link>
            <Link to="/ayuda">Ayuda</Link>
            <Link to="/politicas/privacidad">Privacidad</Link>
            <Link to="/politicas/compra">Condiciones</Link>
            <Link to="/politicas/devoluciones">Devoluciones</Link>
            <Link to="/ajustes">Datos locales</Link>
          </div>
        </footer>
      </div>
      {message && (
        <div className="toast" role="status">
          {message}
          <button onClick={clear} aria-label="Cerrar notificación">
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function Start() {
  const { user } = useStore();
  return user?.role === 'mentor' ? <Mentor /> : user?.role === 'admin' ? <Admin /> : <Home />;
}
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Start />} />
        <Route path="programas" element={<Programs />} />
        <Route path="programas/:id" element={<ProgramDetail />} />
        <Route path="ayuda" element={<Help />} />
        <Route path="politicas/:kind" element={<Policies />} />
        <Route path="soporte/:id?" element={<Support />} />
        <Route path="modelo" element={<About />} />
        <Route path="acceso" element={<Auth />} />
        <Route path="registro" element={<Auth register />} />
        <Route path="recuperar" element={<Auth recover />} />
        <Route path="correo" element={<Mailbox />} />
        <Route path="ajustes" element={<Settings />} />
        <Route element={<Protected />}>
          <Route path="cuenta" element={<Account />} />
          <Route path="diagnostico" element={<Diagnostic />} />
          <Route path="resultados" element={<Results />} />
          <Route path="evaluacion-final" element={<FinalAssessment />} />
          <Route path="satisfaccion" element={<SatisfactionPage />} />
          <Route path="compras" element={<Purchases />} />
          <Route path="notificaciones" element={<Notices />} />
          <Route path="recordatorios" element={<Reminders />} />
          <Route path="ruta" element={<RoutePage />} />
          <Route path="practica/:id?" element={<Practice />} />
          <Route path="leccion/:id" element={<LessonPage />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="consultas/:id?" element={<Consultations />} />
        </Route>
        <Route element={<Protected roles={['mentor']} />}>
          <Route path="mentor/resultados" element={<Reports />} />
          <Route path="mentor/:section?" element={<Mentor />} />
        </Route>
        <Route element={<Protected roles={['admin']} />}>
          <Route path="admin/resultados" element={<Reports />} />
          <Route path="operacion" element={<Operations />} />
          <Route path="admin/:section?" element={<Admin />} />
        </Route>
        <Route
          path="*"
          element={
            <Empty
              title="Este camino no existe"
              action={<ButtonLink to="/">Volver al inicio</ButtonLink>}
            >
              Revisa la dirección o regresa a tu espacio.
            </Empty>
          }
        />
      </Route>
    </Routes>
  );
}
