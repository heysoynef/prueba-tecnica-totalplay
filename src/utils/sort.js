export function sortRows(rows, sortConfig) {
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
