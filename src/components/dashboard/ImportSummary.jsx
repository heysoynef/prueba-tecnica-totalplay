function ImportSummary({ correct, errors }) {
  const hasErrors = errors > 0;
  const toneClasses = hasErrors
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className={`mt-6 rounded-lg border px-4 py-3 ${toneClasses}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Importación completada</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span>Correctos: <strong>{correct}</strong></span>
            <span>Con error: <strong>{errors}</strong></span>
          </div>
        </div>
        <i data-lucide={hasErrors ? "triangle-alert" : "check-circle-2"} className="h-5 w-5 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}

export default ImportSummary;
