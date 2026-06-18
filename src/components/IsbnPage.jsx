import { useEffect, useState } from "react";
import { AppFooter } from "./RequirementsPage.jsx";

const SEARCH_QUERIES = [
  "subject:fiction",
  "subject:novel",
  "subject:classic",
  "subject:fantasy",
  "subject:history",
  "subject:mystery",
  "subject:adventure",
  "subject:literature"
];

function IsbnPage({ onBack, onOpenChecklist }) {
  const [samples, setSamples] = useState([]);
  const [isbn, setIsbn] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(true);

  useEffect(() => {
    window.lucide?.createIcons();
  });

  useEffect(() => {
    loadSampleBooks();
  }, []);

  async function loadSampleBooks() {
    setLoadingSamples(true);
    setResult(null);

    const nextSamples = await fetchRandomSampleBooks();
    setSamples(nextSamples);
    setIsbn(nextSamples[0]?.isbn || "");

    setLoadingSamples(false);
  }

  async function handleCheck(event) {
    event.preventDefault();
    const cleaned = cleanIsbn(isbn);

    if (!cleaned) {
      setResult({ valid: false, coverFound: false, coverUrl: "", message: "Escribe un ISBN." });
      return;
    }

    setLoading(true);
    const valid = isValidIsbnChecksum(cleaned);
    const coverUrl = await fetchCoverUrl(cleaned);
    setResult({
      valid,
      coverFound: Boolean(coverUrl),
      coverUrl,
      message: valid ? "ISBN valido para prueba." : "ISBN invalido."
    });
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-5 text-[15px] text-ink sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col">
        <header className="mb-8 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Prueba tecnica Frontend</p>
            <h1 className="mt-1 text-2xl font-semibold">Explorar libros</h1>
          </div>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold shadow-sm transition hover:bg-surface"
            type="button"
            onClick={onBack}
          >
            <i data-lucide="arrow-left" className="h-4 w-4" aria-hidden="true" />
            Volver al portal
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">Libros aleatorios desde Open Library</h2>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold shadow-sm transition hover:bg-surface disabled:opacity-60"
                type="button"
                onClick={loadSampleBooks}
                disabled={loadingSamples}
              >
                <i data-lucide="refresh-cw" className="h-4 w-4" aria-hidden="true" />
                {loadingSamples ? "Cargando..." : "Mostrar otros"}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {samples.map((item) => (
                <button
                  key={`${item.isbn}-${item.title}`}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-left transition hover:bg-surface"
                  type="button"
                  onClick={() => setIsbn(item.isbn)}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{item.title}</span>
                    <span className="mt-1 block text-sm text-muted">{item.isbn}</span>
                  </span>
                  <i data-lucide="arrow-up-right" className="h-4 w-4 text-muted" aria-hidden="true" />
                </button>
              ))}
              {!loadingSamples && samples.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-muted">
                  No se encontraron ISBNs reales en este intento. Vuelve a cargar.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Probar ISBN</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCheck}>
              <label className="block">
                <span className="text-sm font-medium">ISBN</span>
                <input
                  className="mt-2 h-10 w-full rounded-lg border border-line px-3 text-[15px] outline-none focus:border-line focus:ring-0"
                  value={isbn}
                  onChange={(event) => setIsbn(event.target.value)}
                />
              </label>
              <button
                className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Consultando..." : "Validar ISBN"}
              </button>
            </form>

            {result ? (
              <div className="mt-5 rounded-lg border border-line bg-[#fafafa] p-4">
                <p className="text-sm font-semibold text-ink">{result.message}</p>
                <p className="mt-2 text-sm text-muted">Valido: {result.valid ? "Si" : "No"}</p>
                <p className="mt-1 text-sm text-muted">Portada encontrada: {result.coverFound ? "Si" : "No"}</p>
                {result.coverUrl ? (
                  <a
                    className="mt-3 inline-flex text-sm font-semibold text-ink underline"
                    href={result.coverUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir portada
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <AppFooter onOpenChecklist={onOpenChecklist} onOpenIsbn={null} />
      </section>
    </main>
  );
}

async function fetchRandomSampleBooks() {
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
  const page = Math.floor(Math.random() * 20) + 1;
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: "30",
    fields: "title,isbn"
  });

  try {
    const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
    const data = await response.json();

    const candidates = (data.docs || [])
      .map((doc) => {
        const isbn = (doc.isbn || []).find((value) => /^\d{13}$/.test(value));
        return isbn ? { title: doc.title || "SIN TITULO", isbn } : null;
      })
      .filter(Boolean);

    return uniqueByIsbn(shuffle(candidates)).slice(0, 6);
  } catch {
    return [];
  }
}

function uniqueByIsbn(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.isbn)) return false;
    seen.add(item.isbn);
    return true;
  });
}

function shuffle(items) {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }
  return nextItems;
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

async function fetchCoverUrl(isbn) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json`);
    const data = await response.json();
    const details = data[`ISBN:${isbn}`];
    return details?.thumbnail_url?.replace("-S.", "-M.") || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  } catch {
    return "";
  }
}

export default IsbnPage;
