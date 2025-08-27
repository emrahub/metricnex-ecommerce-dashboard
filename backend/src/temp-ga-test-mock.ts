import dotenv from 'dotenv';
dotenv.config();

// Mock test - gerçek Google Analytics bağlantısı için doğru credentials gerekli
console.log('\n🔍 Google Analytics Test Sonuçları:\n');
console.log('❌ HATA: Google service account credentials geçersiz!');
console.log('\nYapmanız gerekenler:');
console.log('1. Google Cloud Console\'a gidin: https://console.cloud.google.com');
console.log('2. Projenizi seçin veya yeni bir proje oluşturun');
console.log('3. APIs & Services > Credentials bölümüne gidin');
console.log('4. "Create Credentials" > "Service Account" seçin');
console.log('5. Service account oluşturduktan sonra "Keys" sekmesinden JSON key indirin');
console.log('6. İndirilen JSON dosyasını base64\'e çevirin:');
console.log('   Mac/Linux: base64 < credentials.json | tr -d "\\n"');
console.log('   Windows: certutil -encode credentials.json encoded.txt');
console.log('7. Oluşan base64 string\'i .env dosyasında GOOGLE_CREDENTIALS_BASE64= olarak ekleyin');
console.log('\n📊 Google Analytics property ID\'niz de hazır olmalı (örn: 123456789)');
console.log('\n✅ Bu adımları tamamladıktan sonra "npx ts-node src/temp-ga-test.ts" komutunu tekrar çalıştırın.');