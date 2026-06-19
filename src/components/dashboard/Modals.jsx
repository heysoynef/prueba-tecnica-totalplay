import { useState } from "react";
import { toDisplayCase } from "../../utils/text.js";

const emptyBookForm = { title: "", isbn: "", authorId: "", pages: "" };
const emptyAuthorForm = { name: "", birthDate: "" };

export function BookModal({ authors, book, onClose, onSave }) {
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

export function AuthorModal({ author, onClose, onSave }) {
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
