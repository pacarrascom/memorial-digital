import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
 
/**
* Recibe el ?code= que Supabase Auth agrega al enlace de confirmación
* de correo (o de un futuro login OAuth) y lo intercambia por una sesión.
* Si el usuario se registró como funeraria, dispara automáticamente
* la solicitud de cuenta institucional (queda pendiente de aprobación).
*/
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
 
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
 
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
 
      if (user?.user_metadata?.account_type === "funeraria") {
        const { error: orgError } = await supabase.rpc("request_organization", {
          p_name: user.user_metadata.funeraria_name ?? "",
          p_contact_email: user.user_metadata.funeraria_contact_email ?? null,
          p_rut: user.user_metadata.funeraria_rut ?? null,
          p_contact_phone: user.user_metadata.funeraria_contact_phone ?? null,
        });
 
        if (orgError) {
          console.error("Error creando solicitud de funeraria automática:", orgError);
        }
      }
 
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
 
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
