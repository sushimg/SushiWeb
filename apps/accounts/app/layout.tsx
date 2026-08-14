import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sushi Systems Hesabı',
  description: 'Tüm Sushi Systems ürünleri için tek hesap.',
  // Kimlik sayfaları arama motorlarında görünmemeli.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  )
}
