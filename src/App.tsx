import React, { useEffect, useMemo, useState } from "react";
import { Check, Circle, Info, X } from "lucide-react";

function VezzgroupLogo() {
  return (
    <img
      src="/assets/vezzgroup-logo.svg"
      alt="vezzgroup Logo"
      className="h-7 w-auto"
    />
  );
}

type FieldKey = "config" | "matchmaster" | "kennzahlen" | "xmlPrev" | "xmlCurrent";
type StepKey = 1 | 2 | 3 | 4 | 5;
type CacheChoice = "" | "ja" | "nein";

type FieldValue = { file: string };

type ErrorState = {
  fields: Record<FieldKey, boolean>;
  cache: boolean;
  params: { jahr: boolean; quartal: boolean; ytd: boolean };
  output: boolean;
  confirmed: boolean;
};

const yearOptions = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];
const ytdOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const workflowLabels = ["Datenquellen", "Parameter", "Ausgabeordner", "Überprüfung", "Report erstellen"] as const;
const TOAST_DURATION = 6000;
const TOAST_CIRCUMFERENCE = 2 * Math.PI * 7;

const emptyErrors = (): ErrorState => ({
  fields: {
    config: false,
    matchmaster: false,
    kennzahlen: false,
    xmlPrev: false,
    xmlCurrent: false,
  },
  cache: false,
  params: { jahr: false, quartal: false, ytd: false },
  output: false,
  confirmed: false,
});

