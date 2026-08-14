/**
 * Bağlantı dizesini okur. process.env'i doğrudan okumak yerine ortamı
 * argüman olarak alır — böylece her hata yolu, global durum değiştirmeden
 * test edilebilir.
 */
export function readDatabaseUrl(
  source: Record<string, string | undefined>,
): string {
  const url = source.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL tanımlı değil. Bkz. docs/database-setup.md')
  }
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL postgresql:// ile başlamalı — bkz. docs/database-setup.md',
    )
  }
  return url
}
