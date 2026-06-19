export function cleanIsbn(value) {
  return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbnChecksum(isbn) {
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

export async function validateIsbn(isbn) {
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

export async function fetchCoverUrl(isbn, catchFallback = getCoverUrl(isbn)) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json`);
    const data = await response.json();
    const details = data[`ISBN:${isbn}`];
    return details?.thumbnail_url?.replace("-S.", "-M.") || getCoverUrl(isbn);
  } catch {
    return catchFallback;
  }
}

function getCoverUrl(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}
