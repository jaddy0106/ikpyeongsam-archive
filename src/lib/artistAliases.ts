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
