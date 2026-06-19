const PAGE_SIZE_OPTIONS = [5, 10, 15];

function PaginationBar({ currentPage, pageSize, selectedCount, setPageSize, totalPages, visibleCount, onPageChange }) {
  return (
    <div className="mt-4 flex flex-col gap-4 pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-muted">{selectedCount} de {visibleCount} fila(s) seleccionadas</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
        <label className="flex items-center gap-4 text-sm font-semibold">Filas por página
          <span className="relative inline-flex">
            <select className="h-9 appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-sm font-semibold outline-none focus:border-line focus:ring-0" onChange={(event) => setPageSize(Number(event.target.value))} value={pageSize}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 grid -translate-y-1/2 gap-0 text-[#c8cbd2]">
              <i data-lucide="chevron-up" className="h-3.5 w-3.5" aria-hidden="true" />
              <i data-lucide="chevron-down" className="-mt-1 h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </span>
        </label>
        <p className="text-sm font-semibold">Página {currentPage} de {totalPages}</p>
        <div className="flex items-center gap-3">
          <PageButton icon="chevrons-left" label="Primera página" onClick={() => onPageChange(1)} />
          <PageButton icon="chevron-left" label="Página anterior" onClick={() => onPageChange(currentPage - 1)} />
          <PageButton icon="chevron-right" label="Página siguiente" onClick={() => onPageChange(currentPage + 1)} />
          <PageButton icon="chevrons-right" label="Última página" onClick={() => onPageChange(totalPages)} />
        </div>
      </div>
    </div>
  );
}

function PageButton({ icon, label, onClick }) {
  return (
    <button aria-label={label} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-black shadow-sm transition hover:bg-surface" title={label} type="button" onClick={onClick}>
      <i data-lucide={icon} className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default PaginationBar;
