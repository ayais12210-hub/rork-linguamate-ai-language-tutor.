import { LANGUAGES, Lang, TOP_LANGUAGES } from '../data/languages';

const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const fields = (l: Lang): string[] =>
  [l.code, l.name, l.endonym ?? '', ...(l.aliases ?? [])].map(norm);

export function rankLanguages(query: string): Lang[] {
  const q = norm(query.trim());

  if (!q) {
    const top = LANGUAGES.filter((l) => TOP_LANGUAGES.has(l.code));
    const rest = LANGUAGES.filter((l) => !TOP_LANGUAGES.has(l.code)).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return [...top, ...rest];
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = LANGUAGES.map((l) => {
    const arr = fields(l);
    let score = 0;

    if (arr[0] === q) score += 100;

    for (const t of tokens) {
      for (const f of arr) {
        if (f.startsWith(t)) score += 40;
        else if (f.includes(t)) score += 15;
      }
    }

    return { l, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.l.name.localeCompare(b.l.name))
    .map((x) => x.l);

  return scored;
}
