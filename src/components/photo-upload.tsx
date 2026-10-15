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
      <label
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 ${uploading ? "opacity-50" : ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
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
