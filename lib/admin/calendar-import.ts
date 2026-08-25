import { inflateSync } from "node:zlib";

import type { $Enums } from "@/generated/prisma/client";

export type ImportedCalendarEvent = {
  title: string;
  eventType: $Enums.CalendarEventType;
  startDate: Date;
  endDate: Date | null;
  description: string;
};

export type CalendarImportResult = {
  academicYear: string | null;
  region: string;
  events: ImportedCalendarEvent[];
  warnings: string[];
};

type PdfObject = {
  start: number;
  body: string;
};

type FontDefinition = {
  identity: boolean;
  cmap: Map<number, string>;
};

type TextToken = {
  x: number;
  y: number;
  text: string;
};

type CalendarRow = {
  y: number;
  dateText: string;
  dayText: string;
  titleText: string;
  regionMarker: string;
};

const CP1252 = new Map<number, string>([
  [0x80, "€"],
  [0x82, "‚"],
  [0x83, "ƒ"],
  [0x84, "„"],
  [0x85, "…"],
  [0x86, "†"],
  [0x87, "‡"],
  [0x88, "ˆ"],
  [0x89, "‰"],
  [0x8a, "Š"],
  [0x8b, "‹"],
  [0x8c, "Œ"],
  [0x8e, "Ž"],
  [0x91, "‘"],
  [0x92, "’"],
  [0x93, "“"],
  [0x94, "”"],
  [0x95, "•"],
  [0x96, "–"],
  [0x97, "—"],
  [0x98, "˜"],
  [0x99, "™"],
  [0x9a, "š"],
  [0x9b, "›"],
  [0x9c, "œ"],
  [0x9e, "ž"],
  [0x9f, "Ÿ"],
]);

function buildPdfObjects(buffer: Buffer) {
  const source = buffer.toString("latin1");
  const pattern = /(?:^|\r?\n)(\d+)\s+0\s+obj\b/g;
  const positions: Array<{ id: number; start: number }> = [];

  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    positions.push({
      id: Number(match[1]),
      start: match.index + match[0].lastIndexOf(match[1]),
    });
  }

  const objects = new Map<number, PdfObject>();

  positions.forEach((position, index) => {
    objects.set(position.id, {
      start: position.start,
      body: source.slice(
        position.start,
        positions[index + 1]?.start ?? source.length,
      ),
    });
  });

  return { objects, source };
}

function readDecodedStream(
  buffer: Buffer,
  source: string,
  objects: Map<number, PdfObject>,
  objectId: number,
) {
  const object = objects.get(objectId);

  if (!object) {
    return null;
  }

  const marker = object.body.indexOf("stream");

  if (marker === -1) {
    return null;
  }

  const header = object.body.slice(0, marker);
  let start = object.start + marker + "stream".length;

  if (source.slice(start, start + 2) === "\r\n") {
    start += 2;
  } else if (source[start] === "\n" || source[start] === "\r") {
    start += 1;
  }

  const localEnd = object.body.indexOf("endstream", marker);

  if (localEnd === -1) {
    return null;
  }

  let end = object.start + localEnd;

  while (
    end > start &&
    (buffer[end - 1] === 10 || buffer[end - 1] === 13)
  ) {
    end -= 1;
  }

  const stream = buffer.subarray(start, end);

  if (!/\/FlateDecode\b/.test(header)) {
    return stream;
  }

  try {
    return inflateSync(stream);
  } catch {
    return null;
  }
}

function buildCMap(
  buffer: Buffer,
  source: string,
  objects: Map<number, PdfObject>,
  objectId: number,
) {
  const stream = readDecodedStream(buffer, source, objects, objectId);
  const map = new Map<number, string>();

  if (!stream) {
    return map;
  }

  const cmap = stream.toString("latin1");

  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const match of block[1].matchAll(
      /<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4,8})>/g,
    )) {
      map.set(
        Number.parseInt(match[1], 16),
        String.fromCodePoint(Number.parseInt(match[2], 16)),
      );
    }
  }

  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const match of block[1].matchAll(
      /<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4})>\s+<([0-9A-Fa-f]{4,8})>/g,
    )) {
      const first = Number.parseInt(match[1], 16);
      const last = Number.parseInt(match[2], 16);
      const destination = Number.parseInt(match[3], 16);

      for (let value = first; value <= last; value += 1) {
        map.set(
          value,
          String.fromCodePoint(destination + value - first),
        );
      }
    }
  }

  return map;
}

