'use client';
 
import { useState } from 'react';
 
export function ShareQrSection({
  pngUrl,
  publicUrl,
}: {
  pngUrl: string;
  publicUrl: string;
}) {
  const [copied, setCopied] = useState(false);
 
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silenciosamente ignorado — el navegador puede bloquear el portapapeles
    }
  }
 
  return (
    <section className="border-t border-ash px-8 py-10 md:px-16">
      <h2 className="mb-4 text-2xl font-display text-ink-900 dark:text-stone-50">
        Comparte este memorial
      </h2>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <img
          src={pngUrl}
          alt="Código QR de este memorial"
          className="h-28 w-28 rounded-lg border border-stone-300"
        />
        <div className="flex flex-wrap gap-3">
          <a
            href={pngUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-stone-100"
          >
            Descargar QR
          </a>
          <button
            onClick={handleCopyLink}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-stone-100"
          >
            {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </section>
  );
}
