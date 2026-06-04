export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r))),
  );
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    let str = typeof value === "string" ? value : JSON.stringify(value);
    // CSV formula-injection defense: spreadsheets treat a leading =, +, -, @,
    // tab, or CR as a formula trigger. Prefix with a single quote to neutralize.
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map((h) => escape(h)).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\r\n");
}
