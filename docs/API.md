# API Dokümantasyonu 📡

> **E-Commerce Dashboard REST API Referansı**

## 🎯 Genel Bilgi

E-Commerce Dashboard Backend API'si, Google Analytics entegrasyonu, rapor oluşturma ve kullanıcı yönetimi için RESTful endpoints sağlar.

- **Base URL:** `http://localhost:3000`
- **API Version:** v1
- **Content-Type:** `application/json`
- **Authentication:** JWT Token

## 🔐 Kimlik Doğrulama

### JWT Token Kullanımı
```http
Authorization: Bearer <jwt_token>
```

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 📊 Google Analytics API Endpoints

### 1. Özel Rapor Oluşturma
```http
POST /api/analytics/google-analytics/report
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "propertyId": "349428903",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "metrics": ["activeUsers", "sessions", "screenPageViews"],
  "dimensions": ["country", "deviceCategory", "date"]
}
```

**Response:**
```json
{
  "success": true,
  "propertyId": "349428903",
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "metrics": ["activeUsers", "sessions", "screenPageViews"],
  "dimensions": ["country", "deviceCategory", "date"],
  "rowCount": "150",
  "data": [
    {
      "country": "Turkey",
      "deviceCategory": "mobile",
      "date": "20250127",
      "activeUsers": "1250",
      "sessions": "1580",
      "screenPageViews": "4720"
    }
  ]
}
```

### 2. Haftalık Oturum Raporu
```http
GET /api/analytics/google-analytics/reports/weekly-sessions
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "title": "Son 7 Günlük Oturum Sayıları",
  "data": [
    {
      "date": "27.01.2025",
      "rawDate": "20250127",
      "sessions": 26500,
      "activeUsers": 18750,
      "pageViews": 78900
    },
    {
      "date": "26.01.2025",
      "rawDate": "20250126",
      "sessions": 25200,
      "activeUsers": 17800,
      "pageViews": 75600
    }
  ]
}
```

### 3. Ülke Bazlı Trafik Raporu
```http
GET /api/analytics/google-analytics/reports/country-traffic
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "title": "Son 30 Gün - Ülke Bazlı Trafik",
  "data": [
    {
      "country": "Turkey",
      "sessions": 881783,
      "activeUsers": 650420,
      "newUsers": 123456
    },
    {
      "country": "Germany",
      "sessions": 15240,
      "activeUsers": 11200,
      "newUsers": 5600
    }
  ]
}
```

### 4. Cihaz Kategorisi Raporu
```http
GET /api/analytics/google-analytics/reports/device-category
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "title": "Son 7 Gün - Cihaz Kategorileri",
  "data": [
    {
      "device": "mobile",
      "sessions": 156890,
      "bounceRate": "45.67",
      "avgDuration": 187
    },
    {
      "device": "desktop",
      "sessions": 69732,
      "bounceRate": "42.15",
      "avgDuration": 245
    }
  ]
}
```

### 5. Trafik Kaynakları Raporu
```http
GET /api/analytics/google-analytics/reports/traffic-sources
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "title": "Son 7 Gün - Trafik Kaynakları",
  "data": [
    {
      "source": "google",
      "medium": "organic",
      "sessions": 145620,
      "users": 98450
    },
    {
      "source": "direct",
      "medium": "(none)",
      "sessions": 78340,
      "users": 52180
    }
  ]
}
```

### 6. Rapor Kaydetme
```http
POST /api/analytics/google-analytics/report/save
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportData": {
    "data": [
      {
        "country": "Turkey",
        "activeUsers": "1000",
        "sessions": "1500"
      }
    ]
  },
  "reportName": "Test",
  "selectedMetrics": ["activeUsers", "sessions"],
  "selectedDimensions": ["country"],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rapor başarıyla kaydedildi",
  "files": {
    "excel": "/uploads/reports/GA-Test-2025-08-27T06-41-40.xlsx",
    "csv": "/uploads/reports/GA-Test-2025-08-27T06-41-40.csv"
  },
  "reportInfo": {
    "name": "GA-Test-2025-08-27T06-41-40",
    "createdAt": "2025-08-27T06:41:40.123Z",
    "rowCount": 2,
    "metrics": ["activeUsers", "sessions"],
    "dimensions": ["country"]
  }
}
```

---

## 📈 Mevcut Metrikler

| Metric | API Key | Açıklama |
|--------|---------|----------|
| Aktif Kullanıcılar | `activeUsers` | Belirlenen dönemde sitenizi ziyaret eden benzersiz kullanıcı sayısı |
| Oturumlar | `sessions` | Web sitenizde başlatılan oturum sayısı |
| Sayfa Görüntüleme | `screenPageViews` | Sayfaların görüntülenme sayısı |
| Çıkış Oranı | `bounceRate` | Tek sayfa görüntülemesi ile biten oturumların yüzdesi |
| Ortalama Oturum Süresi | `averageSessionDuration` | Oturumların ortalama süresi (saniye) |
| Yeni Kullanıcılar | `newUsers` | İlk kez siteyi ziyaret eden kullanıcı sayısı |
| Dönüşümler | `conversions` | Tamamlanan hedef sayısı |
| Toplam Gelir | `totalRevenue` | E-ticaret işlemlerinden elde edilen toplam gelir |
| Ortalama Sipariş Değeri | `averagePurchaseRevenue` | Satın alma başına ortalama gelir |
| E-ticaret Satın Almalar | `purchasers` | Satın alma işlemi yapan kullanıcı sayısı |

