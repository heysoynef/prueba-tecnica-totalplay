const requirementGroups = [
  {
    title: "Base del proyecto",
    items: [
      "React JS versión 17 exacta",
      "Proyecto creado con Vite",
      "Tailwind CSS por CDN",
      "Lucide Icons por CDN",
      "Versión responsive"
    ]
  },
  {
    title: "Autenticación",
    items: [
      "Inicio de sesión",
      "Usuarios simulados desde JSON",
      "JWT simulado para sesión",
      "Expiración de sesión después de 1 hora",
      "Aviso al expirar la sesión"
    ]
  },
  {
    title: "Libros",
    items: [
      "CRUD de libros",
      "Campos requeridos: ID, título, ISBN, autor, páginas y portada",
      "ID generado automáticamente como UUID",
      "La portada no se pide al crear libro",
      "Portada obtenida por API REST",
      "Validación de ISBN tipo SOAP con respaldo local",
      "Consulta paginada",
      "Búsqueda por título y autor",
      "Carga masiva desde CSV"
    ]
  },
  {
    title: "Autores",
    items: [
      "CRUD de autores",
      "Campos requeridos: ID, nombre y fecha de nacimiento",
      "ID generado automáticamente como UUID",
      "Consulta paginada",
      "Eliminación en cascada de libros al borrar autor"
    ]
  },
  {
    title: "Validaciones",
    items: [
      "Campos obligatorios",
      "Validación de tamaños",
      "Campos con error resaltado",
      "Normalización a mayúsculas",
      "Conversión de caracteres especiales",
      "Bloqueo de números en título y nombre",
      "Bloqueo de espacios en blanco seguidos"
    ]
  }
];

function RequirementsPage({ onBack, onOpenIsbn }) {
  return (
    <main className="min-h-screen bg-white px-4 py-5 text-[15px] text-ink sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col">
        <header className="mb-8 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Prueba técnica Frontend</p>
            <h1 className="mt-1 text-2xl font-semibold">Checklist de requerimientos</h1>
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

        <div className="grid gap-4 md:grid-cols-2">
          {requirementGroups.map((group) => (
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm" key={group.title}>
              <h2 className="text-base font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li className="flex items-start gap-3 text-sm text-muted" key={item}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <i data-lucide="check" className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <AppFooter onOpenChecklist={null} onOpenIsbn={onOpenIsbn} />
      </section>
    </main>
  );
}

function AppFooter({ onOpenChecklist, onOpenIsbn }) {
  return (
    <footer className="mt-auto flex flex-col gap-2 border-t border-line py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>Gestión de libros · Prueba técnica Frontend</span>
      <div className="flex flex-wrap items-center gap-4">
        {onOpenIsbn ? (
          <button className="text-left font-semibold text-ink hover:underline" type="button" onClick={onOpenIsbn}>
            Explorar libros
          </button>
        ) : (
          <span className="font-semibold text-ink">Explorar libros</span>
        )}
        {onOpenChecklist ? (
          <button className="text-left font-semibold text-ink hover:underline" type="button" onClick={onOpenChecklist}>
            Ver checklist de requerimientos
          </button>
        ) : (
          <span className="font-semibold text-ink">Checklist de requerimientos</span>
        )}
      </div>
    </footer>
  );
}

export { AppFooter };
export default RequirementsPage;
