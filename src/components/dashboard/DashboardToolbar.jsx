import { useEffect, useRef, useState } from "react";

function DashboardToolbar({ activeTab, isImporting, search, selectedCount, onCreate, onDeleteSelected, onImportBooks, onSearch }) {
  const fileInputRef = useRef(null);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!isImporting) {
      setDotCount(1);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setDotCount((current) => (current === 3 ? 1 : current + 1));
    }, 450);

    return () => window.clearInterval(intervalId);
  }, [isImporting]);

  return (
    <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SearchBox activeTab={activeTab} search={search} onSearch={onSearch} />
      <div className="flex flex-wrap items-center gap-3">
        {selectedCount > 0 ? (
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={onDeleteSelected} disabled={isImporting}>
            <i data-lucide="trash-2" className="h-4 w-4" aria-hidden="true" />
            Eliminar seleccionados
          </button>
        ) : null}
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={onCreate} disabled={isImporting}>
          <i data-lucide="plus" className="h-4 w-4" aria-hidden="true" />
          Nuevo
        </button>
        {activeTab === "books" ? (
          <>
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-surface disabled:cursor-wait disabled:opacity-70" type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              <i data-lucide={isImporting ? "loader-2" : "download"} className={`h-4 w-4 ${isImporting ? "animate-spin" : ""}`} aria-hidden="true" />
              {isImporting ? `Importando${".".repeat(dotCount)}` : "Importar"}
            </button>
            <input ref={fileInputRef} className="hidden" type="file" accept=".csv,text/csv" onChange={onImportBooks} disabled={isImporting} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function SearchBox({ activeTab, search, onSearch }) {
  if (activeTab !== "books") return <div className="hidden lg:block" />;
  return (
    <label className="relative block w-full max-w-[420px]">
      <i data-lucide="search" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" aria-hidden="true" />
      <input className="h-9 w-full rounded-lg border border-line bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#73737d] focus:border-black focus:ring-2 focus:ring-gray-100" onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por título o autor" type="search" value={search} />
    </label>
  );
}

export default DashboardToolbar;
