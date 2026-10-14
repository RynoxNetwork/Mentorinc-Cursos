import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { State, STORE_KEY, type AppState } from './model';
import { createSeed } from './seed';
import { execute, type Command } from './domain';

type Store = {
  state: AppState;
  user: AppState['users'][number] | undefined;
  error: string;
  message: string;
  run: (c: Command, message?: string) => boolean;
  clear: () => void;
  reset: () => void;
};
const Context = createContext<Store | null>(null);
export function loadState(storage: Pick<Storage, 'getItem'>): { state: AppState; error: string } {
  try {
    const raw = storage.getItem(STORE_KEY);
    return { state: raw ? State.parse(JSON.parse(raw)) : createSeed(), error: '' };
  } catch {
    return {
      state: createSeed(),
      error:
        'Los datos guardados no se pudieron abrir. Estás viendo una muestra temporal. Puedes exportar el archivo original desde Ajustes antes de restablecer.',
    };
  }
}
export function Provider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadState({ getItem: (key) => localStorage.getItem(key) }));
  const [state, setState] = useState(initial.state);
  const [error, setError] = useState(initial.error);
  const [message, setMessage] = useState('');
  const [storageHealthy, setStorageHealthy] = useState(!initial.error);
  function run(command: Command, success = 'Cambios guardados') {
    try {
      if (!storageHealthy)
        throw new Error(
          'Exporta el almacenamiento original desde Ajustes y restablece los datos antes de guardar cambios.',
        );
      const next = execute(state, command);
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      setState(next);
      setError('');
      setMessage(success);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === 'ZodError'
            ? 'Revisa los campos: hay valores incompletos o fuera de rango.'
            : e.name === 'QuotaExceededError'
              ? 'El navegador no tiene espacio para guardar. Exporta tus datos desde Ajustes y reduce el tamaño del adjunto.'
              : e.message
          : 'No pudimos guardar los cambios.',
      );
      setMessage('');
      return false;
    }
  }
  function reset() {
    try {
      const next = createSeed();
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      setState(next);
      setStorageHealthy(true);
      setError('');
      setMessage('Se restauraron los datos de muestra.');
    } catch {
      setError('No se pudo guardar. Revisa el espacio disponible en el navegador.');
    }
  }
  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key === STORE_KEY) {
        const next = loadState(localStorage);
        setState(next.state);
        setStorageHealthy(!next.error);
        setError(next.error);
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <Context
      value={{
        state,
        user: state.users.find((u) => u.id === state.session && u.active),
        error,
        message,
        run,
        clear: () => {
          setError('');
          setMessage('');
        },
        reset,
      }}
    >
      {children}
    </Context>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error('Provider requerido');
  return value;
}
