/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** POST endpoint for the contact form (e.g. a Formspree form URL). */
  readonly VITE_CONTACT_ENDPOINT?: string
  /** Web3Forms access key — when set, posts go to Web3Forms with this key. */
  readonly VITE_WEB3FORMS_KEY?: string
  /** Instagram post/profile URL embedded in the "Latest News" section. */
  readonly VITE_INSTAGRAM_EMBED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
