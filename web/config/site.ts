import { NavItem } from '@/types/nav';

interface SiteConfig {
  name: string;
  mainNav: NavItem[];
  links: {
    github: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'RECs App',
  mainNav: [
    {
      title: 'Dashboard',
      href: '/',
    },
    {
      title: 'Marketplace',
      href: '/marketplace',
    },
    {
      title: 'History',
      href: '/history',
    },
  ],
  links: {
    github: 'https://github.com/polyphene/recs-monorepo',
  },
};

export const adminSiteConfig: SiteConfig = {
  ...siteConfig,
  mainNav: [
    ...siteConfig.mainNav,
    {
      title: 'Administration',
      href: '/admin',
    },
  ],
};
