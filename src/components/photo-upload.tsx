"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addInspectionItemPhoto } from "@/app/actions/inspections";

export function PhotoUpload({
  itemId,
  jobId,
  workshopId,
}: {
  itemId: string;
  jobId: string;
  workshopId: string;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const path = `${workshopId}/${jobId}/${itemId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    await addInspectionItemPhoto(itemId, jobId, path);
    setUploading(false);
  }

  return (
    <div>
      <label className="inline-block cursor-pointer rounded border px-3 py-2 text-sm">
        {uploading ? "Uploading..." : "Add photo or video"}
        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
