export function sanitiseString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

export function sanitiseEmail(email: string): string {
  return email.toLowerCase().trim().normalize('NFC');
}

export function sanitiseHTML(html: string, allowedTags: string[] = []): string {
  const allowedTagsSet = new Set(allowedTags);
  
  let sanitised = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitised = sanitised.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitised = sanitised.replace(/javascript:/gi, '');
  sanitised = sanitised.replace(/data:/gi, '');
  sanitised = sanitised.replace(/vbscript:/gi, '');
  
  if (allowedTagsSet.size === 0) {
    sanitised = sanitised.replace(/<[^>]*>/g, '');
  } else {
    sanitised = sanitised.replace(/<(\/?)([\w]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
      if (allowedTagsSet.has(tag.toLowerCase())) {
        const cleanAttrs = attrs
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/data:/gi, '');
        return `<${slash}${tag}${cleanAttrs}>`;
      }
      return '';
    });
  }
  
  return sanitised;
}

export function sanitiseFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

export function stripControlCharacters(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function removeCurlyQuotes(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

export function sanitiseInput(input: string): string {
  return normalizeWhitespace(
    stripControlCharacters(
      removeCurlyQuotes(
        input.normalize('NFC')
      )
    )
  );
}

export function sanitiseObject<T extends Record<string, unknown>>(
  obj: T,
  stringFields: (keyof T)[]
): T {
  const sanitised = { ...obj };
  
  for (const field of stringFields) {
    if (typeof sanitised[field] === 'string') {
      sanitised[field] = sanitiseInput(sanitised[field] as string) as T[keyof T];
    }
  }
  
  return sanitised;
}

export function sanitiseDeep<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitiseInput(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitiseDeep(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      out[k] = sanitiseDeep(v);
    });
    return out as T;
  }
  return value;
}
