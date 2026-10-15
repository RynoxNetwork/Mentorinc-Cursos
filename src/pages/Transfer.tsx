import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readBackup } from '../transfer';
import { useStore } from '../store';
import { STORE_KEY } from '../model';
import { Field, download } from '../ui';
export function DataImport() {
  const { state, restore } = useStore(),
    navigate = useNavigate();
  const [copy, setCopy] = useState<ReturnType<typeof readBackup> | null>(null),
    [error, setError] = useState(''),
    [confirmation, setConfirmation] = useState('');
  async function choose(file?: File) {
    setCopy(null);
    setError('');
    setConfirmation('');
    if (!file) return;
    try {
      if (file.size > 7_000_000) throw new Error('El archivo supera 7 MB.');
      setCopy(readBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos leer la copia.');
    }
  }
  return (
    <section className="section-spaced">
      <h2>Restaurar una copia</h2>
      <p>
        Importa el JSON exportado por Impulso. Primero se valida; tus datos actuales no cambian al
        seleccionar el archivo.
      </p>
      <label htmlFor="backup">Archivo de respaldo JSON</label>
      <input
        id="backup"
        type="file"
        accept=".json,application/json"
        onChange={(e) => void choose(e.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {copy && (
        <div className="notice">
          <h3>Copia lista para revisar</h3>
          <p>
            {copy.users.length} personas · {copy.purchases.length} compras ·{' '}
            {copy.submissions.length} actividades · {copy.tickets.length} solicitudes.
          </p>
          <p>
            La restauración reemplaza esta copia del navegador y cierra la sesión. Antes se
            descargará el respaldo actual.
          </p>
          <Field
            label="Escribe RESTAURAR para confirmar"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <button
            className="action"
            disabled={confirmation !== 'RESTAURAR'}
            onClick={() => {
              download(
                `mentorinc-antes-de-importar-${Date.now()}.json`,
                localStorage.getItem(STORE_KEY) || JSON.stringify(state),
                'application/json',
              );
              if (restore(copy)) {
                setCopy(null);
                navigate('/acceso');
              }
            }}
          >
            Descargar respaldo y restaurar
          </button>
        </div>
      )}
    </section>
  );
}
