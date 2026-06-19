import { normalizeText } from "./text.js";

export function validateAuthor(form) {
  const errors = {};
  const normalizedName = normalizeText(form.name);
  if (!normalizedName) errors.name = "El nombre es obligatorio.";
  else if (normalizedName.length < 2 || normalizedName.length > 70) errors.name = "El nombre debe tener entre 2 y 70 caracteres.";
  else if (/\d/.test(normalizedName)) errors.name = "El nombre no puede contener números.";
  if (!form.birthDate) errors.birthDate = "La fecha de nacimiento es obligatoria.";
  else if (new Date(`${form.birthDate}T00:00:00`) > new Date()) errors.birthDate = "La fecha no puede estar en el futuro.";
  return errors;
}
