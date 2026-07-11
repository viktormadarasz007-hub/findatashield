export function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";

  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  const escapeCsv = (value: unknown) => {
    const raw =
      value === null || value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    const escaped = raw.replaceAll('"', '""');
    return `"${escaped}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];

  return lines.join("\n");
}

export function downloadCsvFile(
  filename: string,
  rows: Array<Record<string, unknown>>,
): void {
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function csvFilename(dataType: string, count: number): string {
  const safeType = dataType.toLowerCase().replaceAll(/\s+/g, "-");
  return `${safeType}-${count}.csv`;
}
