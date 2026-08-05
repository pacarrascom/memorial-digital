'use server';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';

type GeneratePdfResult =
  | { success: true; pdfBase64: string; fileName: string }
  | { success: false; error: string };

export async function generateQrPdf(memorialId: string): Promise<GeneratePdfResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No hay una sesión activa.' };
  }

  const { data: hasPermission, error: permError } = await supabase.rpc('has_memorial_role', {
    p_memorial_id: memorialId,
    p_roles: ['admin_familiar', 'colaborador_familiar'],
  });

  const { data: hasOrgPermission } = await supabase.rpc('has_organization_role', {
    p_memorial_id: memorialId,
    p_roles: ['funeraria'],
  });

  if (permError || (!hasPermission && !hasOrgPermission)) {
    return { success: false, error: 'No tienes permiso para exportar el QR de este memorial.' };
  }

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('png_path, public_url, short_code')
    .eq('memorial_id', memorialId)
    .maybeSingle();

  if (!qrCode) {
    return { success: false, error: 'Primero genera el código QR antes de exportar el PDF.' };
  }

  const { data: person } = await supabase
    .from('person_profile')
    .select('full_name, birth_date, death_date')
    .eq('memorial_id', memorialId)
    .maybeSingle();

  if (!person) {
    return { success: false, error: 'No se encontró la información de la persona.' };
  }

  let pngBytes: ArrayBuffer;
  try {
    const pngResponse = await fetch(qrCode.png_path);
    if (!pngResponse.ok) {
      throw new Error(`status ${pngResponse.status}`);
    }
    pngBytes = await pngResponse.arrayBuffer();
  } catch (err) {
    console.error('Error descargando PNG del QR:', err);
    return { success: false, error: 'No se pudo obtener la imagen del QR.' };
  }

  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;
  const dateRange = birthYear && deathYear ? `${birthYear} - ${deathYear}` : '';

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([297.64, 419.53]); // A6: 105mm x 148mm
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const qrImage = await pdfDoc.embedPng(pngBytes);

  const ink = rgb(0.11, 0.11, 0.09);
  const inkLight = rgb(0.36, 0.35, 0.33);

  page.drawText('DORSERA MEMORIAL', {
    x: width / 2 - fontRegular.widthOfTextAtSize('DORSERA MEMORIAL', 8) / 2,
    y: height - 30,
    size: 8,
    font: fontRegular,
    color: inkLight,
  });

  const nameSize = person.full_name.length > 22 ? 16 : 20;
  page.drawText(person.full_name, {
    x: width / 2 - fontBold.widthOfTextAtSize(person.full_name, nameSize) / 2,
    y: height - 60,
    size: nameSize,
    font: fontBold,
    color: ink,
  });

  if (dateRange) {
    page.drawText(dateRange, {
      x: width / 2 - fontRegular.widthOfTextAtSize(dateRange, 11) / 2,
      y: height - 78,
      size: 11,
      font: fontRegular,
      color: inkLight,
    });
  }

  const qrSize = 160;
  page.drawImage(qrImage, {
    x: width / 2 - qrSize / 2,
    y: height / 2 - qrSize / 2 - 10,
    width: qrSize,
    height: qrSize,
  });

  const instruction = 'Escanea para visitar el memorial digital';
  page.drawText(instruction, {
    x: width / 2 - fontRegular.widthOfTextAtSize(instruction, 9) / 2,
    y: 55,
    size: 9,
    font: fontRegular,
    color: inkLight,
  });

  const urlText = qrCode.public_url.replace(/^https?:\/\//, '');
  page.drawText(urlText, {
    x: width / 2 - fontRegular.widthOfTextAtSize(urlText, 8) / 2,
    y: 38,
    size: 8,
    font: fontRegular,
    color: inkLight,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  const safeSlug = person.full_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    success: true,
    pdfBase64,
    fileName: `qr-${safeSlug || 'memorial'}.pdf`,
  };
}
