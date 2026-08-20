'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { bulkCreateMemorialsForOrg, type BulkMemorialRow, type BulkResult } from '@/lib/actions/bulk-memorials';

const TEMPLATE_CSV = 'full_name,birth_date,death_date,birth_place,biography,family_contact_name,family_contact_email,family_contact_phone\nMaría González,1945-03-12,2024-01-08,Santiago,Una vida dedicada a su familia,Juan Pérez,juan@correo.com,+56912345678\n';

export function BulkMemorialUpload({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [rows, setRows] = useState<BulkMemorialRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleDownloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-memoriales.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setResults(null);

    Papa.parse<BulkMemorialRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (parsed) => {
        if (parsed.errors.length > 0) {
          setParseError(`Error al leer el archivo: ${parsed.errors[0].message}`);
          setRows([]);
          return;
        }

        const cleaned = parsed.data
          .map((row) => ({
            full_name: String(row.full_name || '').trim(),
            birth_date: String(row.birth_date || '').trim(),
            death_date: String(row.death_date || '').trim(),
            birth_place: String(row.birth_place || '').trim(),
            biography: String(row.biography || '').trim(),
            family_contact_name: String(row.family_contact_name || '').trim(),
            family_contact_email: String(row.family_contact_email || '').trim(),
            family_contact_phone: String(row.family_contact_phone || '').trim(),
          }))
          .filter((row) => row.full_name);

        if (cleaned.length === 0) {
          setParseError('El archivo no tiene filas válidas. Verifica que incluya la columna "full_name".');
          setRows([]);
          return;
        }

        setRows(cleaned);
      },
      error: (err) => {
        setParseError(`Error al leer el archivo: ${err.message}`);
      },
    });
  }

  function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    bulkCreateMemorialsForOrg(organizationId, rows).then((res) => {
      setIsSubmitting(false);
      if (res.error) {
        setSubmitError(res.error);
        return;
      }
      setResults(res.results ?? []);
    });
  }

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failureCount = results ? results.length - successCount : 0;

  return (
    <div className="space-y-6">
      {!results && (
        <>
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center">
            <p className="mb-3 text-sm text-ink-600">
              Sube un archivo CSV con una fila por memorial.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="mb-4 text-sm text-ink-500 underline hover:text-ink-700"
            >
              Descargar plantilla CSV
            </button>
            <div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="mx-auto block text-sm text-ink-600"
              />
            </div>
            {fileName && <p className="mt-2 text-xs text-ink-400">{fileName}</p>}
          </div>

          {parseError && (
            <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
              {parseError}
            </div>
          )}

          {rows.length > 0 && !parseError && (
            <div className="space-y-4">
              <p className="text-sm text-ink-700">
                Se detectaron <strong>{rows.length}</strong> memoriales para crear en {organizationName}.
              </p>

              <div className="max-h-80 overflow-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-ink-500">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Nacimiento</th>
                      <th className="px-3 py-2">Fallecimiento</th>
                      <th className="px-3 py-2">Lugar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        <td className="px-3 py-2 text-ink-900">{row.full_name}</td>
                        <td className="px-3 py-2 text-ink-500">{row.birth_date || '—'}</td>
                        <td className="px-3 py-2 text-ink-500">{row.death_date || '—'}</td>
                        <td className="px-3 py-2 text-ink-500">{row.birth_place || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {submitError && (
                <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creando memoriales...' : `Crear ${rows.length} memoriales`}
              </button>
            </div>
          )}
        </>
      )}

      {results && (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-ink-900">
              <strong className="text-moss-800">{successCount} creados</strong>
              {failureCount > 0 && (
                <>
                  {' · '}
                  <strong className="text-flame-600">{failureCount} con errores</strong>
                </>
              )}
            </p>
          </div>

          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.row_index}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  r.success ? 'border-stone-200 bg-white' : 'border-flame-200 bg-flame-50'
                }`}
              >
                {r.success ? (
                  <span className="text-ink-700">
                    Fila {r.row_index}: <strong>{r.slug}</strong> creado correctamente
                  </span>
                ) : (
                  <span className="text-flame-700">
                    Fila {r.row_index}: {r.error_message}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <Link
            href="/admin"
            className="inline-block rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-700"
          >
            Volver al panel
          </Link>
        </div>
      )}
    </div>
  );
}