export default function App() {
  const brand = "#294f9f";

  const [step, setStep] = useState<StepKey>(1);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVersion, setToastVersion] = useState(0);
  const [toastProgress, setToastProgress] = useState(100);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const [errorState, setErrors] = useState<ErrorState>(emptyErrors());

  const [fields, setFields] = useState<Record<FieldKey, FieldValue>>({
    config: { file: "" },
    matchmaster: { file: "" },
    kennzahlen: { file: "" },
    xmlPrev: { file: "" },
    xmlCurrent: { file: "" },
  });
  const [params, setParams] = useState({ jahr: "", quartal: "", ytd: "" });
  const [cache, setCache] = useState<CacheChoice>("");
  const [output, setOutput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportStage, setReportStage] = useState(0);

  useEffect(() => {
    if (!toast) return;
    setToastProgress(100);
    const frame = window.requestAnimationFrame(() => setToastProgress(0));
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [toast, toastVersion]);

  useEffect(() => {
    if (step !== 5) {
      setReportProgress(0);
      setReportStage(0);
      return;
    }

    setReportProgress(6);
    setReportStage(1);

    const checkpoints = [25, 50, 75, 100];
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      if (i <= checkpoints.length) {
        setReportProgress(checkpoints[i - 1]);
        setReportStage(i);
      }
      if (i >= checkpoints.length) {
        window.clearInterval(interval);
      }
    }, 850);

    return () => window.clearInterval(interval);
  }, [step]);

  const allFilesReady = useMemo(() => Object.values(fields).every((f) => Boolean(f.file)), [fields]);
  const paramsReady = useMemo(() => Object.values(params).every(Boolean), [params]);
  const outputReady = Boolean(output);
  const canOpenReportStep = allFilesReady && Boolean(cache) && paramsReady && outputReady && confirmed;

  const isStepComplete = (s: StepKey) => {
    if (s === 1) return allFilesReady && Boolean(cache);
    if (s === 2) return paramsReady;
    if (s === 3) return outputReady;
    if (s === 4) return confirmed;
    return step === 5;
  };

  const showToast = (message: string) => {
    setToast(message);
    setToastVersion((prev) => prev + 1);
  };

  const clearStepErrors = (s: StepKey) => {
    setErrors((prev) => {
      const next = {
        ...prev,
        fields: { ...prev.fields },
        params: { ...prev.params },
      };
      if (s === 1) {
        next.fields = { ...emptyErrors().fields };
        next.cache = false;
      }
      if (s === 2) next.params = { ...emptyErrors().params };
      if (s === 3) next.output = false;
      if (s === 4) next.confirmed = false;
      return next;
    });
  };

  const setFile = (key: FieldKey) => {
    const fileName = key === "xmlPrev" || key === "xmlCurrent" ? "demo.xml" : "demo.xlsx";
    setFields((prev) => ({ ...prev, [key]: { file: fileName } }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [key]: false } }));
  };

  const clearFile = (key: FieldKey) => {
    setFields((prev) => ({ ...prev, [key]: { file: "" } }));
  };

  const next = () => {
    const newErrors: ErrorState = {
      fields: {
        config: !fields.config.file,
        matchmaster: !fields.matchmaster.file,
        kennzahlen: !fields.kennzahlen.file,
        xmlPrev: !fields.xmlPrev.file,
        xmlCurrent: !fields.xmlCurrent.file,
      },
      cache: !cache,
      params: {
        jahr: !params.jahr,
        quartal: !params.quartal,
        ytd: !params.ytd,
      },
      output: !output,
      confirmed: !confirmed,
    };

    if (step === 1 && (!allFilesReady || !cache)) {
      setErrors((prev) => ({ ...prev, fields: newErrors.fields, cache: newErrors.cache }));
      showToast("Bitte wählen Sie alle erforderlichen Datenquellen aus und legen Sie die Verarbeitungsoptionen fest.");
      return;
    }
    if (step === 2 && !paramsReady) {
      setErrors((prev) => ({ ...prev, params: newErrors.params }));
      showToast("Bitte wählen Sie alle erforderlichen Auswertungsparameter aus.");
      return;
    }
    if (step === 3 && !outputReady) {
      setErrors((prev) => ({ ...prev, output: newErrors.output }));
      showToast("Bitte wählen Sie einen Ausgabeordner aus.");
      return;
    }
    if (step === 4) {
      if (!allFilesReady || !cache || !paramsReady || !outputReady) {
        setErrors((prev) => ({
          ...prev,
          fields: newErrors.fields,
          cache: newErrors.cache,
          params: newErrors.params,
          output: newErrors.output,
          confirmed: newErrors.confirmed,
        }));
        showToast("Bitte vervollständigen Sie zuerst Datenquellen, Parameter und Ausgabeordner.");
        return;
      }
      if (!confirmed) {
        setErrors((prev) => ({ ...prev, confirmed: newErrors.confirmed }));
        showToast("Bitte bestätigen Sie, dass alle Angaben korrekt sind.");
        return;
      }
    }

    clearStepErrors(step);
    setStep((prev) => Math.min(5, (prev + 1) as StepKey) as StepKey);
  };

  const back = () => {
    clearStepErrors(step);
    setStep((prev) => Math.max(1, (prev - 1) as StepKey) as StepKey);
  };

  const resetFlow = () => {
    setFields({
      config: { file: "" },
      matchmaster: { file: "" },
      kennzahlen: { file: "" },
      xmlPrev: { file: "" },
      xmlCurrent: { file: "" },
    });
    setParams({ jahr: "", quartal: "", ytd: "" });
    setCache("");
    setOutput("");
    setConfirmed(false);
    setReportProgress(0);
    setReportStage(0);
    setErrors(emptyErrors());
    setStep(1);
    showToast("Ein neuer Report kann jetzt erstellt werden.");
  };

  const downloadReport = () => {
    showToast("Der Report wird heruntergeladen und steht zusätzlich im Ausgabeordner zur Verfügung.");
  };

  const HelpButton = ({ id, text }: { id: string; text: string }) => (
    <div className="relative flex min-h-[40px] items-center justify-end">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={openHelp === id}
        aria-controls={`help-${id}`}
        onClick={() => setOpenHelp((prev) => (prev === id ? null : id))}
        className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95"
        aria-label="Hilfe anzeigen"
      >
        <Info className="h-4 w-4" />
      </button>
      {openHelp === id ? (
        <div id={`help-${id}`} role="dialog" className="absolute right-0 top-7 z-20 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
          {text}
        </div>
      ) : null}
    </div>
  );

  const StatusIcon = ({ active }: { active: boolean }) =>
    active ? <Circle aria-hidden="true" className="h-4 w-4 fill-emerald-600 text-emerald-600" /> : <Circle aria-hidden="true" className="h-4 w-4 text-slate-300" />;

  const InlineHint = ({ id, text }: { id: string; text: string }) => (
    <div id={id} role="status" aria-live="polite" className="mt-1 flex w-full items-center gap-1 text-left text-xs text-blue-700">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );

  const ProcessingOptionHint = ({ id, text }: { id: string; text: string }) => (
    <div className="grid grid-cols-8 gap-4 px-6">
      <div className="col-start-4 col-span-3 min-h-[24px]">
        <InlineHint id={id} text={text} />
      </div>
    </div>
  );

  const ReviewErrorHint = ({ id, text }: { id: string; text: string }) => (
    <div className="px-6">
      <div className="ml-[0px] min-h-[24px] max-w-[420px]">
        <div id={id} role="status" aria-live="polite" className="mt-1 flex w-full items-center gap-1 text-left text-xs text-red-600">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{text}</span>
        </div>
      </div>
    </div>
  );

  const Field = ({ label, fieldKey, hint }: { label: string; fieldKey: FieldKey; hint: string }) => {
    const value = fields[fieldKey];
    const error = errorState.fields[fieldKey];
    const hintId = `hint-${fieldKey}`;

    return (
      <div className="space-y-1">
        <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <label htmlFor={`input-${fieldKey}`} className="col-span-3 flex min-h-[40px] items-center gap-2 text-sm font-medium text-slate-900">
            <StatusIcon active={Boolean(value.file)} />
            {label}
          </label>

          <div
            id={`input-${fieldKey}`}
            role="button"
            tabIndex={0}
            aria-describedby={error ? hintId : undefined}
            className={`col-span-3 flex min-h-[40px] cursor-pointer items-center rounded-lg px-3 py-2 text-xs shadow-sm transition-colors ${
              value.file
                ? "border border-emerald-200 bg-emerald-50 text-slate-700 hover:border-emerald-300"
                : "border border-dashed border-slate-400 bg-slate-100 text-slate-500 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            {value.file ? value.file : "Datei per Drag & Drop ablegen oder auswählen"}
          </div>

          <div className="flex gap-2 self-start">
            <button
              type="button"
              aria-label={`${label} leeren`}
              onClick={() => clearFile(fieldKey)}
              className="h-[40px] rounded border border-[#294f9f] bg-white px-3 text-xs text-[#294f9f] transition hover:bg-[#eef3ff] active:translate-y-px active:bg-[#e0e9ff] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
            >
              Leeren
            </button>
            <button
              type="button"
              aria-label={`${label} auswählen`}
              onClick={() => setFile(fieldKey)}
              className="h-[40px] rounded px-3 text-xs text-white transition hover:bg-[#1f3d7a] active:translate-y-px active:bg-[#18305f] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
              style={{ background: brand }}
            >
              Durchsuchen
            </button>
          </div>

          <HelpButton id={`field-${fieldKey}`} text={hint} />
        </div>

        <div className="grid grid-cols-8 gap-4 px-6">
          <div className="col-start-4 col-span-3 min-h-[24px]">
            {error ? <InlineHint id={hintId} text={`Bitte ${label} auswählen.`} /> : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
      {toast ? (
        <div role="alert" aria-live="assertive" className="fixed right-6 top-6 z-30 flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white shadow-lg">
          <div className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
              <circle
                cx="10"
                cy="10"
                r="7"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={TOAST_CIRCUMFERENCE}
                strokeDashoffset={TOAST_CIRCUMFERENCE * (1 - toastProgress / 100)}
                style={{ transition: `stroke-dashoffset ${TOAST_DURATION}ms linear` }}
              />
            </svg>
          </div>
          <span className="text-sm">{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Hinweis schließen">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex h-[1064px] w-[1320px] flex-col overflow-hidden rounded-2xl bg-white shadow">
        <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-4">
          <VezzgroupLogo />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Leistungsreport Generator</h1>
            <p className="text-sm text-slate-600">vezzgroup GmbH</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-64 border-r border-slate-200 p-6 pt-8">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Workflow</h2>
            {workflowLabels.map((label, index) => {
              const stepNumber = (index + 1) as StepKey;
              const complete = isStepComplete(stepNumber);
              const active = step === stepNumber;

              return (
                <div key={label} className="flex flex-col">
                  <button
                    type="button"
                    aria-current={active}
                    aria-label={`Schritt ${stepNumber}: ${label}`}
                    aria-disabled={stepNumber === 5 && !canOpenReportStep}
                    onClick={() => {
                      if (stepNumber === 5 && !canOpenReportStep) return;
                      setStep(stepNumber);
                    }}
                    className={`flex items-center gap-2 text-left ${stepNumber === 5 && !canOpenReportStep ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${complete ? "bg-emerald-600" : active ? "bg-emerald-100" : "bg-slate-200"}`}>
                      {complete ? <Check className="h-4 w-4 text-white" /> : stepNumber}
                    </div>
                    <span className="text-sm text-slate-800">{label}</span>
                  </button>
                  {index < workflowLabels.length - 1 ? (
                    <div className="flex justify-center -ml-[187px]">
                      <div className={`h-6 border-l-2 ${complete ? "border-emerald-600" : "border-slate-400"}`} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </aside>

          <main className="flex-1 min-h-0 overflow-y-auto pl-8 pr-6 pt-8 pb-8">
            {step === 1 ? (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-slate-900">Datenquellen</h2>

                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">EasyVET-Daten auswählen</p>
                <div className="space-y-2">
                  <Field label="XML Vorjahr" fieldKey="xmlPrev" hint="Wählen Sie die EasyVET XML-Datei des Vorjahres. Diese Datei wird für Vergleichs- und Verlaufsauswertungen verwendet." />
                  <Field label="XML auszuwertendes Jahr" fieldKey="xmlCurrent" hint="Wählen Sie die EasyVET XML-Datei des auszuwertenden Jahres. Diese Datei bildet die Grundlage für den aktuellen Report." />
                </div>

                <p className="mt-5 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">MatchMaster-Datei auswählen</p>
                <Field label="MatchMaster Datei" fieldKey="matchmaster" hint="Wählen Sie die MatchMaster-Datei. Sie dient als zentrale Datenquelle für die Zuordnung und Verarbeitung der Reportdaten." />

                <p className="mt-5 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Kennzahlen-Datei auswählen</p>
                <Field label="Kennzahlen Datei" fieldKey="kennzahlen" hint="Wählen Sie die Kennzahlen-Datei. Sie ergänzt die Auswertung um zusätzliche Leistungs- und Reportwerte." />

                <p className="mt-5 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Konfiguration auswählen</p>
                <Field label="Klinik Konfig" fieldKey="config" hint="Wählen Sie die Klinik-Konfigurationsdatei. Sie enthält standortbezogene Einstellungen für die Reportgenerierung." />

                <p className="mt-5 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Verarbeitung festlegen</p>
                <div className="space-y-1">
                  <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <div className="col-span-3 flex min-h-[40px] items-center gap-2 text-sm font-medium text-slate-900">
                      <StatusIcon active={Boolean(cache)} />
                      Gematchte Einträge zwischenspeichern
                    </div>
                    <div className="col-start-4 col-span-3 flex min-h-[40px] items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="cacheEntries"
                          value="ja"
                          checked={cache === "ja"}
                          onChange={() => {
                            setCache("ja");
                            setErrors((prev) => ({ ...prev, cache: false }));
                          }}
                          className="accent-[#294f9f]"
                        />
                        Ja
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="cacheEntries"
                          value="nein"
                          checked={cache === "nein"}
                          onChange={() => {
                            setCache("nein");
                            setErrors((prev) => ({ ...prev, cache: false }));
                          }}
                          className="accent-[#294f9f]"
                        />
                        Nein
                      </label>
                    </div>
                    <div className="col-start-8 flex min-h-[40px] items-center justify-end">
                      <HelpButton id="cache-help" text="Legen Sie fest, ob erfolgreich gematchte Einträge für die weitere Verarbeitung zwischengespeichert werden sollen." />
                    </div>
                  </div>
                  {errorState.cache ? (
                    <ProcessingOptionHint id="hint-cache" text="Bitte wählen Sie eine Verarbeitungsoption aus." />
                  ) : (
                    <div className="grid grid-cols-8 gap-4 px-6">
                      <div className="col-start-4 col-span-3 min-h-[24px]" />
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-slate-900">Parameter</h2>
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Auswertung definieren</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                        <div className="col-span-3 flex min-h-[40px] items-center gap-2">
                          <StatusIcon active={Boolean(params.jahr)} />
                          <span className="text-sm font-medium text-slate-900">Jahr</span>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={params.jahr}
                            onChange={(e) => {
                              setParams((p) => ({ ...p, jahr: e.target.value }));
                              setErrors((p) => ({ ...p, params: { ...p.params, jahr: false } }));
                            }}
                            aria-describedby={errorState.params.jahr ? "hint-param-jahr" : undefined}
                            className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2 ${params.jahr ? "border-emerald-200 bg-emerald-50 text-slate-700" : "border-slate-400 bg-white text-slate-600"}`}
                          >
                            <option value="" disabled>Bitte auswählen</option>
                            {yearOptions.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1" />
                        <HelpButton id="param-jahr" text="Wählen Sie das auszuwertende Jahr." />
                      </div>
                      <div className="grid grid-cols-8 gap-4 px-6">
                        <div className="col-start-4 col-span-3 min-h-[24px]">
                          {errorState.params.jahr ? <InlineHint id="hint-param-jahr" text="Bitte wählen Sie ein Jahr aus." /> : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                        <div className="col-span-3 flex min-h-[40px] items-center gap-2">
                          <StatusIcon active={Boolean(params.quartal)} />
                          <span className="text-sm font-medium text-slate-900">Quartal</span>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={params.quartal}
                            onChange={(e) => {
                              setParams((p) => ({ ...p, quartal: e.target.value }));
                              setErrors((p) => ({ ...p, params: { ...p.params, quartal: false } }));
                            }}
                            aria-describedby={errorState.params.quartal ? "hint-param-quartal" : undefined}
                            className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2 ${params.quartal ? "border-emerald-200 bg-emerald-50 text-slate-700" : "border-slate-400 bg-white text-slate-600"}`}
                          >
                            <option value="" disabled>Bitte auswählen</option>
                            {quarterOptions.map((q) => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1" />
                        <HelpButton id="param-quartal" text="Wählen Sie das Quartal." />
                      </div>
                      <div className="grid grid-cols-8 gap-4 px-6">
                        <div className="col-start-4 col-span-3 min-h-[24px]">
                          {errorState.params.quartal ? <InlineHint id="hint-param-quartal" text="Bitte wählen Sie ein Quartal aus." /> : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                        <div className="col-span-3 flex min-h-[40px] items-center gap-2">
                          <StatusIcon active={Boolean(params.ytd)} />
                          <span className="text-sm font-medium text-slate-900">YTD</span>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={params.ytd}
                            onChange={(e) => {
                              setParams((p) => ({ ...p, ytd: e.target.value }));
                              setErrors((p) => ({ ...p, params: { ...p.params, ytd: false } }));
                            }}
                            aria-describedby={errorState.params.ytd ? "hint-param-ytd" : undefined}
                            className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2 ${params.ytd ? "border-emerald-200 bg-emerald-50 text-slate-700" : "border-slate-400 bg-white text-slate-600"}`}
                          >
                            <option value="" disabled>Bitte auswählen</option>
                            {ytdOptions.map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1" />
                        <HelpButton id="param-ytd" text="Wählen Sie den YTD-Wert." />
                      </div>
                      <div className="grid grid-cols-8 gap-4 px-6">
                        <div className="col-start-4 col-span-3 min-h-[24px]">
                          {errorState.params.ytd ? <InlineHint id="hint-param-ytd" text="Bitte wählen Sie einen YTD-Wert aus." /> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold text-slate-900">Ausgabeordner</h2>
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Ausgabeordner festlegen</p>
                  <div className="space-y-1">
                    <div className="grid grid-cols-8 items-start gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                      <div className="col-span-3 flex min-h-[40px] items-center gap-2 text-sm font-medium text-slate-900">
                        <StatusIcon active={Boolean(output)} />
                        <span>Speicherort des Reports</span>
                      </div>
                      <div className="col-span-3">
                        <input
                          value={output}
                          onChange={(e) => {
                            setOutput(e.target.value);
                            setErrors((prev) => ({ ...prev, output: false }));
                          }}
                          aria-describedby={errorState.output ? "hint-output" : undefined}
                          placeholder={"z. B. \\\\server01\\reports\\2025_Q4"}
                          className={`w-full min-h-[40px] rounded-lg border px-3 py-2 text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2 ${
                            output
                              ? "border-emerald-200 bg-emerald-50 text-slate-700"
                              : "border-slate-400 bg-white text-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex gap-2 self-start">
                        <button
                          type="button"
                          aria-label="Ausgabeordner leeren"
                          onClick={() => {
                            setOutput("");
                            setErrors((prev) => ({ ...prev, output: false }));
                          }}
                          className="h-[40px] rounded border border-[#294f9f] bg-white px-3 text-xs text-[#294f9f] transition hover:bg-[#eef3ff] active:translate-y-px active:bg-[#e0e9ff] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                        >
                          Leeren
                        </button>
                        <button
                          type="button"
                          aria-label="Ausgabeordner auswählen"
                          onClick={() => {
                            setOutput("\\\\server01\\reports\\Q4_2025");
                            setErrors((prev) => ({ ...prev, output: false }));
                          }}
                          className="h-[40px] rounded px-3 text-xs text-white transition hover:bg-[#1f3d7a] active:translate-y-px active:bg-[#18305f] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                          style={{ background: brand }}
                        >
                          Durchsuchen
                        </button>
                      </div>
                      <HelpButton id="output-help" text="Wählen Sie den Zielordner, in dem der generierte Report abgelegt wird." />
                    </div>
                    <div className="grid grid-cols-8 gap-4 px-6">
                      <div className="col-start-4 col-span-3 min-h-[24px]">
                        {errorState.output ? <InlineHint id="hint-output" text="Bitte wählen Sie einen Ausgabeordner aus." /> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Überprüfung</h2>
                <div className="max-h-[620px] space-y-4 overflow-y-auto -mr-[24px] pr-6">
                  <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Datenquellen</p>
                    <div className="divide-y">
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">XML Vorjahr</span><span className="col-span-3 text-xs text-slate-600">{fields.xmlPrev.file || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">XML auszuwertendes Jahr</span><span className="col-span-3 text-xs text-slate-600">{fields.xmlCurrent.file || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">MatchMaster Datei</span><span className="col-span-3 text-xs text-slate-600">{fields.matchmaster.file || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Kennzahlen Datei</span><span className="col-span-3 text-xs text-slate-600">{fields.kennzahlen.file || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Klinik Konfig</span><span className="col-span-3 text-xs text-slate-600">{fields.config.file || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Verarbeitungsoption</span><span className="col-span-3 text-xs text-slate-600">{cache || "—"}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Parameter</p>
                    <div className="divide-y">
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Jahr</span><span className="col-span-3 text-xs text-slate-600">{params.jahr || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Quartal</span><span className="col-span-3 text-xs text-slate-600">{params.quartal || "—"}</span></div>
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">YTD</span><span className="col-span-3 text-xs text-slate-600">{params.ytd || "—"}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Ausgabeordner</p>
                    <div className="divide-y">
                      <div className="grid grid-cols-8 items-center py-3"><span className="col-span-4">Speicherort des Reports</span><span className="col-span-3 text-xs text-slate-600">{output || "—"}</span></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className={`rounded-lg border px-6 py-5 shadow-sm ${errorState.confirmed ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => {
                            setConfirmed(e.target.checked);
                            setErrors((prev) => ({ ...prev, confirmed: false }));
                          }}
                          aria-describedby={errorState.confirmed ? "hint-confirmed" : undefined}
                          className="accent-[#294f9f]"
                        />
                        Alle Angaben wurden auf ihre Richtigkeit geprüft.
                      </label>
                    </div>
                    {errorState.confirmed ? (
                      <ReviewErrorHint id="hint-confirmed" text="Bestätigung erforderlich, um fortzufahren." />
                    ) : (
                      <div className="px-6"><div className="ml-[0px] min-h-[24px] max-w-[420px]" /></div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Report erstellen</h2>
                <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Report wird erstellt</p>
                      <p className="text-xs text-slate-600">Die Verarbeitung läuft. Bitte einen Moment warten.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{reportProgress}%</div>
                  </div>

                  <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                    <div
                      className="h-2.5 rounded-full bg-[#294f9f] transition-all duration-700 ease-out"
                      style={{ width: `${reportProgress}%` }}
                    />
                  </div>

                  <div className="space-y-3 text-sm">
                    {[
                      "Datenquellen werden verarbeitet",
                      "Parameter werden verarbeitet",
                      "Ausgabeordner wird vorbereitet",
                      "Report wird generiert",
                    ].map((label, index) => {
                      const done = reportStage > index + 1 || (reportProgress === 100 && reportStage === index + 1);
                      const active = reportStage === index + 1 && reportProgress < 100;
                      return (
                        <div key={label} className={`flex items-center justify-between rounded border px-4 py-3 transition-all ${done ? "border-emerald-200 bg-emerald-50" : active ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                          <div className="flex items-center gap-3">
                            {done ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                                <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                              </div>
                            ) : active ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#294f9f]" aria-hidden="true" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-200 bg-white" aria-hidden="true" />
                            )}
                            <span className={`${done ? "text-emerald-800" : active ? "text-slate-900" : "text-slate-600"}`}>{label}</span>
                          </div>
                          <span className={`text-xs font-medium ${done ? "text-emerald-700" : active ? "text-blue-700" : "text-slate-500"}`}>
                            {done ? "Abgeschlossen" : active ? "In Bearbeitung" : "Ausstehend"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-xl border p-6 transition-all ${reportProgress === 100 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                >
                  {reportProgress === 100 ? (
                    <>
                      Report fertiggestellt. Der Report kann jetzt heruntergeladen werden.
                    </>
                  ) : (
                    <>Die Report-Erstellung wird vorbereitet.</>
                  )}
                </div>
              </div>
            ) : null}
          </main>
        </div>

        <div className="shrink-0 border-t bg-white px-6 py-4">
          <div className="flex justify-end gap-3 pr-4">
            {step === 5 ? (
              <>
                <button
                  onClick={resetFlow}
                  aria-label="Neuen Report erstellen"
                  className="h-[36px] w-[220px] shrink-0 whitespace-nowrap rounded-md border border-[#294f9f] bg-white px-4 py-2 text-sm text-[#294f9f] transition hover:bg-[#eef3ff] active:translate-y-px active:bg-[#e0e9ff] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                >
                  Neuen Report erstellen
                </button>
                <button
                  onClick={downloadReport}
                  style={{ background: brand }}
                  className="h-[36px] w-[220px] shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm text-white transition hover:bg-[#1f3d7a] active:translate-y-px active:bg-[#18305f] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                  aria-label="Report herunterladen"
                >
                  Report herunterladen
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={back}
                  aria-label="Zum vorherigen Schritt zurück"
                  className="h-[36px] w-[220px] shrink-0 whitespace-nowrap rounded-md border border-[#294f9f] bg-white px-4 py-2 text-sm text-[#294f9f] transition hover:bg-[#eef3ff] active:translate-y-px active:bg-[#e0e9ff] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                >
                  Zurück
                </button>
                <button
                  onClick={next}
                  style={{ background: brand }}
                  className="h-[36px] w-[220px] shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm text-white transition hover:bg-[#1f3d7a] active:translate-y-px active:bg-[#18305f] focus:outline-none focus:ring-2 focus:ring-[#294f9f] focus:ring-offset-2"
                  aria-label="Zum nächsten Schritt"
                >
                  {step === 1 ? "Parameter definieren" : step === 2 ? "Ausgabeordner festlegen" : step === 3 ? "Angaben prüfen" : "Report erstellen"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-600">
          <span>💜 Made with Love, Coffee and Code by <span className="font-semibold text-slate-600">App Innovators Solution GmbH</span></span>
          <span>Release 1.00.00</span>
        </div>
      </div>
    </div>
  );
}
