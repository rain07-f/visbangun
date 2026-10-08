import { wpFetch } from './client';
import type { WPPost, WPCategory } from './types';

export async function getPosts(params: { perPage?: number; page?: number; categoryId?: number } = {}): Promise<WPPost[]> {
  const { perPage = 10, page = 1, categoryId } = params;
  let query = `/wp/v2/posts?_embed=1&per_page=${perPage}&page=${page}`;
  if (categoryId) {
    query += `&categories=${categoryId}`;
  }

  const posts = await wpFetch<WPPost[]>(query);
  return posts || [];
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`);
  if (posts && posts.length > 0) {
    return posts[0];
  }
  return null;
}

export async function getCategories(): Promise<WPCategory[]> {
  const categories = await wpFetch<WPCategory[]>('/wp/v2/categories?per_page=100');
  return categories || [];
}

export function getPostFeaturedImage(post: WPPost): string | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  return media?.source_url || null;
}

export function getPostAuthor(post: WPPost): string {
  const author = post._embedded?.author?.[0];
  return author?.name || 'Visi Bangun Perkasa';
}

export function getPostCategoryNames(post: WPPost): string[] {
  const terms = post._embedded?.['wp:term']?.[0];
  if (!terms) return [];
  return terms.map(t => t.name);
}

export function formatPostDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
