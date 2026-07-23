// Tipos derivados del esquema Postgres (migraciones 0001-0004).
// En un proyecto real, estos se generan con:
//   supabase gen types typescript --project-id <id> > types/database.ts
// Este archivo es la versión curada a mano para referencia y autocompletado
// mientras no exista aún la conexión al proyecto Supabase real.

export type MemorialVisibility = "public" | "private" | "unlisted";
export type MediaType = "photo" | "video" | "audio" | "letter" | "document";
export type TributeType = "message" | "candle" | "flower" | "prayer" | "reaction";
export type TributeStatus = "pending" | "approved" | "rejected";
export type KinshipType = "parent" | "child" | "spouse" | "sibling";
export type FamilyRole = "family_admin" | "family_collaborator";

export interface Person {
  id: string;
  dorsera_person_id: string | null;
  full_name: string;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  death_place: string | null;
  gender: string | null;
}

export interface Memorial {
  id: string;
  person_id: string;
  family_group_id: string;
  slug: string;
  visibility: MemorialVisibility;
  headline: string | null;
  biography: string | null;
  values: string[] | null;
  favorite_quotes: string[] | null;
  favorite_verses: string[] | null;
  favorite_songs: { title: string; artist: string; url?: string }[] | null;
  achievements: { title: string; description?: string; year?: number }[] | null;
  cover_photo_url: string | null;
  is_published: boolean;
  created_at: string;
  // Relación embebida (join) usada en la página pública:
  person?: Person;
}

export interface QrCode {
  id: string;
  memorial_id: string;
  short_code: string;
  png_url: string | null;
  svg_url: string | null;
  pdf_url: string | null;
  scan_count: number;
}

export interface Album {
  id: string;
  memorial_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface MediaItem {
  id: string;
  memorial_id: string;
  album_id: string | null;
  type: MediaType;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  alt_text: string;
  taken_at: string | null;
  ai_restored: boolean;
  ai_colorized: boolean;
}

export interface TimelineEvent {
  id: string;
  memorial_id: string;
  event_date: string;
  title: string;
  description: string | null;
  location: string | null;
  cover_media_id: string | null;
  sort_order: number;
  cover_media?: MediaItem;
}

export interface Tribute {
  id: string;
  memorial_id: string;
  author_id: string | null;
  author_name: string | null;
  type: TributeType;
  content: string | null;
  photo_url: string | null;
  status: TributeStatus;
  created_at: string;
}

export interface FamilyTreeRelationship {
  id: string;
  person_id: string;
  related_person_id: string;
  kinship: KinshipType;
}
