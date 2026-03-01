import type { AliasRule } from "@/hooks/useGoogleSheets";

/**
 * 시트 Rules 탭에서 로드한 별칭 데이터를 기반으로 검색어를 확장합니다.
 */
export function getSearchTermsFromRules(query: string, rules: AliasRule[]): string[] {
  const lower = query.toLowerCase().trim();
  const terms = [lower];
  for (const rule of rules) {
    if (rule.keyword === lower) {
      terms.push(...rule.aliases);
    }
  }
  return terms;
}

/**
 * 검색 결과를 우선순위에 따라 정렬합니다.
 * 1순위: 완벽하게 일치 (원본 검색어로 title/artist가 정확히 일치)
 * 2순위: 규칙변환하여 완전 포함 (별칭 검색어로 title/artist가 정확히 일치)
 * 3순위: 일부 포함 (원본 검색어가 title/artist에 포함)
 * 4순위: 규칙변환하여 일부 포함 (별칭 검색어가 title/artist에 포함)
 */
export function getSearchPriority(
  title: string,
  artist: string,
  originalQuery: string,
  aliasTerms: string[]
): number {
  const t = title.toLowerCase();
  const a = artist.toLowerCase();
  const q = originalQuery.toLowerCase().trim();

  // 1순위: 원본 검색어로 완전 일치
  if (t === q || a === q) return 1;

  // 2순위: 별칭으로 완전 일치
  const aliases = aliasTerms.filter((term) => term !== q);
  if (aliases.some((term) => t === term || a === term)) return 2;

  // 3순위: 원본 검색어 일부 포함
  if (t.includes(q) || a.includes(q)) return 3;

  // 4순위: 별칭 일부 포함
  if (aliases.some((term) => t.includes(term) || a.includes(term))) return 4;

  return 5;
}
