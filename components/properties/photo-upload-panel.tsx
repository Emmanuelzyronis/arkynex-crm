"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";

import { uploadPropertyPhotos, deletePropertyPhoto } from "@/lib/db/mutations/properties";
import { Button } from "@/components/ui/button";
import type { PropertyPhoto } from "@/lib/db/queries/properties";
import { getPublicObjectUrl } from "@/lib/storage/public-url";

export function PhotoUploadPanel({
  propertyId,
  photos,
}: {
  propertyId: string;
  photos: PropertyPhoto[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("propertyId", propertyId);
    for (const file of Array.from(files)) {
      formData.append("photos", file);
    }

    await uploadPropertyPhotos(formData);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Photos</h2>
        <div>
          <input
            ref={inputRef}
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleFiles}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload photos"}
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center transition-colors hover:bg-primary/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-ink">Drag photos here or click to browse</p>
          <p className="text-xs text-ink-muted">JPG, PNG or WEBP · max 10MB each</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
                <img
                  src={getPublicObjectUrl(photo.storagePath)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {photo.isPrimary && (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                    Primary
                  </span>
                )}
                <form className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="storagePath" value={photo.storagePath} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <button
                    type="submit"
                    formAction={deletePropertyPhoto}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 text-status-lost shadow-sm transition-colors hover:bg-status-lost hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-line bg-surface text-ink-muted transition-colors hover:bg-primary/5 hover:text-primary"
          >
            <Upload className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
