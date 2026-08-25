"use client";
import { useEffect, useRef } from "react";
import { offlineDB, type DraftReport } from "./offline-db";

export function useAutoSave(
  formSlug: string,
  draftId: string,
  fieldData: Record<string, unknown>,
  photoBlobs: Array<{ fieldId: string; blob: Blob; fileName: string; mimeType: string }>
) {
  const draftIdRef = useRef<string>(draftId);
  const fieldDataRef = useRef(fieldData);
  const photoBlobsRef = useRef(photoBlobs);
  const prevRef = useRef("");

  useEffect(() => { fieldDataRef.current = fieldData; }, [fieldData]);
  useEffect(() => { photoBlobsRef.current = photoBlobs; }, [photoBlobs]);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fd = fieldDataRef.current;
      const pb = photoBlobsRef.current;
      const current = JSON.stringify({ fieldData: fd, photoBlobs: pb.map((p) => p.fileName) });
      if (current === prevRef.current) return; // no change
      prevRef.current = current;

      const draft: DraftReport = {
        id: draftIdRef.current,
        formSlug,
        fieldData: fd,
        photoBlobs: pb,
        savedAt: Date.now(),
      };
      await offlineDB.saveDraft(draft);
    }, 30_000); // every 30 seconds

    return () => clearInterval(interval);
  }, [formSlug, draftId]);
}
