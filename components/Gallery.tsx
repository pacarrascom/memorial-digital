import Image from 'next/image';

interface MediaAsset {
  id: string;
  type: 'foto' | 'video' | 'audio' | 'documento' | 'carta';
  storage_path: string;
  caption: string | null;
}

interface GalleryProps {
  assets: MediaAsset[];
}

const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memorial-assets`;

export function Gallery({ assets }: GalleryProps) {
  const photos = assets?.filter((a) => a.type === 'foto') ?? [];

  if (!photos.length) {
    return <p className="text-sm text-ink/60">Aún no se han subido fotografías.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((asset) => (
        <div key={asset.id} className="relative aspect-square overflow-hidden rounded-md bg-ash">
          <Image
            src={`${SUPABASE_STORAGE_URL}/${asset.storage_path}`}
            alt={asset.caption ?? ''}
            fill
            sizes="(max-width: 640px) 33vw, 200px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
