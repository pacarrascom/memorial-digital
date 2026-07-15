// Supabase Edge Function: generate-qr
// Genera URL pública, slug corto y archivos PNG/SVG/PDF para un memorial,
// y guarda los resultados en la tabla qr_codes.
//
// Invocación: POST /functions/v1/generate-qr  { "memorial_id": "uuid" }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLIC_BASE_URL = Deno.env.get('PUBLIC_BASE_URL') ?? 'https://dorsera.com';

function generateShortCode(): string {
  // Formato: DM-XXXX (base36, fácil de leer e imprimir en placas físicas)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (O/0, I/1)
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `DM-${code}`;
}

serve(async (req) => {
  try {
    const { memorial_id } = await req.json();
    if (!memorial_id) {
      return new Response(JSON.stringify({ error: 'memorial_id es requerido' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, slug')
      .eq('id', memorial_id)
      .single();

    if (memorialError || !memorial) {
      return new Response(JSON.stringify({ error: 'Memorial no encontrado' }), { status: 404 });
    }

    const publicUrl = `${PUBLIC_BASE_URL}/m/${memorial.slug}`;
    const shortCode = generateShortCode();

    // Genera el QR en SVG y PNG (buffer) usando la librería qrcode
    const svgString = await QRCode.toString(publicUrl, { type: 'svg', margin: 2 });
    const pngBuffer = await QRCode.toBuffer(publicUrl, {
      type: 'png',
      margin: 2,
      width: 1024, // alta resolución para impresión física en placas/lápidas
    });

    const svgPath = `qr/${memorial.id}/qr.svg`;
    const pngPath = `qr/${memorial.id}/qr.png`;

    await supabase.storage.from('memorial-assets').upload(svgPath, new Blob([svgString]), {
      contentType: 'image/svg+xml',
      upsert: true,
    });
    await supabase.storage.from('memorial-assets').upload(pngPath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

    // El PDF de alta resolución se genera en un paso posterior (job asíncrono)
    // que compone el PNG dentro de una plantilla imprimible A4/A6; aquí solo
    // se registra el placeholder para no bloquear la respuesta al usuario.
    const pdfPath = `qr/${memorial.id}/qr.pdf`;

    const { data: qrRecord, error: upsertError } = await supabase
      .from('qr_codes')
      .upsert(
        {
          memorial_id: memorial.id,
          public_url: publicUrl,
          short_code: shortCode,
          svg_path: svgPath,
          png_path: pngPath,
          pdf_path: pdfPath,
        },
        { onConflict: 'memorial_id' }
      )
      .select()
      .single();

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data: qrRecord }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
