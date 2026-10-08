export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url: string;
      description: string;
      avatar_urls?: Record<string, string>;
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text?: string;
      media_details?: {
        width: number;
        height: number;
        sizes?: Record<string, { source_url: string; width: number; height: number }>;
      };
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
    }>>;
  };
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

export interface WPMedia {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  source_url: string;
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
  };
}

export interface ProjectItem {
  slug: string;
  title: string;
  category: string;
  client: string;
  location: string;
  duration: string;
  scope: string[];
  challenge: string;
  result: string;
  image: string;
  images: string[];
}
