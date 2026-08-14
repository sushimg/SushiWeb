import type { NextConfig } from 'next'

const config: NextConfig = {
  // Workspace paketleri TypeScript kaynağı olarak yayınlanıyor (derlenmiş
  // değil), bu yüzden Next'in onları kendi derleme hattından geçirmesi gerekir.
  transpilePackages: ['@sushi/identity-core', '@sushi/identity-infra'],
}

export default config
