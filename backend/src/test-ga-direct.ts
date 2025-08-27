import dotenv from 'dotenv';
import googleAnalyticsService from './services/googleAnalytics';

dotenv.config();

async function testGoogleAnalytics() {
  const propertyId = '349428903'; // Elle Shoes Property ID
  
  console.log('\n🔍 Google Analytics Bağlantı Testi');
  console.log('=====================================');
  console.log('📊 Property ID: ' + propertyId);
  console.log('🏢 Property: elleshoes-app');
  console.log('👤 Service Account: emrahdashboard@gen-lang-client-0577978823.iam.gserviceaccount.com\n');
  
  try {
    console.log('📡 Google Analytics\'e bağlanılıyor...\n');
    
    const report = await googleAnalyticsService.getReport(
      propertyId,
      '7daysAgo',
      'today',
      ['sessions', 'activeUsers', 'newUsers', 'screenPageViews'],
      ['date', 'country', 'city']
    );

    console.log('✅ BAŞARILI! Google Analytics bağlantısı çalışıyor!\n');
    console.log('📈 Son 7 Günlük Özet:');
    console.log('=====================================');
    
    if (report.rows && report.rows.length > 0) {
      // Toplam metrikleri hesapla
      let totalSessions = 0;
      let totalUsers = 0;
      let totalNewUsers = 0;
      let totalPageViews = 0;
      
      report.rows.forEach((row: any) => {
        if (row.metricValues) {
          totalSessions += parseInt(row.metricValues[0]?.value || '0');
          totalUsers = Math.max(totalUsers, parseInt(row.metricValues[1]?.value || '0'));
          totalNewUsers += parseInt(row.metricValues[2]?.value || '0');
          totalPageViews += parseInt(row.metricValues[3]?.value || '0');
        }
      });
      
      console.log(`📊 Toplam Oturum: ${totalSessions.toLocaleString('tr-TR')}`);
      console.log(`👥 Aktif Kullanıcılar: ${totalUsers.toLocaleString('tr-TR')}`);
      console.log(`🆕 Yeni Kullanıcılar: ${totalNewUsers.toLocaleString('tr-TR')}`);
      console.log(`📄 Sayfa Görüntüleme: ${totalPageViews.toLocaleString('tr-TR')}`);
      
      console.log('\n📍 En Çok Ziyaret Eden İlk 5 Şehir:');
      console.log('-------------------------------------');
      
      // Şehirlere göre grupla
      const cityData: { [key: string]: number } = {};
      report.rows.forEach((row: any) => {
        if (row.dimensionValues && row.dimensionValues[2]) {
          const city = row.dimensionValues[2].value || 'Bilinmiyor';
          const sessions = parseInt(row.metricValues[0]?.value || '0');
          cityData[city] = (cityData[city] || 0) + sessions;
        }
      });
      
      // Sırala ve ilk 5'i göster
      const sortedCities = Object.entries(cityData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sortedCities.forEach(([city, sessions], index) => {
        console.log(`${index + 1}. ${city}: ${sessions.toLocaleString('tr-TR')} oturum`);
      });
      
    } else {
      console.log('⚠️ Henüz veri bulunmuyor. Property\'de trafik olmayabilir.');
    }
    
    console.log('\n✨ Google Analytics entegrasyonu başarıyla tamamlandı!');
    console.log('\n📝 .env dosyanıza ekleyin:');
    console.log(`GOOGLE_ANALYTICS_PROPERTY_ID=${propertyId}`);
    
  } catch (error: any) {
    console.error('❌ HATA:', error.message);
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Yetkilendirme sorunu devam ediyor:');
      console.log('1. Google Analytics\'te service account\'un eklendiğinden emin olun');
      console.log('2. Analist yetkisinin verildiğini kontrol edin');
      console.log('3. Birkaç dakika beklemeniz gerekebilir');
    } else if (error.message.includes('UNAUTHENTICATED')) {
      console.log('\n🔧 Kimlik doğrulama sorunu:');
      console.log('1. Service account JSON dosyasının doğru olduğundan emin olun');
      console.log('2. .env dosyasındaki GOOGLE_CREDENTIALS_BASE64 değerini kontrol edin');
    }
  }
}

testGoogleAnalytics();