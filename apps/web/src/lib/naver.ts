export type NaverArticle = {
  articleId: string | null;
  url: string | null;
  mobileUrl: string | null;
};

/**
 * Accepts either:
 * - "399902" (article id)
 * - "https://fin.land.naver.com/articles/399902"
 * - "https://m.land.naver.com/article/399902"
 * and returns normalized URLs.
 */
export function normalizeNaverArticle(input: string): NaverArticle {
  const raw = (input ?? '').trim();
  if (!raw) return { articleId: null, url: null, mobileUrl: null };

  // Extract from known URL shapes
  const m1 = raw.match(/fin\.land\.naver\.com\/articles\/(\d+)/i);
  const m2 = raw.match(/m\.land\.naver\.com\/article\/(\d+)/i);
  const articleId = m1?.[1] ?? m2?.[1] ?? (/^\d{3,}$/.test(raw) ? raw : null);

  if (!articleId) return { articleId: null, url: null, mobileUrl: null };
  return {
    articleId,
    url: `https://fin.land.naver.com/articles/${encodeURIComponent(articleId)}`,
    mobileUrl: `https://m.land.naver.com/article/${encodeURIComponent(articleId)}`,
  };
}
