import { useEffect, useState } from "react";

const initialForm = {
  email: "",
  password: ""
};

const demoCredentials = {
  email: "admin@demo.com",
  password: "Admin123"
};

function LoginPage({ expiredMessage, onLogin }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.lucide?.createIcons();
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateLogin(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = onLogin(form);

    if (!result.ok) {
      setErrors({ form: result.message });
    }
  }

  function fillDemoCredentials() {
    setForm(demoCredentials);
    setErrors({});
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f8] px-4 py-8 text-ink">
      <div className="w-full max-w-md">
        <section className="rounded-lg border border-line bg-white p-8 shadow-sm">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white">
            <i data-lucide="book-open" className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted">Accede al portal de gestión de libros.</p>

          {expiredMessage ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {expiredMessage}
            </div>
          ) : null}

          {errors.form ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <Field
              error={errors.email}
              label="Correo"
              name="email"
              onChange={handleChange}
              placeholder="admin@demo.com"
              type="email"
              value={form.email}
            />
            <Field
              error={errors.password}
              label="Contraseña"
              name="password"
              onChange={handleChange}
              placeholder="Admin123"
              type="password"
              value={form.password}
            />

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black"
              type="submit"
            >
              <i data-lucide="log-in" className="h-4 w-4" aria-hidden="true" />
              Entrar
            </button>
          </form>
        </section>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            Accesos: <span className="font-semibold text-ink">{demoCredentials.email}</span> /{" "}
            <span className="font-semibold text-ink">{demoCredentials.password}</span>
          </p>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold transition hover:bg-surface"
            type="button"
            onClick={fillDemoCredentials}
          >
            <i data-lucide="copy" className="h-4 w-4" aria-hidden="true" />
            Usar accesos
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ error, label, name, onChange, placeholder, type, value }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className={`mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
            : "border-line focus:border-ink focus:ring-gray-100"
        }`}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="mt-2 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function validateLogin(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio.";
  }

  if (!form.password.trim()) {
    errors.password = "La contraseña es obligatoria.";
  }

  return errors;
}

export default LoginPage;
