import { useEffect, useMemo, useRef, useState } from "react";
import seedBooks from "../data/books.json";
import seedAuthors from "../data/authors.json";
import RequirementsPage, { AppFooter } from "./RequirementsPage.jsx";
import IsbnPage from "./IsbnPage.jsx";

const PAGE_SIZE_OPTIONS = [5, 10, 15];
const BOOKS_KEY = "bookPortalBooksV2";
const AUTHORS_KEY = "bookPortalAuthorsV2";
const emptyBookForm = { title: "", isbn: "", authorId: "", pages: "" };
const emptyAuthorForm = { name: "", birthDate: "" };

function DashboardHome({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("books");
  const [books, setBooks] = useStoredState(BOOKS_KEY, seedBooks);
  const [authors, setAuthors] = useStoredState(AUTHORS_KEY, seedAuthors);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [view, setView] = useState("portal");
  const fileInputRef = useRef(null);

  const authorById = useMemo(() => new Map(authors.map((author) => [author.id, author])), [authors]);
  const bookRows = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return books
      .map((book) => ({ ...book, authorName: authorById.get(book.authorId)?.name || "SIN AUTOR" }))
      .filter((book) => {
        if (!normalizedSearch) return true;
        return book.title.includes(normalizedSearch) || book.authorName.includes(normalizedSearch);
      });
  }, [authorById, books, search]);

  const rows = useMemo(() => {
    const sourceRows = activeTab === "books" ? bookRows : authors;
    return sortRows(sourceRows, sortConfig);
  }, [activeTab, authors, bookRows, sortConfig]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedRows.includes(row.id));

  useEffect(() => {
    window.lucide?.createIcons();
  });

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [activeTab, search, pageSize, sortConfig]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }

  function showImportSummary(summary) {
    setImportSummary(summary);
    window.setTimeout(() => setImportSummary(null), 7000);
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedRows((currentRows) => currentRows.filter((id) => !visibleRows.some((row) => row.id === id)));
      return;
    }

    setSelectedRows((currentRows) => [...new Set([...currentRows, ...visibleRows.map((row) => row.id)])]);
  }

  function toggleRow(rowId) {
    setSelectedRows((currentRows) =>
      currentRows.includes(rowId) ? currentRows.filter((id) => id !== rowId) : [...currentRows, rowId]
    );
  }

  async function saveBook(form, editingBook) {
    const validation = validateBook(form, authors);
    if (Object.keys(validation).length > 0) return { ok: false, errors: validation };

    const isbn = cleanIsbn(form.isbn);
    const isbnIsValid = await validateIsbn(isbn);
    if (!isbnIsValid) return { ok: false, errors: { isbn: "El ISBN no es válido." } };

    const coverUrl = editingBook?.isbn === isbn ? editingBook.coverUrl : await fetchCoverUrl(isbn);
    const nextBook = {
      id: editingBook?.id || crypto.randomUUID(),
      title: normalizeText(form.title),
      isbn,
      authorId: form.authorId,
      pages: Number(form.pages),
      coverUrl
    };

    setBooks((currentBooks) =>
      editingBook
        ? currentBooks.map((book) => (book.id === editingBook.id ? nextBook : book))
        : [nextBook, ...currentBooks]
    );
    setModal(null);
    showNotice(editingBook ? "Libro actualizado." : "Libro creado.");
    return { ok: true };
  }

  function saveAuthor(form, editingAuthor) {
    const validation = validateAuthor(form);
    if (Object.keys(validation).length > 0) return { ok: false, errors: validation };

    const nextAuthor = {
      id: editingAuthor?.id || crypto.randomUUID(),
      name: normalizeText(form.name),
      birthDate: form.birthDate
    };

    setAuthors((currentAuthors) =>
      editingAuthor
        ? currentAuthors.map((author) => (author.id === editingAuthor.id ? nextAuthor : author))
        : [nextAuthor, ...currentAuthors]
    );
    setModal(null);
    showNotice(editingAuthor ? "Autor actualizado." : "Autor creado.");
    return { ok: true };
  }

  function deleteBook(bookId) {
    if (!window.confirm("¿Eliminar este libro?")) return;
    setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
    setSelectedRows((currentRows) => currentRows.filter((id) => id !== bookId));
    showNotice("Libro eliminado.");
  }

  function deleteAuthor(authorId) {
    if (!window.confirm("¿Eliminar este autor y todos sus libros asociados?")) return;
    setAuthors((currentAuthors) => currentAuthors.filter((author) => author.id !== authorId));
    setBooks((currentBooks) => currentBooks.filter((book) => book.authorId !== authorId));
    setSelectedRows((currentRows) => currentRows.filter((id) => id !== authorId));
    showNotice("Autor eliminado junto con sus libros asociados.");
  }

  function deleteSelectedRows() {
    if (selectedRows.length === 0) return;

    if (activeTab === "books") {
      if (!window.confirm(`¿Eliminar ${selectedRows.length} libro(s) seleccionado(s)?`)) return;
      setBooks((currentBooks) => currentBooks.filter((book) => !selectedRows.includes(book.id)));
      showNotice(`${selectedRows.length} libro(s) eliminado(s).`);
    } else {
      if (!window.confirm(`¿Eliminar ${selectedRows.length} autor(es) seleccionado(s) y sus libros asociados?`)) return;
      setAuthors((currentAuthors) => currentAuthors.filter((author) => !selectedRows.includes(author.id)));
      setBooks((currentBooks) => currentBooks.filter((book) => !selectedRows.includes(book.authorId)));
      showNotice(`${selectedRows.length} autor(es) eliminado(s) junto con sus libros asociados.`);
    }

    setSelectedRows([]);
  }

  async function importBooks(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showNotice("Solo se permiten archivos CSV.");
      return;
    }

    const text = await file.text();
    const result = await buildBooksFromCsv(text, authors);
    if (result.books.length > 0) setBooks((currentBooks) => [...result.books, ...currentBooks]);
    showImportSummary({ correct: result.books.length, errors: result.errors.length });
  }

  function goToPage(nextPage) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  function changeTab(tab) {
    setActiveTab(tab);
    setSortConfig(null);
  }

  function changeSort(key) {
    setSortConfig((currentSort) => {
      if (!currentSort || currentSort.key !== key) return { key, direction: "asc" };
      if (currentSort.direction === "asc") return { key, direction: "desc" };
      return { key, direction: "asc" };
    });
  }

  if (view === "requirements") {
    return <RequirementsPage onBack={() => setView("portal")} onOpenIsbn={() => setView("isbn")} />;
  }

  if (view === "isbn") {
    return <IsbnPage onBack={() => setView("portal")} onOpenChecklist={() => setView("requirements")} />;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-5 text-[15px] text-ink sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Sesión activa</p>
            <p className="mt-1 text-sm font-semibold">{user.email}</p>
          </div>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold transition hover:bg-surface" type="button" onClick={onLogout}>
            <i data-lucide="log-out" className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </header>

        <SegmentedTabs activeTab={activeTab} onChange={changeTab} />

        {notice ? <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div> : null}
        {importSummary ? <ImportSummary correct={importSummary.correct} errors={importSummary.errors} /> : null}

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchBox activeTab={activeTab} search={search} onSearch={setSearch} />
          <div className="flex flex-wrap items-center gap-3">
            {selectedRows.length > 0 ? (
              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100" type="button" onClick={deleteSelectedRows}>
                <i data-lucide="trash-2" className="h-4 w-4" aria-hidden="true" />
                Eliminar seleccionados
              </button>
            ) : null}
            <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-surface" type="button" onClick={() => setModal({ type: activeTab, mode: "create" })}>
              <i data-lucide="plus" className="h-4 w-4" aria-hidden="true" />
              Nuevo
            </button>
            {activeTab === "books" ? (
              <>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium shadow-sm transition hover:bg-surface" type="button" onClick={() => fileInputRef.current?.click()}>
                  <i data-lucide="download" className="h-4 w-4" aria-hidden="true" />
                  Importar
                </button>
                <input ref={fileInputRef} className="hidden" type="file" accept=".csv,text/csv" onChange={importBooks} />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            {activeTab === "books" ? (
              <BooksTable allVisibleSelected={allVisibleSelected} rows={visibleRows} selectedRows={selectedRows} sortConfig={sortConfig} toggleAllVisible={toggleAllVisible} toggleRow={toggleRow} onSort={changeSort} onEdit={(book) => setModal({ type: "books", mode: "edit", item: book })} onDelete={deleteBook} />
            ) : (
              <AuthorsTable allVisibleSelected={allVisibleSelected} rows={visibleRows} selectedRows={selectedRows} sortConfig={sortConfig} toggleAllVisible={toggleAllVisible} toggleRow={toggleRow} onSort={changeSort} onEdit={(author) => setModal({ type: "authors", mode: "edit", item: author })} onDelete={deleteAuthor} />
            )}
          </div>
        </div>

        <PaginationBar currentPage={currentPage} pageSize={pageSize} selectedCount={selectedRows.length} setPageSize={setPageSize} totalPages={totalPages} visibleCount={visibleRows.length} onPageChange={goToPage} />

        <AppFooter onOpenChecklist={() => setView("requirements")} onOpenIsbn={() => setView("isbn")} />
      </section>

      {modal?.type === "books" ? <BookModal authors={authors} book={modal.item} onClose={() => setModal(null)} onSave={saveBook} /> : null}
      {modal?.type === "authors" ? <AuthorModal author={modal.item} onClose={() => setModal(null)} onSave={saveAuthor} /> : null}
    </main>
  );
}

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

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function SegmentedTabs({ activeTab, onChange }) {
  return (
    <div className="mx-auto grid h-12 w-full max-w-[520px] grid-cols-2 rounded-lg bg-[#f1f1f3] p-1">
      <button className={`rounded-lg text-base font-semibold transition ${activeTab === "books" ? "bg-white text-black shadow-sm" : "text-[#73737d] hover:text-black"}`} type="button" onClick={() => onChange("books")}>Libros</button>
      <button className={`rounded-lg text-base font-semibold transition ${activeTab === "authors" ? "bg-white text-black shadow-sm" : "text-[#73737d] hover:text-black"}`} type="button" onClick={() => onChange("authors")}>Autores</button>
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

function BooksTable({ allVisibleSelected, rows, selectedRows, sortConfig, toggleAllVisible, toggleRow, onSort, onEdit, onDelete }) {
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

function AuthorsTable({ allVisibleSelected, rows, selectedRows, sortConfig, toggleAllVisible, toggleRow, onSort, onEdit, onDelete }) {
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

function BookModal({ authors, book, onClose, onSave }) {
  const [form, setForm] = useState(book ? { title: toDisplayCase(book.title), isbn: book.isbn, authorId: book.authorId, pages: String(book.pages) } : emptyBookForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const result = await onSave(form, book);
    setSaving(false);
    if (!result.ok) setErrors(result.errors);
  }

  return (
    <Modal title={book ? "Editar libro" : "Nuevo libro"} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <TextField error={errors.title} label="Título" name="title" value={form.title} onChange={setForm} maxLength={90} />
        <TextField error={errors.isbn} label="ISBN" name="isbn" value={form.isbn} onChange={setForm} maxLength={17} />
        <label className="block">
          <span className="text-sm font-medium">Autor</span>
          <span className="relative mt-2 block">
            <select className={`h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-[15px] outline-none focus:ring-0 ${errors.authorId ? "border-red-500" : "border-line"}`} value={form.authorId} onChange={(event) => setForm((current) => ({ ...current, authorId: event.target.value }))}>
              <option value="">Selecciona un autor</option>
              {authors.map((author) => <option key={author.id} value={author.id}>{toDisplayCase(author.name)}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <FieldError error={errors.authorId} />
        </label>
        <TextField error={errors.pages} label="Número de páginas" name="pages" type="number" value={form.pages} onChange={setForm} maxLength={5} />
        <ModalActions saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

function AuthorModal({ author, onClose, onSave }) {
  const [form, setForm] = useState(author ? { name: toDisplayCase(author.name), birthDate: author.birthDate } : emptyAuthorForm);
  const [errors, setErrors] = useState({});

  function submit(event) {
    event.preventDefault();
    const result = onSave(form, author);
    if (!result.ok) setErrors(result.errors);
  }

  return (
    <Modal title={author ? "Editar autor" : "Nuevo autor"} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <TextField error={errors.name} label="Nombre" name="name" value={form.name} onChange={setForm} maxLength={70} />
        <TextField error={errors.birthDate} label="Fecha de nacimiento" name="birthDate" type="date" value={form.birthDate} onChange={setForm} />
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

function Modal({ children, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
      <section className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface" type="button" onClick={onClose} aria-label="Cerrar">
            <i data-lucide="x" className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function TextField({ error, label, name, onChange, type = "text", value, maxLength }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input className={`mt-2 h-10 w-full rounded-lg border px-3 text-[15px] outline-none transition ${type === "number" ? "no-number-spinner" : ""} ${error ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-line focus:border-line focus:ring-0"}`} maxLength={maxLength} name={name} onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))} type={type} value={value} />
      <FieldError error={error} />
    </label>
  );
}

function FieldError({ error }) {
  return error ? <span className="mt-2 block text-xs font-medium text-red-600">{error}</span> : null;
}

function ModalActions({ saving, onClose }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button className="h-10 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-surface" type="button" onClick={onClose}>Cancelar</button>
      <button className="h-10 rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
    </div>
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

function validateBook(form, authors) {
  const errors = {};
  const normalizedTitle = normalizeText(form.title);
  const isbn = cleanIsbn(form.isbn);
  const pages = Number(form.pages);
  if (!normalizedTitle) errors.title = "El título es obligatorio.";
  else if (normalizedTitle.length < 2 || normalizedTitle.length > 90) errors.title = "El título debe tener entre 2 y 90 caracteres.";
  else if (/\d/.test(normalizedTitle)) errors.title = "El título no puede contener números.";
  if (!isbn) errors.isbn = "El ISBN es obligatorio.";
  else if (!isValidIsbnChecksum(isbn)) errors.isbn = "Ingresa un ISBN válido de 10 o 13 dígitos.";
  if (!authors.some((author) => author.id === form.authorId)) errors.authorId = "Selecciona un autor.";
  if (!Number.isInteger(pages) || pages < 1 || pages > 99999) errors.pages = "Las páginas deben ser un número entre 1 y 99999.";
  return errors;
}

function sortRows(rows, sortConfig) {
  if (!sortConfig) return rows;

  return [...rows].sort((firstRow, secondRow) => {
    const firstValue = getSortValue(firstRow, sortConfig.key);
    const secondValue = getSortValue(secondRow, sortConfig.key);
    const result = firstValue.localeCompare(secondValue, "es", {
      numeric: true,
      sensitivity: "base"
    });

    return sortConfig.direction === "asc" ? result : -result;
  });
}

function getSortValue(row, key) {
  return String(row[key] || "");
}

function validateAuthor(form) {
  const errors = {};
  const normalizedName = normalizeText(form.name);
  if (!normalizedName) errors.name = "El nombre es obligatorio.";
  else if (normalizedName.length < 2 || normalizedName.length > 70) errors.name = "El nombre debe tener entre 2 y 70 caracteres.";
  else if (/\d/.test(normalizedName)) errors.name = "El nombre no puede contener números.";
  if (!form.birthDate) errors.birthDate = "La fecha de nacimiento es obligatoria.";
  else if (new Date(`${form.birthDate}T00:00:00`) > new Date()) errors.birthDate = "La fecha no puede estar en el futuro.";
  return errors;
}

async function validateIsbn(isbn) {
  const method = isbn.length === 10 ? "IsValidISBN10" : "IsValidISBN13";
  try {
    const response = await fetch("https://webservices.daehosting.com/services/isbnservice.wso", {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `http://webservices.daehosting.com/ISBNService/${method}` },
      body: `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${method} xmlns="http://webservices.daehosting.com/ISBNService"><sISBN>${isbn}</sISBN></${method}></soap:Body></soap:Envelope>`
    });
    const xml = await response.text();
    if (xml.includes("true")) return true;
    if (xml.includes("false")) return false;
  } catch {
    return isValidIsbnChecksum(isbn);
  }
  return isValidIsbnChecksum(isbn);
}

async function fetchCoverUrl(isbn) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json`);
    const data = await response.json();
    const details = data[`ISBN:${isbn}`];
    return details?.thumbnail_url?.replace("-S.", "-M.") || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  } catch {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  }
}

async function buildBooksFromCsv(text, authors) {
  const rows = parseCsv(text);
  const headers = rows.shift()?.map((header) => normalizeHeader(header)) || [];
  const result = { books: [], errors: [] };

  for (const [index, values] of rows.entries()) {
    const raw = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] || ""]));
    const author = authors.find((item) => item.id === raw.authorid || item.id === raw.iddeautor || item.name === normalizeText(raw.author || raw.autor));
    const form = {
      title: raw.title || raw.titulo,
      isbn: raw.isbn,
      authorId: raw.authorid || raw.iddeautor || author?.id || "",
      pages: raw.pages || raw.paginas || raw.numerodepaginas
    };
    const errors = validateBook(form, authors);
    const isbn = cleanIsbn(form.isbn);
    if (Object.keys(errors).length > 0 || !(await validateIsbn(isbn))) {
      result.errors.push(index + 2);
      continue;
    }
    result.books.push({ id: crypto.randomUUID(), title: normalizeText(form.title), isbn, authorId: form.authorId, pages: Number(form.pages), coverUrl: await fetchCoverUrl(isbn) });
  }

  return result;
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const values = [];
    let value = "";
    let quoted = false;
    for (const char of line) {
      if (char === "\"") quoted = !quoted;
      else if (char === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else value += char;
    }
    values.push(value.trim());
    return values;
  }).filter((row) => row.some(Boolean));
}

function normalizeHeader(value) {
  return normalizeText(value).replaceAll(" ", "").toLowerCase();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ñ/g, "N")
    .replace(/ñ/g, "N")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function cleanIsbn(value) {
  return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

function isValidIsbnChecksum(isbn) {
  if (/^\d{13}$/.test(isbn)) {
    const sum = isbn.split("").reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = isbn.split("").reduce((total, digit, index) => total + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0);
    return sum % 11 === 0;
  }
  return false;
}

function formatIsbn(isbn) {
  return isbn.length === 13 ? `${isbn.slice(0, 3)}-${isbn.slice(3)}` : isbn;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function toDisplayCase(value) {
  return value.toLowerCase().split(" ").filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default DashboardHome;
