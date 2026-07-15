# Dorsera Memorial — API REST (v1)

Base URL: `https://api.dorsera.com/v1`
Autenticación: `Authorization: Bearer <jwt>` (Supabase Auth). Los endpoints públicos de lectura de memoriales `publico` no requieren token.

Todas las respuestas siguen el formato:
```json
{ "data": {...} | [...], "error": null }
```
En error:
```json
{ "data": null, "error": { "code": "string", "message": "string" } }
```

---

## Memoriales

### `GET /memorials/{slug}`
Obtiene un memorial público (o accesible por el usuario autenticado) con su perfil de persona.

**Respuesta 200**
```json
{
  "data": {
    "id": "uuid",
    "slug": "maria-elena-rojas",
    "visibility": "publico",
    "person_profile": {
      "full_name": "María Elena Rojas",
      "birth_date": "1948-03-12",
      "death_date": "2025-01-04",
      "biography": "...",
      "favorite_quotes": ["..."]
    }
  },
  "error": null
}
```

### `POST /memorials`
Crea un nuevo memorial. Requiere autenticación. Asigna automáticamente el rol `admin_familiar` al creador.

**Body**
```json
{ "slug": "maria-elena-rojas", "visibility": "publico", "organization_id": null }
```

### `PATCH /memorials/{id}`
Actualiza visibilidad, slug u organización. Requiere rol `admin_familiar` o `super_admin`.

### `DELETE /memorials/{id}`
Elimina un memorial (soft-delete recomendado a nivel de aplicación). Requiere `admin_familiar`.

---

## Perfil de la persona

### `PUT /memorials/{id}/profile`
Crea o actualiza el perfil biográfico completo (upsert). Requiere `admin_familiar` o `colaborador_familiar`.

```json
{
  "full_name": "María Elena Rojas",
  "birth_date": "1948-03-12",
  "death_date": "2025-01-04",
  "birth_place": "Loja, Ecuador",
  "biography": "...",
  "studies": "Magisterio",
  "profession": "Maestra",
  "hobbies": ["jardinería", "lectura"],
  "favorite_quotes": ["..."]
}
```

---

## Línea de tiempo

### `GET /memorials/{id}/timeline`
Lista eventos ordenados por `sort_order` / `event_date`.

### `POST /memorials/{id}/timeline`
Crea un evento.
```json
{ "event_date": "1970-06-01", "title": "Título universitario", "description": "...", "location": {"label": "Loja"} }
```

### `PATCH /memorials/{id}/timeline/{event_id}` · `DELETE /memorials/{id}/timeline/{event_id}`

---

## Galería / medios

### `POST /memorials/{id}/media`
Sube metadata de un archivo ya almacenado en Supabase Storage (el archivo se sube directo a Storage vía URL firmada; este endpoint registra el asset).
```json
{ "album_id": "uuid|null", "type": "foto", "storage_path": "memorials/{id}/photos/xyz.jpg", "caption": "..." }
```

### `GET /memorials/{id}/media?type=foto&album_id=...`

### `DELETE /memorials/{id}/media/{media_id}`

---

## Árbol genealógico

### `GET /memorials/{id}/family-tree`
Devuelve nodos + relaciones para renderizar el árbol.

### `POST /family-tree/nodes` · `POST /family-tree/relationships`

---

## Libro de recuerdos

### `GET /memorials/{id}/guestbook?status=aprobado`
Público solo ve `aprobado`. Familia ve todos los estados.

### `POST /memorials/{id}/guestbook`
Cualquier visitante (autenticado o con nombre de invitado) puede enviar. Entra como `pendiente`.
```json
{ "entry_type": "mensaje", "content": "La recordaremos siempre...", "author_display_name": "Ana Torres" }
```

### `PATCH /memorials/{id}/guestbook/{entry_id}/moderate`
```json
{ "moderation_status": "aprobado" }
```
Requiere `admin_familiar` o `colaborador_familiar`.

### `POST /memorials/{id}/reactions`
```json
{ "type": "vela", "guestbook_entry_id": "uuid|null" }
```

---

## Código QR

### `POST /memorials/{id}/qr/generate`
Genera (o regenera) el QR del memorial: URL, slug corto y archivos PNG/SVG/PDF. Dispara un `ai_job`-like job asíncrono en Edge Function `generate-qr`.

### `GET /memorials/{id}/qr`
Devuelve las URLs de descarga de los archivos generados.

---

## IA

### `POST /memorials/{id}/ai-jobs`
Encola un trabajo de IA.
```json
{ "job_type": "generar_biografia", "input": { "respuestas": {"...": "..."} } }
```

### `GET /memorials/{id}/ai-jobs/{job_id}`
Devuelve `status` (`en_cola` / `procesando` / `completado` / `fallido`) y `result`.

---

## Suscripciones / Planes

### `GET /memorials/{id}/subscription`
### `POST /memorials/{id}/subscription/upgrade`
```json
{ "plan": "premium_familiar" }
```

---

## Webhooks salientes (integración con Dorsera)

Dorsera Memorial emite eventos a las URLs configuradas por el ecosistema Dorsera:

| Evento | Payload relevante |
|---|---|
| `memorial.created` | `memorial_id`, `person_uuid` |
| `person_profile.updated` | `memorial_id`, `person_uuid`, campos modificados |
| `family_tree.node_created` | `node_id`, `person_uuid` |
| `media.added` | `memorial_id`, `media_asset_id`, `type` |

Cada payload incluye una firma HMAC en el header `X-Dorsera-Signature` para verificación.

---

## Códigos de error comunes

| Código | Significado |
|---|---|
| `unauthorized` | Token ausente o inválido |
| `forbidden` | Rol insuficiente para la operación (RLS rechaza la fila) |
| `not_found` | Recurso inexistente o no visible para el usuario |
| `plan_limit_reached` | Se alcanzó el límite del plan (fotos, almacenamiento) |
| `validation_error` | Body no cumple el esquema esperado |
