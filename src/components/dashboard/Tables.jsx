import { useEffect, useRef, useState } from "react";
import { formatDate, formatIsbn, toDisplayCase } from "../../utils/text.js";

export function BooksTable({ allVisibleSelected, rows, selectedRows, sortConfig, toggleAllVisible, toggleRow, onSort, onEdit, onDelete }) {
  return (
    <table className="w-full min-w-[920px] border-collapse">
      <thead>
        <tr className="border-b border-line text-left text-sm font-semibold text-[#73737d]">
          <th className="w-[52px] px-4 py-3"><Checkbox checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
          <th className="w-[72px] px-4 py-3" aria-label="Portada" />
          <SortableHeader label="ISBN" sortKey="isbn" sortConfig={sortConfig} onSort={onSort} />
          <SortableHeader label="Título" sortKey="title" sortConfig={sortConfig} onSort={onSort} />
          <SortableHeader label="Autor" sortKey="authorName" sortConfig={sortConfig} onSort={onSort} />
          <th className="px-4 py-3">Páginas</th>
          <th className="w-[104px] px-4 py-3" aria-label="Acciones" />
        </tr>
      </thead>
      <tbody>
        {rows.map((book) => (
          <tr className="border-b border-line last:border-b-0" key={book.id}>
            <td className="px-4 py-3"><Checkbox checked={selectedRows.includes(book.id)} onChange={() => toggleRow(book.id)} /></td>
            <td className="px-4 py-3"><img alt={`Portada de ${book.title}`} className="h-14 w-9 rounded-sm object-cover" src={book.coverUrl} /></td>
            <td className="px-4 py-3 text-sm font-medium">{formatIsbn(book.isbn)}</td>
            <td className="max-w-[460px] px-4 py-3 text-sm font-semibold">{toDisplayCase(book.title)}</td>
            <td className="px-4 py-3 text-sm font-medium">{toDisplayCase(book.authorName)}</td>
            <td className="px-4 py-3 text-sm font-medium">{book.pages}</td>
            <td className="px-4 py-3 text-right"><RowActions onEdit={() => onEdit(book)} onDelete={() => onDelete(book.id)} /></td>
          </tr>
        ))}
        <EmptyRows visible={rows.length === 0} columns={7} />
      </tbody>
    </table>
  );
}

export function AuthorsTable({ allVisibleSelected, rows, selectedRows, sortConfig, toggleAllVisible, toggleRow, onSort, onEdit, onDelete }) {
  return (
    <table className="w-full min-w-[760px] border-collapse">
      <thead>
        <tr className="border-b border-line text-left text-sm font-semibold text-[#73737d]">
          <th className="w-[52px] px-4 py-3"><Checkbox checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
          <SortableHeader label="ID" sortKey="id" sortConfig={sortConfig} onSort={onSort} />
          <SortableHeader label="Nombre" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
          <SortableHeader label="Fecha de nacimiento" sortKey="birthDate" sortConfig={sortConfig} onSort={onSort} />
          <th className="w-[104px] px-4 py-3" aria-label="Acciones" />
        </tr>
      </thead>
      <tbody>
        {rows.map((author) => (
          <tr className="border-b border-line last:border-b-0" key={author.id}>
            <td className="px-4 py-3"><Checkbox checked={selectedRows.includes(author.id)} onChange={() => toggleRow(author.id)} /></td>
            <td className="max-w-[250px] px-4 py-3 text-xs font-medium text-muted">{author.id}</td>
            <td className="px-4 py-3 text-sm font-semibold">{toDisplayCase(author.name)}</td>
            <td className="px-4 py-3 text-sm font-medium">{formatDate(author.birthDate)}</td>
            <td className="px-4 py-3 text-right"><RowActions onEdit={() => onEdit(author)} onDelete={() => onDelete(author.id)} /></td>
          </tr>
        ))}
        <EmptyRows visible={rows.length === 0} columns={5} />
      </tbody>
    </table>
  );
}

function RowActions({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (open) window.lucide?.createIcons();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function runAction(action) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface"
        type="button"
        title="Acciones"
        onClick={() => setOpen((current) => !current)}
        aria-label="Acciones"
        aria-expanded={open}
      >
        <i data-lucide="ellipsis" className="h-5 w-5" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-line bg-white p-1 text-left shadow-lg">
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-surface"
            type="button"
            onClick={() => runAction(onEdit)}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface text-ink">
              <i data-lucide="pencil" className="h-4 w-4" aria-hidden="true" />
            </span>
            Editar
          </button>
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            type="button"
            onClick={() => runAction(onDelete)}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600">
              <i data-lucide="trash-2" className="h-4 w-4" aria-hidden="true" />
            </span>
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig?.key === sortKey;
  const isAscending = isActive && sortConfig.direction === "asc";
  const isDescending = isActive && sortConfig.direction === "desc";

  return (
    <th className="px-4 py-3">
      <button
        className="inline-flex items-center gap-2 rounded-md text-left transition hover:text-black"
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <SortDirectionIcon isActive={isActive} isAscending={isAscending} isDescending={isDescending} />
      </button>
    </th>
  );
}

function SortDirectionIcon({ isActive, isAscending, isDescending }) {
  const upColor = isActive && isAscending ? "#111827" : "#c8cbd2";
  const downColor = isActive && isDescending ? "#111827" : "#c8cbd2";

  return (
    <svg className="h-4 w-3 shrink-0" viewBox="0 0 12 16" fill="none" aria-hidden="true">
      <path d="M2.5 6L6 2.5L9.5 6" stroke={upColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 10L6 13.5L9.5 10" stroke={downColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <button aria-pressed={checked} className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${checked ? "border-ink bg-ink text-white" : "border-[#cfd4dc] bg-white text-transparent hover:border-[#9ca3af] hover:bg-surface"}`} type="button" onClick={onChange}>
      <i data-lucide="check" className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

function EmptyRows({ columns, visible }) {
  if (!visible) return null;
  return <tr><td className="px-4 py-7 text-center text-sm text-muted" colSpan={columns}>Sin registros para mostrar</td></tr>;
}
