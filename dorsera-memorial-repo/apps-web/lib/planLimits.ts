// Límites del plan gratuito. Fuente única — antes estaban duplicados como
// literales sueltos en GalleryUploadForm.tsx, lib/actions/uploadPhoto.ts y
// app/admin/memorials/[id]/timeline/page.tsx. Un memorial con el
// entitlement correspondiente en true (memorial_entitlements) no está
// sujeto a estos límites.
export const FREE_PHOTO_LIMIT = 10
export const FREE_TIMELINE_LIMIT = 5
