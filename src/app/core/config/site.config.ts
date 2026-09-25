/**
 * SITE CONFIGURATION
 * ---------------------------------------------------------------------------
 * The single source of truth for identity, contact details, navigation and SEO
 * defaults. Nothing in a template hardcodes a name, an email address or a URL —
 * everything resolves from here so the whole site can be re-pointed by editing
 * one file.
 */

export interface SiteIdentity {
  /** Full name, used in headings, SEO titles and the footer. */
  readonly name: string;
  /** Two-letter monogram used in the header, footer and loader. */
  readonly monogram: string;
  /** Professional role. */
  readonly role: string;
  /** Compact role form used where space is tight. */
  readonly roleShort: string;
  /** Years of professional experience, expressed as a label. */
  readonly experience: string;
  /** Working arrangement. */
  readonly location: string;
  /** Availability headline. */
  readonly availability: string;
  /** Availability state driving the status indicator colour. */
  readonly availabilityState: 'open' | 'limited' | 'closed';
}

export interface SiteContact {
  readonly email: string;
  readonly github: string;
  readonly linkedin: string;
  /** Derived `mailto:` href including a prefilled subject. */
  readonly mailto: string;
}

export interface SiteSeo {
  /** Canonical origin, no trailing slash. */
  readonly baseUrl: string;
  readonly defaultTitle: string;
  /** e.g. `'%s — Noah Mercer'` where `%s` is the route title. */
  readonly titleTemplate: string;
  readonly defaultDescription: string;
  readonly locale: string;
  readonly siteName: string;
  /** Absolute path to the social card, served from /public. */
  readonly ogImage: string;
  readonly keywords: readonly string[];
}

export interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Short description used for the mobile menu and screen readers. */
  readonly hint: string;
}

export interface SiteConfig {
  readonly identity: SiteIdentity;
  readonly contact: SiteContact;
  readonly seo: SiteSeo;
  readonly nav: readonly NavItem[];
  readonly footerNav: readonly NavItem[];
  readonly externalLinks: readonly { readonly label: string; readonly href: string }[];
  readonly technicalStack: readonly string[];
  readonly copyrightHolder: string;
}

const IDENTITY: SiteIdentity = {
  name: 'Noah Mercer',
  monogram: 'NM',
  role: 'Senior Frontend & Product Engineer',
  roleShort: 'Senior Frontend / Product Engineer',
  experience: '7+ Years',
  location: 'Remote',
  availability: 'Open for selected work',
  availabilityState: 'open',
} as const;

const GITHUB = 'https://github.com/noahmercer';
const LINKEDIN = 'https://linkedin.com/in/noahmercer';
const EMAIL = 'hello@noahmercer.dev';

const CONTACT: SiteContact = {
  email: EMAIL,
  github: GITHUB,
  linkedin: LINKEDIN,
  mailto: `mailto:${EMAIL}?subject=Project%20enquiry`,
} as const;

const SEO: SiteSeo = {
  baseUrl: 'https://noahmercer.dev',
  defaultTitle: 'Noah Mercer — Senior Frontend & Product Engineer',
  titleTemplate: '%s — Noah Mercer',
  defaultDescription:
    'Noah Mercer is a senior frontend and product engineer working remotely. Frontend architecture, design systems, performance and accessibility for products that need to last.',
  locale: 'en_GB',
  siteName: 'Noah Mercer',
  ogImage: '/og-cover.svg',
  keywords: [
    'senior frontend engineer',
    'product engineer',
    'frontend architecture',
    'design systems',
    'Angular',
    'TypeScript',
    'web performance',
    'accessibility',
  ],
} as const;

const NAV: readonly NavItem[] = [
  { label: 'Work', path: '/work', hint: 'Selected work and case studies' },
  { label: 'Systems', path: '/systems', hint: 'Engineering systems and craft notes' },
  { label: 'About', path: '/about', hint: 'How I work between design and engineering' },
  { label: 'Journal', path: '/journal', hint: 'Writing on frontend architecture' },
  { label: 'Contact', path: '/contact', hint: 'Start a conversation' },
] as const;

export const SITE: SiteConfig = {
  identity: IDENTITY,
  contact: CONTACT,
  seo: SEO,
  nav: NAV,
  footerNav: NAV,
  externalLinks: [
    { label: 'GitHub', href: GITHUB },
    { label: 'LinkedIn', href: LINKEDIN },
    { label: 'Email', href: CONTACT.mailto },
  ],
  technicalStack: [
    'ANGULAR',
    'TYPESCRIPT',
    'DESIGN SYSTEMS',
    'PERFORMANCE',
    'ACCESSIBILITY',
    'INTERACTION',
  ],
  copyrightHolder: IDENTITY.name,
} as const;

/** Absolute canonical URL for a route path. */
export function canonicalUrl(path: string): string {
  const clean = path === '/' ? '' : path.replace(/\/+$/, '');
  return `${SEO.baseUrl}${clean || '/'}`;
}
