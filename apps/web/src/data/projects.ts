// Non-translatable project structure: ids, brand names, assets, links.
// Translatable copy (info line, hero headline) lives in the i18n
// dictionaries under projects.items, keyed by these ids.

export interface Project {
  id: string
  /** brand name — not translated */
  name: string
  image: string
  /** full-bleed background used by the home Hero section */
  heroImage?: string
  learnMoreUrl?: string
  /** large image shown at the top of the project detail page */
  detailImage?: string
  /** work images shown through the detail page, in display order */
  gallery?: string[]
}

/** route to a project's detail page, derived from its id */
export const projectPath = (id: string) => `/projects/${id}`

export const projects: Project[] = [
  {
    id: 'sushiruntime',
    name: 'SushiRuntime',
    image: '/images/project-sushiruntime.png',
    learnMoreUrl: projectPath('sushiruntime'),
    detailImage: '/images/projects/sushiruntime/main.png',
    gallery: [
      '/images/projects/sushiruntime/1.png',
      '/images/projects/sushiruntime/2.png',
    ],
  },
  {
    id: 'projectfs',
    name: 'Project: FS',
    image: '/images/project-fs.png',
    learnMoreUrl: projectPath('projectfs'),
    detailImage: '/images/projects/projectfs/main.png',
    gallery: [
      '/images/projects/projectfs/1.png',
      '/images/projects/projectfs/2.png',
      '/images/projects/projectfs/3.png',
      '/images/projects/projectfs/4.png',
      '/images/projects/projectfs/5.png',
      '/images/projects/projectfs/6.png',
    ],
  },
  {
    id: 'projectmobilerts',
    name: 'Project: mobileRTS',
    image: '/images/project-mobilerts.jpg',
    heroImage: '/images/hero-mobilerts.png',
    learnMoreUrl: projectPath('projectmobilerts'),
    detailImage: '/images/projects/projectmobilerts/main.jpg',
    gallery: [
      '/images/projects/projectmobilerts/1.jpg',
      '/images/projects/projectmobilerts/2.png',
      '/images/projects/projectmobilerts/3.png',
      '/images/projects/projectmobilerts/4.png',
      '/images/projects/projectmobilerts/5.png',
    ],
  },
]

export const getProject = (id?: string) => projects.find(p => p.id === id)
