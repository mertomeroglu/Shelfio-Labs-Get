# getshelfio.com

Shelfio hizmet/tanıtım sitesi ön yüzü ve API yönetim paneli monoreposu.

## Projenin Amacı

getshelfio.com, Shelfio platformunun tanıtımını yapan, hizmet paketlerini sunan, potansiyel müşterilerden demo taleplerini alan ve satın alınan lisansların aktivasyon süreçlerini yöneten kurumsal web sitesi ve müşteri portalı altyapısıdır.

## Ana Özellikler

- **Paket Tanıtımı:** Shelfio'nun sunduğu farklı hizmet planlarının ve detaylı özelliklerinin dinamik olarak listelenmesi.
- **Demo Talebi:** İşletmelerin Shelfio platformunu test edebilmesi için demo talebi oluşturma formu ve yönetim akışı.
- **Lisans Aktivasyon Yönlendirmesi:** Satın alınan lisans anahtarlarının aktif edilerek ilgili tenant (müşteri) hesabı ile ilişkilendirilmesi.
- **Müşteri Portalı Ön Yüzü:** Müşterilerin aktif lisanslarını, faturalarını, mağazalarını ve destek taleplerini görüntüleyebildikleri arayüz.
- **Shelfio Ana Panele Yönlendirme:** Kullanıcıların tek tıkla ve tekil oturum (SSO) altyapısı üzerinden shelfiolabs.com üzerindeki Shelfio ana yönetim paneline güvenli şekilde yönlendirilmesi.

## Teknolojiler

- **Frontend:** Next.js (TypeScript, React)
- **Backend:** Node.js, TypeScript (kontrol veritabanı API katmanı)
- **Veritabanı:** PostgreSQL
- **Konteynerleştirme:** Docker, Docker Compose

## Kurulum

### Gereksinimler

- Node.js (v18+)
- Docker ve Docker Compose (opsiyonel, konteyner kurulumu için)
- PostgreSQL (yerel kurulum tercih edilecekse)

### Adımlar

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. Gerekli ortam değişkenlerini tanımlayın:
   - `backend/.env.example` dosyasını `backend/.env` adıyla kopyalayın ve gerekli değerleri doldurun.
   - `frontend/.env.example` dosyasını `frontend/.env` veya `frontend/.env.local` adıyla kopyalayın.

## Geliştirme Ortamı

Monorepo yapısında hem frontend hem backend servislerini aynı anda çalıştırmak için root dizinde şu komutu çalıştırabilirsiniz:

```bash
npm run dev
```

Bu komut frontend uygulamasını `http://localhost:3007`, backend uygulamasını ise `http://localhost:4017` portunda çalıştıracaktır.

Servisleri ayrı ayrı çalıştırmak için:
- **Frontend Geliştirme Sunucusu:**
  ```bash
  npm run dev:frontend
  ```
- **Backend Geliştirme Sunucusu:**
  ```bash
  npm run dev:backend
  ```

## Build Alma

Production ortamına dağıtım hazırlığı için projeleri derlemek üzere root dizinde şu komut kullanılır:

```bash
npm run build
```

Ayrı ayrı derlemek için:
- **Frontend Build:** `npm run build:frontend`
- **Backend Build:** `npm run build:backend`

## Ortam Değişkenleri

Uygulamanın çalışması için gerekli ortam değişkenleri şablonları ilgili alt klasörlerde bulunmaktadır:
- **Frontend Yapılandırması:** `frontend/.env.example` (Next.js çevre değişkenlerini barındırır).
- **Backend Yapılandırması:** `backend/.env.example` (PostgreSQL `DATABASE_URL`, `SESSION_SECRET`, SMTP ayarları vb. yapılandırmaları barındırır).

> [!WARNING]
> Frontend ortam değişkenleri içerisine JWT secret, private key, ödeme sağlayıcı şifresi veya veritabanı bağlantı bilgilerini eklemeyiniz.

## Klasör Yapısı

```text
├── backend/            # API Servisi, Veritabanı ve İş Mantığı (Node.js & TypeScript)
│   ├── src/            # Kaynak kodlar (routes, repositories, services, db vb.)
│   └── tsconfig.json   # TypeScript yapılandırması
├── frontend/           # Next.js Tanıtım Sitesi ve Müşteri Portalı Ön Yüzü
│   ├── src/            # Kaynak kodlar (pages, components, assets, config vb.)
│   └── next.config.ts  # Next.js yapılandırması
├── scripts/            # Veritabanı bakım, temizleme ve yönetim scriptleri
├── docker-compose.yml  # Çoklu servis orkestrasyon dosyası
├── deploy.sh           # Otomatik deployment scripti
└── package.json        # Root monorepo yapılandırması
```

## Güvenlik Notları

- **Frontend ve Backend Ayrımı:** Bu repo, getshelfio.com tanıtım ve müşteri ön yüzünü içerir. Güvenlik kritik doğrulamalar frontend katmanında yapılmamalıdır.
- **Lisans Doğrulaması:** Gerçek lisans doğrulama, plan limit kontrolleri ve müşteri yönetimi süreçleri production backend sunucusu üzerinden ve veritabanı doğrulaması ile yürütülmelidir.
- **SSO Güvenliği:** Ana panele tekil oturum (SSO) ile geçişlerde token, şifre veya hassas veriler URL query string olarak taşınmaz; veritabanında tek kullanımlık, süreli ve kriptografik hash yöntemiyle eşleştirilen kodlar (SSO Codes) kullanılır.
- **Secret Yönetimi:** API anahtarları, şifreler, SMTP parolaları ve oturum secret değerleri kesinlikle Git repolarına commit edilmemelidir. Her zaman ortam değişkenleri (.env) üzerinden yüklenmelidir.

## Lisans / Kullanım Notu

Bu proje Shelfio Stok Takip ve Elektronik Etiket Sistemleri Teknoloji A.Ş. bünyesinde geliştirilmiştir. Tüm hakları saklıdır. Yazılımın izinsiz kopyalanması, dağıtılması veya production ortamında izinsiz kullanımı yasaktır.
