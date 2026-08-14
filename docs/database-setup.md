# Veritabanı kurulumu

Sushi Accounts, Neon üzerinde Postgres kullanır (ücretsiz katman yeterli).

## 1. Veritabanını oluştur

1. https://neon.tech adresinde bir proje aç.
2. Connection string'i kopyala (`postgresql://...` ile başlar).

## 2. Yerel ortamı ayarla

Repo kökünde `.env.local` dosyası oluştur:

    DATABASE_URL=postgresql://kullanici:parola@host/veritabani?sslmode=require

Bu dosya `.gitignore` içindedir ve asla commit edilmez.

## 3. Migration'ları uygula

    npm run migrate -w @sushi/identity-infra

Komut idempotenttir: uygulanmış migration'ları atlar, yalnızca yenileri
çalıştırır. Çıktı, hangi dosyanın uygulandığını satır satır gösterir.

## 4. Doğrula

Neon konsolunda SQL Editor'ü aç ve şunu çalıştır:

    select scope_type, key from roles order by scope_type, key;

Beş satır dönmeli: org/admin, org/member, org/owner, product/owner,
product/player.
