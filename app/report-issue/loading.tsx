import { Loader2 } from "lucide-react";

export default function ReportIssueLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-sm text-ink-muted">Memuat formulir...</p>
      </div>
    </div>
  );
}