function parseFonts(
  buffer: Buffer,
  source: string,
  objects: Map<number, PdfObject>,
  pageObjectId: number,
) {
  const page = objects.get(pageObjectId)?.body ?? "";
  const fonts = new Map<string, FontDefinition>();

  for (const match of page.matchAll(/\/F(\d+)\s+(\d+)\s+0\s+R/g)) {
    const name = `F${match[1]}`;
    const fontBody = objects.get(Number(match[2]))?.body ?? "";
    const unicodeReference = fontBody.match(
      /\/ToUnicode\s+(\d+)\s+0\s+R/,
    );

    fonts.set(name, {
      identity: /\/Encoding\s+\/Identity-H/.test(fontBody),
      cmap: unicodeReference
        ? buildCMap(
            buffer,
            source,
            objects,
            Number(unicodeReference[1]),
          )
        : new Map(),
    });
  }

  return fonts;
}

function decodeBytes(values: number[]) {
  return values
    .map((value) => CP1252.get(value) ?? String.fromCharCode(value))
    .join("");
}

function decodeLiteral(value: string) {
  const output: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character !== "\\") {
      output.push(character.charCodeAt(0) & 0xff);
      continue;
    }

    const next = value[index + 1];

    if (/[0-7]/.test(next ?? "")) {
      const octal = value.slice(index + 1).match(/^[0-7]{1,3}/)?.[0] ?? "";
      output.push(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    const escapes: Record<string, number> = {
      n: 10,
      r: 13,
      t: 9,
      b: 8,
      f: 12,
    };

    output.push(escapes[next] ?? next?.charCodeAt(0) ?? 92);
    index += 1;
  }

  return decodeBytes(output);
}

function decodeHex(value: string, font: FontDefinition | undefined) {
  if (font?.identity) {
    let result = "";

    for (let index = 0; index + 3 < value.length; index += 4) {
      const code = Number.parseInt(value.slice(index, index + 4), 16);
      result += font.cmap.get(code) ?? "";
    }

    return result;
  }

  const values =
    value.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [];

  return decodeBytes(values);
}

function decodeText(value: string, font: FontDefinition | undefined) {
  const pieces: string[] = [];
  const pattern = /\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]+>/g;

  for (const match of value.matchAll(pattern)) {
    const token = match[0];
    pieces.push(
      token.startsWith("(")
        ? decodeLiteral(token.slice(1, -1))
        : decodeHex(token.slice(1, -1).replace(/\s+/g, ""), font),
    );
  }

  return pieces.join("");
}

function extractTokens(
  buffer: Buffer,
  source: string,
  objects: Map<number, PdfObject>,
  pageObjectId: number,
  contentObjectId: number,
) {
  const fonts = parseFonts(buffer, source, objects, pageObjectId);
  const stream =
    readDecodedStream(buffer, source, objects, contentObjectId)?.toString(
      "latin1",
    ) ?? "";
  const tokens: TextToken[] = [];
  const pattern =
    /\/F\d+\s+[\d.]+\s+Tf|1\s+0\s+0\s+1\s+-?[\d.]+\s+-?[\d.]+\s+Tm|\[(?:[^\]]|\](?!\s*TJ))*\]\s*TJ|(?:\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]+>)\s*Tj/g;
  let fontName = "F1";
  let x = 0;
  let y = 0;

  for (const match of stream.matchAll(pattern)) {
    const command = match[0];
    const fontMatch = command.match(/^\/(F\d+)/);

    if (fontMatch) {
      fontName = fontMatch[1];
      continue;
    }

    const matrix = command.match(
      /^1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Tm/,
    );

    if (matrix) {
      x = Number(matrix[1]);
      y = Number(matrix[2]);
      continue;
    }

    const text = command.trimStart().startsWith("[")
      ? decodeText(
          command.slice(command.indexOf("[") + 1, command.lastIndexOf("]")),
          fonts.get(fontName),
        )
      : decodeText(command.replace(/\s*Tj$/, ""), fonts.get(fontName));

    if (text.trim()) {
      tokens.push({ x, y, text });
    }
  }

  return tokens;
}

