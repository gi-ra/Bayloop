"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setWorkshopLogo, removeWorkshopLogo } from "@/app/actions/branding";

export function LogoUpload({
  workshopId,
  currentLogoUrl,
}: {
  workshopId: string;
  currentLogoUrl: string | null;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const path = `${workshopId}/logo-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("workshop-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("workshop-logos").getPublicUrl(path);
    await setWorkshopLogo(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
  }

  async function handleRemove() {
    setUploading(true);
    await removeWorkshopLogo();
    setPreview(null);
    setUploading(false);
  }

  return (
    <div>
      {preview && (
        <div className="mb-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Current logo" className="h-12 max-w-[160px] object-contain" />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="text-sm text-red-600 underline"
          >
            Remove
          </button>
        </div>
      )}
      <label className="inline-block cursor-pointer rounded border px-3 py-2 text-sm">
        {uploading ? "Uploading..." : preview ? "Replace logo" : "Upload logo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Leave empty to use the default Bayloop logo mark in your brand color.
      </p>
    </div>
  );
}
