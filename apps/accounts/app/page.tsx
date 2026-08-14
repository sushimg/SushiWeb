import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sushi Systems Hesabı</h1>
      <p className="text-neutral-400">
        Tek hesap, tüm ürünler.
      </p>
      <div className="flex gap-4">
        <Link href="/giris" className="underline">Giriş yap</Link>
        <Link href="/kayit" className="underline">Hesap oluştur</Link>
      </div>
    </div>
  )
}
