import { cleanIsbn, fetchCoverUrl, isValidIsbnChecksum, validateIsbn } from "./isbn.js";
import { normalizeText } from "./text.js";

export function validateBook(form, authors) {
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

export async function buildBooksFromCsv(text, authors) {
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
