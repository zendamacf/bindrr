/**
 * Parses CSV text into rows of fields. Follows RFC 4180: quoted fields can hold
 * commas, line breaks and doubled quotes. Each record has the line number where it starts.
 */
export type CsvRecord = { line: number; fields: string[] };

export function parseCsv(text: string): CsvRecord[] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records: CsvRecord[] = [];

  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    fields.push(field);
    const isBlank = fields.length === 1 && fields[0].trim() === '';
    if (!isBlank) records.push({ line: recordLine, fields });
    fields = [];
    field = '';
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === '\n') line++;
        field += char;
      }
      continue;
    }

    if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      endRecord();
      line++;
      recordLine = line;
    } else {
      field += char;
    }
  }

  if (field !== '' || fields.length > 0) endRecord();

  return records;
}
