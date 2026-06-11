// Provider-agnostic form submission for a static (back-end-less) site.
//
// Configure ONE of the following in a `.env` file:
//   VITE_WEB3FORMS_KEY     — a Web3Forms access key (https://web3forms.com)
//   VITE_CONTACT_ENDPOINT  — any endpoint that accepts a JSON POST (e.g. Formspree)
//
// All providers above treat an HTTP 2xx response as success, which is the
// contract this helper relies on. Without configuration, submit() throws so the
// UI shows its error state instead of silently dropping the message.

const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

const key = import.meta.env.VITE_WEB3FORMS_KEY
const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT

type Payload = Record<string, string>

async function post(endpoint: string | undefined, data: Payload) {
  // Prefer an explicit endpoint; otherwise fall back to Web3Forms if a key is set.
  const url = endpoint ?? (key ? WEB3FORMS_URL : undefined)
  if (!url) {
    throw new Error(
      'No form endpoint configured. Set VITE_WEB3FORMS_KEY or VITE_CONTACT_ENDPOINT.',
    )
  }

  const body: Payload = { ...data }
  // Web3Forms requires the access key in the body.
  if (url === WEB3FORMS_URL && key) body.access_key = key

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Submission failed with status ${res.status}`)
}

export function submitContact(data: { name: string; email: string; message: string }) {
  return post(contactEndpoint, { ...data, subject: 'New contact message — sushisystems.io' })
}
