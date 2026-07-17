"use client";
import { useEffect, useRef } from "react";
import { offlineDB, type DraftReport } from "./offline-db";

export function useAutoSave(
  formSlug: string,
  fieldData: Record<string, unknown>,
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>
) {
  const draftIdRef = useRef<string>(`draft-${formSlug}-${Date.now()}`);
  const prevRef = useRef("");

  useEffect(() => {
    const interval = setInterval(async () => {
      const current = JSON.stringify({ fieldData, photoBlobs: photoBlobs.map(p => p.fileName) });
      if (current === prevRef.current) return; // no change
      prevRef.current = current;

      const draft: DraftReport = {
        id: draftIdRef.current,
        formSlug,
        fieldData,
        photoBlobs,
        savedAt: Date.now(),
      };
      await offlineDB.saveDraft(draft);
    }, 30_000); // every 30 seconds

    return () => clearInterval(interval);
  }, [formSlug, fieldData, photoBlobs]);
}
