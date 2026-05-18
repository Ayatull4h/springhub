// DEPRECATED — Epicollect5 is no longer used at runtime.
// SpringHub now hosts its own native field-reporting forms; see lib/forms.ts.
//
// Kept only as a short note for anyone running a one-off historical import
// from Epicollect5 CSV exports. Use a CLI script (e.g. tsx scripts/import-ec5.ts)
// rather than the application runtime.

export const EPICOLLECT5_DEPRECATED_NOTICE =
  "SpringHub uses native forms (lib/forms.ts). Epicollect5 is only referenced for one-off historical imports.";
