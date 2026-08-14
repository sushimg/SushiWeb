export const LOCALES = ['en', 'no', 'tr'] as const
export type Locale = (typeof LOCALES)[number]

/** label shown in the language switcher */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  no: 'NOR',
  tr: 'TR',
}

export interface TitledBlock {
  title: string
  text: string
}

export interface FaqItem {
  question: string
  answer: string
}

/** one bullet on a project detail page, with an optional bold lead-in */
export interface ProjectBullet {
  /** bold lead-in, e.g. "Prepare:" */
  lead?: string
  text: string
}

/** the "Outcome" section of a project detail page */
export interface ProjectOutcome {
  /** paragraphs shown before the bullet list */
  intro?: string[]
  bullets?: ProjectBullet[]
  /** paragraphs shown after the bullet list */
  outro?: string[]
}

/** translatable copy for one project, keyed by project id in the dictionary */
export interface ProjectCopy {
  info: string
  headline?: string
  /** e.g. "2024 - Present" — localized because of the trailing word */
  year?: string
  /** "Overview" section paragraphs */
  overview?: string[]
  /** "About the Project" section paragraphs */
  about?: string[]
  outcome?: ProjectOutcome
}

/**
 * Contract every locale file must fulfil. Adding a locale = one new file
 * implementing this interface + one entry in the locales registry.
 */
export interface Dictionary {
  nav: {
    home: string
    about: string
    projects: string
    contact: string
  }
  hero: {
    learnMore: string
  }
  about: {
    title: string
    body: string
    cta: string
  }
  projects: {
    title: string
    /** label for the button linking to the full projects page */
    viewAll: string
    items: Record<string, ProjectCopy>
  }
  /** the standalone /projects page hero */
  projectsPage: {
    heroTop: string
    heroAccent: string
    subtitle: string
  }
  /** shared labels for the project detail page (section headings) */
  projectPage: {
    overview: string
    about: string
    outcome: string
    other: string
    back: string
  }
  faq: {
    title: string
    items: FaqItem[]
  }
  news: {
    title: string
    subtitle: string
  }
  contact: {
    /** first line of the heading, e.g. "CONTACT" */
    titleTop: string
    /** accent-colored second line, e.g. "US" */
    titleAccent: string
    /** intro line under the heading inviting contact / partnership */
    tagline: string
    /** divider line before the direct-email fallback, e.g. "Or just email us" */
    orMail: string
    /** the email-us contact form below the heading */
    form: {
      name: string
      email: string
      message: string
      submit: string
      sending: string
      success: string
      error: string
    }
  }
  footer: {
    copyright: string
  }
  aboutPage: {
    heroTop: string
    heroAccent: string
    intro: TitledBlock[]
    coreTitle: string
    core: TitledBlock[]
    systems: TitledBlock
  }
  notFound: {
    title: string
    goHome: string
  }
  /** browser tab titles, per route */
  pageTitles: {
    home: string
    about: string
    projects: string
    contact: string
    notFound: string
  }
}
