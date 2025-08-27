# MetricNex Analytics Dashboard 📊

> **Modern e-ticaret analiz ve raporlama platformu**

## 🎯 Proje Özeti

MetricNex, modern e-ticaret işletmeleri için geliştirilmiş güçlü bir analitik ve raporlama platformudur. Google Analytics entegrasyonu ile gerçek zamanlı veri analizi, otomatik rapor oluşturma ve çoklu format dışa aktarma özellikleri sunar.

## ✨ Ana Özellikler

### 📊 **Google Analytics Entegrasyonu**
- ✅ Gerçek zamanlı veri analizi (Son 7 gün: 200K+ oturum)
- ✅ Ülke bazlı trafik analizi (Türkiye %95+)
- ✅ Cihaz kategorisi raporları (Mobile/Desktop)
- ✅ Trafik kaynağı analizi
- ✅ Özel rapor oluşturma (10+ metrik, 13+ boyut)

### 📈 **Rapor Sistemi**
- ✅ Otomatik Excel (.xlsx) ve CSV rapor oluşturma
- ✅ Türkçe formatlanmış veriler
- ✅ Timestamp ile dosya isimlendirme
- ✅ Direkt indirme linkleri
- ✅ Profesyonel rapor şablonları

### 🔐 **Güvenlik & Kimlik Doğrulama**
- ✅ JWT tabanlı authentication
- ✅ Service account güvenli entegrasyonu
- ✅ Environment variables ile credential yönetimi
- ✅ CORS ve Helmet güvenlik middleware'leri

### 🎨 **Modern Kullanıcı Arayüzü**
- ✅ React 19 + TypeScript
- ✅ Tailwind CSS ile responsive design
- ✅ Heroicons ile modern ikonlar
- ✅ Chart.js entegrasyonu
- ✅ Loading states ve error handling

## 🛠️ Teknoloji Stack'i

### **Backend**
```json
"Node.js + Express + TypeScript"
"Google Analytics Data API"
"ExcelJS (Rapor oluşturma)"
"JWT Authentication"
"PostgreSQL + Prisma ORM"
"Redis (Cache)"
```

### **Frontend**
```json
"React 19 + TypeScript"
"Vite (Build tool)"
"Tailwind CSS"
"TanStack Query (State management)"
"React Router DOM"
"Chart.js + React Chart.js 2"
```

### **DevOps & Tools**
```json
"Jest (Testing)"
"Nodemon (Development)"
"Prettier + ESLint"
"Git + GitHub"
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Google Analytics Property
- Google Cloud Service Account

### 1. Projeyi Klonla
```bash
git clone <repository-url>
cd ecommerce-dashboard
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını yapılandırın
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

### 4. Erişim
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## 📱 Kullanım Kılavuzu

### **Dashboard Ana Sayfa**
1. Giriş yapın (admin@example.com / password)
2. Sol menüden "Google Analytics" seçin
3. Hazır raporları görüntüleyin:
   - Son 7 Günlük Oturum Sayıları
   - Ülke Bazlı Trafik
   - Cihaz Kategorileri
   - Trafik Kaynakları

### **Özel Rapor Oluşturma**
1. "Özel Rapor" sekmesine tıklayın
2. **Metrikler:** Dropdown'dan istediğiniz metrikleri seçin
   - Aktif Kullanıcılar, Oturumlar, Sayfa Görüntüleme
   - Çıkış Oranı, Ortalama Oturum Süresi
   - Dönüşümler, Toplam Gelir
3. **Boyutlar:** Analiz boyutlarını seçin
   - Ülke, Şehir, Tarih
   - Cihaz Kategorisi, Tarayıcı
   - Trafik Kaynağı, Sayfa Yolu
4. **Tarih aralığı** belirleyin
5. "Rapor Al" butonuna tıklayın
6. "📊 Raporu Kaydet" ile Excel/CSV indirin

## 📁 Proje Yapısı

```
ecommerce-dashboard/
├── backend/                    # Node.js API Server
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   └── analytics.ts   # Google Analytics API
│   │   ├── services/          # Business logic
│   │   │   └── googleAnalytics.ts
│   │   ├── config/            # Database, Redis config
│   │   └── simple-app.ts      # Express app
│   ├── uploads/reports/       # Generated reports
│   └── package.json
├── frontend/                   # React Application
│   ├── src/
│   │   ├── pages/             # React pages
│   │   │   └── GoogleAnalytics.tsx
│   │   ├── services/          # API client
│   │   ├── components/        # Reusable components
│   │   └── types/             # TypeScript types
│   └── package.json
├── docs/                      # Documentation
└── README.md                  # Bu dosya
```

## 🔧 Yapılandırma

### Backend `.env` Dosyası
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# Google Analytics
GOOGLE_CREDENTIALS_BASE64=<base64-encoded-service-account-json>
GOOGLE_ANALYTICS_PROPERTY_ID=349428903

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Service Account Kurulumu
1. [Google Cloud Console](https://console.cloud.google.com) açın
2. Proje oluşturun/seçin
3. APIs & Services > Credentials
4. Create Credentials > Service Account
5. JSON key indirin
6. Base64'e dönüştürün: `base64 < credentials.json | tr -d '\n'`
7. `.env` dosyasına `GOOGLE_CREDENTIALS_BASE64` olarak ekleyin

## 📊 Performans & Özellikler

### **Gerçek Veriler (Elle Shoes)**
- 📈 **Günlük Oturum:** ~26,000
- 🌍 **Ana Pazar:** Türkiye (%95+)
- 📱 **Mobil Kullanım:** Yüksek oran
- 💾 **Rapor Boyutu:** 100+ kayıt/rapor

### **Teknik Performans**
- ⚡ **API Response:** <500ms
- 🔄 **Hot Reload:** Development
- 📊 **Excel Generation:** ~2-3 saniye
- 💾 **File Size:** Excel (~7KB), CSV (~300B)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

**Geliştirici:** Elle Shoes Development Team  
**E-posta:** [tech@elleshoes.com]  
**Proje Linki:** [GitHub Repository]

---

## 📚 Ek Dokümantasyon

- [📖 API Dokümantasyonu](docs/API.md)
- [🏗️ Mimari Rehberi](docs/ARCHITECTURE.md)
- [🚀 Deployment Rehberi](docs/DEPLOYMENT.md)
- [🧪 Test Kılavuzu](docs/TESTING.md)

---

> **💡 İpucu:** Proje hakkında sorularınız için GitHub Issues kullanın veya dokümantasyon klasörünü inceleyin.