function joinColumn(tokens: TextToken[]) {
  return tokens
    .sort((left, right) => left.x - right.x)
    .map((token) => token.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function createRows(tokens: TextToken[]) {
  const grouped = new Map<string, TextToken[]>();

  for (const token of tokens) {
    const key = token.y.toFixed(2);
    const row = grouped.get(key) ?? [];
    row.push(token);
    grouped.set(key, row);
  }

  return [...grouped.entries()]
    .map(([key, row]): CalendarRow => ({
      y: Number(key),
      dateText: joinColumn(row.filter((token) => token.x < 189)),
      dayText: joinColumn(
        row.filter((token) => token.x >= 189 && token.x < 288),
      ),
      titleText: joinColumn(
        row.filter((token) => token.x >= 288 && token.x < 441),
      ),
      regionMarker: joinColumn(
        row.filter((token) => token.x >= 441 && token.x < 527),
      ),
    }))
    .sort((left, right) => right.y - left.y);
}

function normaliseDateText(value: string) {
  return value
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .replace(/\bto\b/gi, " to ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIndianDate(value: string) {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000+05:30`,
  );
  const verifiedDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  if (verifiedDate !== `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`) {
    return null;
  }

  return date;
}

function parseDateRange(value: string) {
  const normalised = normaliseDateText(value);
  const matches = [...normalised.matchAll(/\d{1,2}\/\d{1,2}\/\d{4}/g)];

  if (matches.length === 0) {
    return null;
  }

  const startDate = parseIndianDate(matches[0][0]);
  const endDate = matches[1] ? parseIndianDate(matches[1][0]) : null;

  if (!startDate || (matches[1] && !endDate)) {
    return null;
  }

  return { startDate, endDate };
}

function eventTypeForTitle(title: string): $Enums.CalendarEventType {
  const value = title.toLowerCase();

  if (/break|holiday|vacation/.test(value)) {
    return "HOLIDAY";
  }

  if (/meeting|orientation|ptm|parent/.test(value)) {
    return "MEETING";
  }

  if (/deadline|last date|submission/.test(value)) {
    return "DEADLINE";
  }

  if (/activity|competition|workshop|camp/.test(value)) {
    return "ACTIVITY";
  }

  if (
    /jayanti|day|holi|diwali|eid|christmas|navami|dussehra|purnima|sankranti|pongal|janmashtami|chaturthi/.test(
      value,
    )
  ) {
    return "CELEBRATION";
  }

  return "ACADEMIC";
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+([/,-])/g, "$1")
    .replace(/([/-])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function markerIsEnabled(value: string) {
  if (!value.trim()) {
    return false;
  }

  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) > 0 : true;
}

export function importKidzeeCalendarPdf(
  buffer: Buffer,
  region = "Delhi, NCR, UK, Haryana",
): CalendarImportResult {
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The uploaded file is not a valid PDF calendar.");
  }

  const { objects, source } = buildPdfObjects(buffer);
  const pagesObject = [...objects.entries()].find(([, object]) =>
    /\/Type\s+\/Pages\b/.test(object.body),
  );

  if (!pagesObject) {
    throw new Error("The PDF does not contain readable calendar pages.");
  }

  const pageIds = [
    ...pagesObject[1].body.matchAll(/(\d+)\s+0\s+R/g),
  ].map((match) => Number(match[1]));
  const allRows: CalendarRow[] = [];
  let titleText = "";

  for (const pageId of pageIds) {
    const pageBody = objects.get(pageId)?.body ?? "";

    if (!/\/Type\s+\/Page\b/.test(pageBody)) {
      continue;
    }

    const contentReference = pageBody.match(/\/Contents\s+(\d+)\s+0\s+R/);

    if (!contentReference) {
      continue;
    }

    const tokens = extractTokens(
      buffer,
      source,
      objects,
      pageId,
      Number(contentReference[1]),
    );

    titleText += ` ${joinColumn(tokens.filter((token) => token.y > 495))}`;
    allRows.push(...createRows(tokens));
  }

  const yearMatch = titleText.match(/\b(20\d{2})\b/);
  const warnings: string[] = [];
  const candidates = allRows.filter((row) => parseDateRange(row.dateText));
  const events: ImportedCalendarEvent[] = [];

  for (const row of candidates) {
    if (!markerIsEnabled(row.regionMarker)) {
      continue;
    }

    const range = parseDateRange(row.dateText);

    if (!range) {
      continue;
    }

    const nearbyTitleRows = allRows
      .filter(
        (candidate) =>
          candidate !== row &&
          !candidate.dateText &&
          candidate.titleText &&
          Math.abs(candidate.y - row.y) <= 9,
      )
      .sort((left, right) => right.y - left.y);
    const title = cleanTitle(
      [
        ...nearbyTitleRows.filter(
          (candidate) => candidate.y > row.y,
        ).map((candidate) => candidate.titleText),
        row.titleText,
        ...nearbyTitleRows.filter(
          (candidate) => candidate.y < row.y,
        ).map((candidate) => candidate.titleText),
      ]
        .filter(Boolean)
        .join(" "),
    );

    if (!title || /name of the holiday/i.test(title)) {
      warnings.push(`A calendar row dated ${row.dateText} needs a title review.`);
      continue;
    }

    events.push({
      title,
      eventType: eventTypeForTitle(title),
      startDate: range.startDate,
      endDate: range.endDate,
      description: `${region} · Imported from the Kidzee holiday calendar.`,
    });
  }

  const uniqueEvents = [...new Map(
    events.map((event) => [
      `${event.startDate.toISOString().slice(0, 10)}:${event.endDate?.toISOString().slice(0, 10) ?? ""}:${event.title.toLowerCase()}`,
      event,
    ]),
  ).values()];

  if (uniqueEvents.length === 0) {
    throw new Error(
      "No Delhi/NCR holiday rows could be read. Upload a text-based Kidzee PDF or add events manually.",
    );
  }

  return {
    academicYear: yearMatch?.[1] ?? null,
    region,
    events: uniqueEvents,
    warnings,
  };
}
