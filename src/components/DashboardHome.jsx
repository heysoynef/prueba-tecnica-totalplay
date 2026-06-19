import { useEffect, useMemo, useState } from "react";
import seedBooks from "../data/books.json";
import seedAuthors from "../data/authors.json";
import { useStoredState } from "../hooks/useStoredState.js";
import { validateAuthor } from "../utils/authors.js";
import { buildBooksFromCsv, validateBook } from "../utils/books.js";
import { cleanIsbn, fetchCoverUrl, validateIsbn } from "../utils/isbn.js";
import { sortRows } from "../utils/sort.js";
import { normalizeText } from "../utils/text.js";
import DashboardToolbar from "./dashboard/DashboardToolbar.jsx";
import ImportSummary from "./dashboard/ImportSummary.jsx";
import { BookModal, AuthorModal } from "./dashboard/Modals.jsx";
import PaginationBar from "./dashboard/PaginationBar.jsx";
import SegmentedTabs from "./dashboard/SegmentedTabs.jsx";
import { BooksTable, AuthorsTable } from "./dashboard/Tables.jsx";
import RequirementsPage, { AppFooter } from "./RequirementsPage.jsx";
import IsbnPage from "./IsbnPage.jsx";

const BOOKS_KEY = "bookPortalBooksV2";
const AUTHORS_KEY = "bookPortalAuthorsV2";

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
  const [isImporting, setIsImporting] = useState(false);
  const [view, setView] = useState("portal");

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
    if (isImporting) return;
    if (!window.confirm("¿Eliminar este libro?")) return;
    setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
    setSelectedRows((currentRows) => currentRows.filter((id) => id !== bookId));
    showNotice("Libro eliminado.");
  }

  function deleteAuthor(authorId) {
    if (isImporting) return;
    if (!window.confirm("¿Eliminar este autor y todos sus libros asociados?")) return;
    setAuthors((currentAuthors) => currentAuthors.filter((author) => author.id !== authorId));
    setBooks((currentBooks) => currentBooks.filter((book) => book.authorId !== authorId));
    setSelectedRows((currentRows) => currentRows.filter((id) => id !== authorId));
    showNotice("Autor eliminado junto con sus libros asociados.");
  }

  function deleteSelectedRows() {
    if (isImporting) return;
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
    if (isImporting) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showNotice("Solo se permiten archivos CSV.");
      return;
    }

    setIsImporting(true);
    setImportSummary(null);
    try {
      const text = await file.text();
      const result = await buildBooksFromCsv(text, authors);
      if (result.books.length > 0) setBooks((currentBooks) => [...result.books, ...currentBooks]);
      showImportSummary({ correct: result.books.length, errors: result.errors.length });
    } catch {
      showImportSummary({ correct: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
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

        <DashboardToolbar
          activeTab={activeTab}
          isImporting={isImporting}
          search={search}
          selectedCount={selectedRows.length}
          onCreate={() => setModal({ type: activeTab, mode: "create" })}
          onDeleteSelected={deleteSelectedRows}
          onImportBooks={importBooks}
          onSearch={setSearch}
        />

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

export default DashboardHome;
