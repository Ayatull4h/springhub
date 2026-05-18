"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  HardHat,
} from "lucide-react";
import { PROJECT_TYPES, PROJECT_PROPOSAL_THRESHOLD } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [fileName, setFileName] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [region, setRegion] = useState("");
  const [typeId, setTypeId] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [proposalFile, setProposalFile] = useState<File | null>(null);

  useEffect(() => {
    // Fetch user data untuk pre-fill form
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/sign-in?redirect=/projects/new");
          return;
        }
        setUserPoints(data.user.points ?? 0);
        setContactName(data.user.username ?? "");
        setContactEmail(data.user.email ?? "");
      })
      .catch(() => router.push("/sign-in?redirect=/projects/new"))
      .finally(() => setLoading(false));
  }, [router]);

  const eligible = userPoints >= PROJECT_PROPOSAL_THRESHOLD;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("summary", summary);
      formData.set("region", region);
      formData.set("typeId", typeId);
      formData.set("goalAmount", goalAmount);
      formData.set("contactName", contactName);
      formData.set("contactEmail", contactEmail);
      formData.set("contactPhone", contactPhone);
      if (proposalFile) {
        formData.set("proposalFile", proposalFile);
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error
              ? Object.values(data.error).flat().join(", ")
              : t("common.error");
        setError(errMsg);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Gagal mengirim. Cek koneksi internet.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  // ── Not eligible ──
  if (!eligible) {
    return (
      <div className="container-page max-w-lg py-12 text-center">
        <HardHat className="mx-auto h-16 w-16 text-slate-300" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">
          {t("projects.new.notEligible")}
        </h1>
        <p className="mt-2 text-ink-muted">
          {t("projects.new.needMorePoints", {
            threshold: formatNumber(PROJECT_PROPOSAL_THRESHOLD),
            current: formatNumber(userPoints),
          })}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span>
            {t("projects.new.pointsNeeded", {
              remaining: formatNumber(PROJECT_PROPOSAL_THRESHOLD - userPoints),
            })}
          </span>
        </div>
        <Link href="/#community" className="btn-primary mt-6 inline-flex">
          {t("projects.new.backToActivities")}
        </Link>
      </div>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <div className="container-page max-w-lg py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-ink">
          {t("projects.new.submitted")}
        </h1>
        <p className="mt-2 text-ink-muted">
          {t("projects.new.submittedDesc")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t("projects.new.backToHome")}
          </Link>
          <Link href="/profile" className="btn-secondary">
            {t("projects.new.viewProfile")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="container-page max-w-3xl py-12">
      <Link
        href="/#community"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {t("projects.new.back")}
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {t("projects.new.title")}
      </h1>
      <p className="mt-2 text-ink-muted">
        {t("projects.new.description")}
      </p>

      {/* Eligibility badge */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
        <Sparkles className="h-4 w-4 flex-none" />
        {t("projects.new.eligibleBadge", {
          points: formatNumber(userPoints),
          threshold: formatNumber(PROJECT_PROPOSAL_THRESHOLD),
        })}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="card mt-6 space-y-5">
        {/* --- Project Info --- */}
        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            {t("projects.new.projectInfo")}
          </legend>

          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-ink">
                {t("projects.new.projectTitle")} <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("projects.new.titlePlaceholder")}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-ink">
                {t("projects.new.summary")} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="summary"
                required
                minLength={10}
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={t("projects.new.summaryPlaceholder")}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-ink">
                  {t("projects.new.region")} <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <input
                    id="region"
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={t("projects.new.regionPlaceholder")}
                    className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="typeId" className="block text-sm font-medium text-ink">
                  {t("projects.new.projectType")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="typeId"
                  required
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">{t("projects.new.selectType")}</option>
                  {PROJECT_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="goalAmount" className="block text-sm font-medium text-ink">
                {t("projects.new.goalAmount")} <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <input
                  id="goalAmount"
                  type="number"
                  required
                  min={100000}
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="e.g. 25000000"
                  className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <p className="mt-1 text-xs text-ink-subtle">
                {t("projects.new.goalHint")}
              </p>
            </div>
          </div>
        </fieldset>

        {/* --- Contact Info --- */}
        <fieldset className="border-t border-ink-line pt-5">
          <legend className="text-sm font-semibold text-ink">
            {t("projects.new.contactInfo")}
          </legend>
          <p className="mt-1 text-xs text-ink-muted">
            {t("projects.new.contactHint")}
          </p>

          <div className="mt-3 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-ink">
                  {t("projects.new.contactName")} <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-ink">
                  {t("projects.new.contactEmail")} <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-ink">
                {t("projects.new.contactPhone")} <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <input
                  id="contactPhone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 08123456789"
                  pattern="^(0[1-9]\d{8,11}|\+62\d{8,13})$"
                  title="Format: 08xx atau +62xx"
                  className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* --- Proposal File --- */}
        <fieldset className="border-t border-ink-line pt-5">
          <legend className="text-sm font-semibold text-ink">
            {t("projects.new.proposalFile")}
          </legend>
          <p className="mt-1 text-xs text-ink-muted">
            {t("projects.new.proposalHint")}
          </p>

          <div className="mt-3">
            <label
              htmlFor="proposalFile"
              className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-ink-line p-4 text-sm text-ink-muted transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <Upload className="h-6 w-6 flex-none text-brand-500" />
              <div className="flex-1">
                {fileName ? (
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <FileText className="h-4 w-4" />
                    {fileName}
                  </span>
                ) : (
                  <span>{t("projects.new.uploadPrompt")}</span>
                )}
              </div>
            </label>
            <input
              id="proposalFile"
              name="proposalFile"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setProposalFile(file);
                  setFileName(file.name);
                }
              }}
            />
          </div>
        </fieldset>

        {/* --- Submit --- */}
        <div className="flex items-center justify-end gap-2 border-t border-ink-line pt-4">
          <Link href="/#community" className="btn-secondary">
            {t("projects.new.cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("projects.new.submitting")}
              </>
            ) : (
              t("projects.new.submitProject")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
