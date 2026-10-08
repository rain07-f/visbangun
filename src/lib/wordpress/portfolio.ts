import { wpFetch } from './client';
import type { ProjectItem } from './types';

export const BASELINE_PROJECTS: ProjectItem[] = [
  {
    slug: 'mandiri',
    title: 'Command Center & SOC Room — Bank Mandiri HQ',
    category: 'Integrated Solutions',
    client: 'PT. BANK MANDIRI (Persero), Tbk',
    location: 'Jakarta, Indonesia',
    duration: '2 Months',
    scope: [
      'Interior & Civil Work',
      'Videowall & Controller',
      'Integrated Solution',
      'Acoustic & Lighting Treatment',
    ],
    challenge: 'Enterprise solution, highly confidential data environment & limited execution timeframe.',
    result: 'Control room and SOC facility successfully built complying with ISO 11064 ergonomic standards.',
    image: '/assets/p1/project-mandiri.jpg',
    images: [
      '/assets/p5/details/gallery/mandiri/1.jpg',
      '/assets/p5/details/gallery/mandiri/2.jpg',
      '/assets/p5/details/gallery/mandiri/3.jpeg',
      '/assets/p5/details/gallery/mandiri/4.jpeg',
    ],
  },
  {
    slug: 'jasamarga',
    title: 'Plaza Development — Masjid Ar-Rahman Jasamarga HQ',
    category: 'Construction & Civil',
    client: 'PT. JASA MARGA, Tbk',
    location: 'Jakarta, Indonesia',
    duration: '6 Months',
    scope: [
      'Demolish existing building structure',
      'Plaza Building Construction',
      'MEP & Infrastructure Installations',
      'Exterior Architectural Facade',
    ],
    challenge: 'Project executed inside an active operational HQ campus with constrained space and restricted material mobilization.',
    result: 'Project completed on schedule with high build quality, functionality, and aesthetic comfort.',
    image: '/assets/p1/project-jasamarga.jpg',
    images: [
      '/assets/p5/details/gallery/jasamarga/1.jpg',
      '/assets/p5/details/gallery/jasamarga/2.jpg',
      '/assets/p5/details/gallery/jasamarga/3.jpg',
      '/assets/p5/details/gallery/jasamarga/4.jpg',
    ],
  },
  {
    slug: 'industrial',
    title: 'Infrastructure Project — Leading Transportation Company Indonesia',
    category: 'Integrated Solutions',
    client: 'Leading Transportation Company Indonesia',
    location: 'Jabodetabek, Indonesia',
    duration: 'Project-specific',
    scope: [
      'Civil & Infrastructure Works',
      'Road, Drainage & Site Works',
      'Fiber Optic Network Deployment',
      'Project Delivery & Handover',
    ],
    challenge: 'Heavy infrastructure execution within a high-density active transport and operational corridor.',
    result: 'Infrastructure works delivered to support safe, seamless, and long-lasting site operations.',
    image: '/assets/p4/project-infrastructure.png',
    images: [
      '/assets/p5/details/gallery/industrial/1.jpg',
      '/assets/p5/details/gallery/industrial/2.jpg',
      '/assets/p5/details/gallery/industrial/3.jpg',
      '/assets/p5/details/gallery/industrial/4.jpg',
    ],
  },
  {
    slug: 'manufacture',
    title: 'Manufacture Site — Building & Site Works',
    category: 'Renovation & Interior',
    client: 'Industrial / Manufacturing Site',
    location: 'Indonesia',
    duration: 'Project-specific',
    scope: [
      'Industrial Building Works',
      'Facade & Exterior Upgrades',
      'Site Execution & Heavy Works',
      'Quality Compliance Delivery',
    ],
    challenge: 'Execution required continuous coordination with round-the-clock factory plant operations and site security.',
    result: 'Works progressed seamlessly with rigorous focus on safety, zero production downtime, and structural precision.',
    image: '/assets/p1/manufacture-site-wide.jpg',
    images: [
      '/assets/p5/details/gallery/manufacture/1.jpeg',
      '/assets/p5/details/gallery/manufacture/2.jpeg',
      '/assets/p5/details/gallery/manufacture/3.jpeg',
      '/assets/p5/details/gallery/manufacture/4.jpeg',
    ],
  },
  {
    slug: 'tower',
    title: 'Telecommunication Tower Installation',
    category: 'Integrated Solutions',
    client: 'Various Telecom Operators (PT. Protelindo, TBG, etc.)',
    location: 'Various Locations across Indonesia',
    duration: 'Project-specific',
    scope: [
      'Tower Erection & Structural Installation',
      'Power, Earthing & Lightning Protection',
      'Site Ground Works & Commissioning',
    ],
    challenge: 'Diverse remote terrains, logistical transport across archipelago, and strict telecommunication engineering standards.',
    result: 'Tower infrastructure deployed following comprehensive safety protocols and broadcast engineering standards.',
    image: '/assets/p1/project-tower.jpg',
    images: [
      '/assets/p5/details/gallery/tower/1.jpg',
    ],
  },
];

export async function getProjects(): Promise<ProjectItem[]> {
  // First attempt to query WordPress custom post type if available
  const wpProjects = await wpFetch<any[]>('/wp/v2/projects?_embed=1');
  if (wpProjects && Array.isArray(wpProjects) && wpProjects.length > 0) {
    return wpProjects.map((p) => ({
      slug: p.slug,
      title: p.title?.rendered || 'Project',
      category: p.project_category || 'Industrial Project',
      client: p.meta?.client || 'Confidential Client',
      location: p.meta?.location || 'Indonesia',
      duration: p.meta?.duration || 'Standard',
      scope: Array.isArray(p.meta?.scope) ? p.meta.scope : ['Project Execution'],
      challenge: p.meta?.challenge || '',
      result: p.meta?.result || '',
      image: p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/assets/p1/project-mandiri.jpg',
      images: [p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/assets/p1/project-mandiri.jpg'],
    }));
  }

  // Graceful fallback to verified company profile project data
  return BASELINE_PROJECTS;
}

export async function getProjectBySlug(slug: string): Promise<ProjectItem | null> {
  const projects = await getProjects();
  const match = projects.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
  return match || null;
}
