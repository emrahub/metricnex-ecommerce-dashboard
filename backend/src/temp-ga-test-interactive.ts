import dotenv from 'dotenv';
import readline from 'readline';
import googleAnalyticsService from './services/googleAnalytics';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testGoogleAnalytics() {
  console.log('\n🔍 Google Analytics Bağlantı Testi\n');
  console.log('Service Account: emrahdashboard@gen-lang-client-0577978823.iam.gserviceaccount.com');
  console.log('Yetki: Analist ✅\n');
  
  rl.question('Google Analytics Property ID\'nizi girin (örn: 123456789): ', async (propertyId) => {
    if (!propertyId || propertyId === '123456789') {
      console.log('\n❌ Geçerli bir Property ID girmelisiniz!');
      console.log('Property ID\'yi şu şekilde bulabilirsiniz:');
      console.log('1. Google Analytics hesabınıza giriş yapın');
      console.log('2. Admin > Property > Property Details bölümüne gidin');
      console.log('3. "Property ID" değerini kopyalayın (sadece rakamlar)\n');
      rl.close();
      return;
    }

    console.log(`\n📊 Property ID ${propertyId} ile test ediliyor...\n`);
    
    try {
      const report = await googleAnalyticsService.getReport(
        propertyId,
        '7daysAgo',
        'today',
        ['sessions', 'activeUsers', 'newUsers'],
        ['date', 'country']
      );

      console.log('✅ BAŞARILI! Google Analytics bağlantısı çalışıyor!\n');
      console.log('📈 Örnek Veri (Son 7 Gün):');
      
      if (report.rows && report.rows.length > 0) {
        console.log('\n📊 İlk 5 satır veri:');
        report.rows.slice(0, 5).forEach((row, index) => {
          console.log(`\n${index + 1}. Kayıt:`);
          if (row.dimensionValues) {
            console.log(`   Tarih: ${row.dimensionValues[0]?.value}`);
            console.log(`   Ülke: ${row.dimensionValues[1]?.value}`);
          }
          if (row.metricValues) {
            console.log(`   Oturumlar: ${row.metricValues[0]?.value}`);
            console.log(`   Aktif Kullanıcılar: ${row.metricValues[1]?.value}`);
            console.log(`   Yeni Kullanıcılar: ${row.metricValues[2]?.value}`);
          }
        });
        console.log(`\n📊 Toplam ${report.rows.length} satır veri alındı.`);
      } else {
        console.log('⚠️ Veri bulunamadı. Property\'de henüz veri olmayabilir.');
      }
      
      console.log('\n✨ Google Analytics entegrasyonu başarıyla tamamlandı!');
      console.log('\n📝 .env dosyanıza ekleyin:');
      console.log(`GOOGLE_ANALYTICS_PROPERTY_ID=${propertyId}`);
      
    } catch (error: any) {
      console.error('❌ HATA:', error.message);
      
      if (error.message.includes('PERMISSION_DENIED')) {
        console.log('\n🔧 Çözüm önerileri:');
        console.log('1. Service account\'un doğru property\'ye eklendiğinden emin olun');
        console.log('2. Property ID\'nin doğru olduğunu kontrol edin');
        console.log('3. Yetkilerin aktif olması için birkaç dakika bekleyin');
      }
    } finally {
      rl.close();
    }
  });
}

testGoogleAnalytics();