## 🎯 Mevcut Boyutlar

| Dimension | API Key | Açıklama |
|-----------|---------|----------|
| Ülke | `country` | Kullanıcının ülke bilgisi |
| Şehir | `city` | Kullanıcının şehir bilgisi |
| Tarih | `date` | YYYYMMDD formatında tarih |
| Cihaz Kategorisi | `deviceCategory` | Mobile, desktop, tablet |
| Tarayıcı | `browser` | Kullanılan web tarayıcısı |
| Trafik Kaynağı | `sessionSource` | Trafiğin geldiği kaynak |
| Trafik Medyumu | `sessionMedium` | Trafik medyumu (organic, cpc, referral) |
| Sayfa Yolu | `pagePath` | Sayfanın URL yolu |
| Yaş Grubu | `ageGroup` | Kullanıcı yaş grubu |
| Cinsiyet | `gender` | Kullanıcı cinsiyeti |
| İlgi Alanı | `interestAffinityCategory` | Kullanıcı ilgi kategorileri |
| Kampanya Adı | `campaignName` | Reklam kampanyası adı |
| İşletim Sistemi | `operatingSystem` | Kullanılan işletim sistemi |

---

## ❌ Hata Kodları

### HTTP Status Codes
| Kod | Anlamı | Açıklama |
|-----|--------|----------|
| 200 | OK | İstek başarılı |
| 201 | Created | Kaynak oluşturuldu |
| 400 | Bad Request | Geçersiz istek |
| 401 | Unauthorized | Kimlik doğrulama gerekli |
| 403 | Forbidden | Erişim izni yok |
| 404 | Not Found | Kaynak bulunamadı |
| 500 | Internal Server Error | Sunucu hatası |

### Hata Response Formatı
```json
{
  "success": false,
  "message": "Hata açıklaması",
  "error": "Detaylı hata mesajı",
  "code": "ERROR_CODE"
}
```

### Yaygın Hatalar

#### 1. Property ID Bulunamadı
```json
{
  "success": false,
  "message": "Property ID gerekli",
  "code": "PROPERTY_ID_MISSING"
}
```

#### 2. Geçersiz Tarih Aralığı
```json
{
  "success": false,
  "message": "Başlangıç ve bitiş tarihleri gerekli",
  "code": "DATE_RANGE_INVALID"
}
```

#### 3. Google Analytics API Hatası
```json
{
  "success": false,
  "message": "Google Analytics verisi alınamadı",
  "error": "Invalid credentials",
  "code": "GA_API_ERROR"
}
```

---

## 🔧 Yapılandırma

### Environment Variables
```env
# Google Analytics
GOOGLE_CREDENTIALS_BASE64=<base64-encoded-service-account-json>
GOOGLE_ANALYTICS_PROPERTY_ID=349428903

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Rate Limiting
- **Per IP:** 100 requests/hour
- **Google Analytics API:** 200 requests/day
- **Report Generation:** 10 reports/hour per user

---

## 📚 Örnek Kullanım

### JavaScript/Frontend
```javascript
// Custom report örneği
const getCustomReport = async () => {
  const response = await fetch('/api/analytics/google-analytics/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      metrics: ['sessions', 'activeUsers'],
      dimensions: ['country']
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Rapor kaydetme örneği
const saveReport = async (reportData) => {
  const response = await fetch('/api/analytics/google-analytics/report/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reportData,
      reportName: 'Monthly-Report',
      selectedMetrics: ['sessions', 'activeUsers'],
      selectedDimensions: ['country'],
      dateRange: { startDate: '2025-01-01', endDate: '2025-01-31' }
    })
  });
  
  const result = await response.json();
  console.log('Report saved:', result.files);
};
```

### cURL Örnekleri
```bash
# Haftalık oturum raporu
curl -X GET "http://localhost:3000/api/analytics/google-analytics/reports/weekly-sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Özel rapor oluşturma
curl -X POST "http://localhost:3000/api/analytics/google-analytics/report" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "metrics": ["sessions", "activeUsers"],
    "dimensions": ["country"]
  }'
```

---

## 🚀 API Testleri

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-27T06:41:40.123Z",
  "uptime": 3600,
  "environment": "development"
}
```

### CORS Headers
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

**📝 Not:** Bu API dokümantasyonu Elle Shoes E-Commerce Dashboard projesi için hazırlanmıştır. Sorularınız için development ekibi ile iletişime geçin.