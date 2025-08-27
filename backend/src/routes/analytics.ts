import { Router, Request, Response } from 'express';
import googleAnalyticsService from '../services/googleAnalytics';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

// Tarih formatını düzenleme fonksiyonu
function formatGADate(dateString: string): string {
  if (!dateString || dateString.length !== 8) return dateString;
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('tr-TR', { 
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit' 
  });
}

const router = Router();

function readGASettingsFromStore(): { propertyId?: string; hasCredentials: boolean } {
  try {
    const storePath = path.join(process.cwd(), 'uploads', 'data', 'data-sources.json');
    if (!fs.existsSync(storePath)) return { hasCredentials: false };
    const raw = fs.readFileSync(storePath, 'utf-8');
    const items = JSON.parse(raw) as Array<{ type?: string; name?: string; config?: Record<string, any> }>;
    const ga = items.find(i => i?.type === 'google_analytics' || /google\s*analytics/i.test(String(i?.name || '')));
    const cfg = ga?.config || {};
    const token = String(cfg.apiToken || cfg.credentialsBase64 || cfg.serviceAccountJson || '').trim();
    const propertyId = String(cfg.propertyId || '').trim();
    return { propertyId: propertyId || undefined, hasCredentials: Boolean(token) };
  } catch {
    return { hasCredentials: false };
  }
}

function resolvePropertyId(preferred?: string): string | undefined {
  if (preferred && String(preferred).trim()) return String(preferred).trim();
  if (process.env.GOOGLE_ANALYTICS_PROPERTY_ID && process.env.GOOGLE_ANALYTICS_PROPERTY_ID.trim()) {
    return process.env.GOOGLE_ANALYTICS_PROPERTY_ID.trim();
  }
  const fromStore = readGASettingsFromStore().propertyId;
  return fromStore && fromStore.trim() ? fromStore.trim() : undefined;
}

function isGAConfigured(propertyIdFromReq?: string) {
  const envCreds = Boolean(process.env.GOOGLE_CREDENTIALS_BASE64);
  const store = readGASettingsFromStore();
  const hasCreds = envCreds || store.hasCredentials;
  const propertyId = resolvePropertyId(propertyIdFromReq);
  return hasCreds && Boolean(propertyId);
}

// Google Analytics rapor endpoint'i
router.post('/google-analytics/report', async (req: Request, res: Response) => {
  try {
    const { propertyId, startDate, endDate, metrics, dimensions } = req.body;

    // Config validation
    if (!isGAConfigured(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Google Analytics yapılandırılmamış: GOOGLE_CREDENTIALS_BASE64 ve Property ID gerekli'
      });
    }

    // Property ID'yi env'den al veya request'ten kullan
    const finalPropertyId = resolvePropertyId(propertyId);
    
    if (!finalPropertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID gerekli' 
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Başlangıç ve bitiş tarihleri gerekli' 
      });
    }

    if (!metrics || metrics.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'En az bir metrik gerekli' 
      });
    }

    const report = await googleAnalyticsService.getReport(
      finalPropertyId,
      startDate,
      endDate,
      metrics,
      dimensions || []
    );

    // Veriyi daha kullanışlı formata dönüştür
    const formattedData = {
      success: true,
      propertyId: finalPropertyId,
      period: { startDate, endDate },
      metrics,
      dimensions,
      rowCount: report.rowCount,
      data: report.rows?.map((row: any) => {
        const dataRow: any = {};
        
        // Dimension değerlerini ekle
        if (dimensions && row.dimensionValues) {
          dimensions.forEach((dim: string, index: number) => {
            dataRow[dim] = row.dimensionValues[index]?.value || null;
          });
        }
        
        // Metric değerlerini ekle
        if (metrics && row.metricValues) {
          metrics.forEach((metric: string, index: number) => {
            dataRow[metric] = row.metricValues[index]?.value || 0;
          });
        }
        
        return dataRow;
      }) || []
    };

    res.json(formattedData);
    
  } catch (error: any) {
    console.error('Google Analytics API hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Google Analytics verisi alınamadı',
      error: error.message 
    });
  }
});

// Hazır raporlar için endpoint'ler
router.get('/google-analytics/reports/weekly-sessions', async (req: Request, res: Response) => {
  try {
    const propertyId = resolvePropertyId();
    if (!isGAConfigured(propertyId)) {
      return res.status(400).json({ success: false, message: 'Google Analytics yapılandırılmamış' });
    }
    
    if (!propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID yapılandırılmamış' 
      });
    }

    const report = await googleAnalyticsService.getReport(
      propertyId,
      '7daysAgo',
      'today',
      ['sessions', 'activeUsers', 'screenPageViews'],
      ['date']
    );

    const formattedData = {
      success: true,
      title: 'Son 7 Günlük Oturum Sayıları',
      data: report.rows?.map((row: any) => ({
        date: formatGADate(row.dimensionValues[0]?.value || ''),
        rawDate: row.dimensionValues[0]?.value || '',
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        activeUsers: parseInt(row.metricValues[1]?.value || '0'),
        pageViews: parseInt(row.metricValues[2]?.value || '0'),
      }))
      .sort((a: any, b: any) => b.rawDate.localeCompare(a.rawDate)) // En yeni tarih üstte
      || []
    };

    res.json(formattedData);
    
  } catch (error: any) {
    console.error('Weekly sessions report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Haftalık rapor alınamadı',
      error: error.message 
    });
  }
});

// Ülke bazlı trafik raporu
router.get('/google-analytics/reports/country-traffic', async (req: Request, res: Response) => {
  try {
    const propertyId = resolvePropertyId();
    if (!isGAConfigured(propertyId)) {
      return res.status(400).json({ success: false, message: 'Google Analytics yapılandırılmamış' });
    }
    
    if (!propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID yapılandırılmamış' 
      });
    }

    const report = await googleAnalyticsService.getReport(
      propertyId,
      '30daysAgo',
      'today',
      ['sessions', 'activeUsers', 'newUsers'],
      ['country']
    );

    const formattedData = {
      success: true,
      title: 'Son 30 Gün - Ülke Bazlı Trafik',
      data: report.rows?.map((row: any) => ({
        country: row.dimensionValues[0]?.value || 'Bilinmiyor',
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        activeUsers: parseInt(row.metricValues[1]?.value || '0'),
        newUsers: parseInt(row.metricValues[2]?.value || '0'),
      }))
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 10) || []
    };

    res.json(formattedData);
    
  } catch (error: any) {
    console.error('Country traffic report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ülke raporu alınamadı',
      error: error.message 
    });
  }
});

// Cihaz kategorisi raporu
router.get('/google-analytics/reports/device-category', async (req: Request, res: Response) => {
  try {
    const propertyId = resolvePropertyId();
    if (!isGAConfigured(propertyId)) {
      return res.status(400).json({ success: false, message: 'Google Analytics yapılandırılmamış' });
    }
    
    if (!propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID yapılandırılmamış' 
      });
    }

    const report = await googleAnalyticsService.getReport(
      propertyId,
      '7daysAgo',
      'today',
      ['sessions', 'bounceRate', 'averageSessionDuration'],
      ['deviceCategory']
    );

    const formattedData = {
      success: true,
      title: 'Son 7 Gün - Cihaz Kategorileri',
      data: report.rows?.map((row: any) => ({
        device: row.dimensionValues[0]?.value || 'Bilinmiyor',
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        bounceRate: parseFloat(row.metricValues[1]?.value || '0').toFixed(2),
        avgDuration: Math.round(parseFloat(row.metricValues[2]?.value || '0')),
      })) || []
    };

    res.json(formattedData);
    
  } catch (error: any) {
    console.error('Device category report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cihaz raporu alınamadı',
      error: error.message 
    });
  }
});

// Trafik kaynakları raporu
router.get('/google-analytics/reports/traffic-sources', async (req: Request, res: Response) => {
  try {
    const propertyId = resolvePropertyId();
    if (!isGAConfigured(propertyId)) {
      return res.status(400).json({ success: false, message: 'Google Analytics yapılandırılmamış' });
    }
    
    if (!propertyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Property ID yapılandırılmamış' 
      });
    }

    const report = await googleAnalyticsService.getReport(
      propertyId,
      '7daysAgo',
      'today',
      ['sessions', 'activeUsers'],
      ['sessionSource', 'sessionMedium']
    );

    const formattedData = {
      success: true,
      title: 'Son 7 Gün - Trafik Kaynakları',
      data: report.rows?.map((row: any) => ({
        source: row.dimensionValues[0]?.value || 'Bilinmiyor',
        medium: row.dimensionValues[1]?.value || 'Bilinmiyor',
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        users: parseInt(row.metricValues[1]?.value || '0'),
      }))
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 10) || []
    };

    res.json(formattedData);
    
  } catch (error: any) {
    console.error('Traffic sources report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Trafik kaynakları raporu alınamadı',
      error: error.message 
    });
  }
});

// Özel rapor sonuçlarını kaydetme endpoint'i
router.post('/google-analytics/report/save', async (req: Request, res: Response) => {
  try {
    const { reportData, reportName, selectedMetrics, selectedDimensions, dateRange } = req.body;

    if (!reportData || !reportData.data || reportData.data.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kaydedilecek rapor verisi bulunamadı' 
      });
    }

    // Dosya adı oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `GA-${reportName || 'Custom'}-${timestamp}`;
    
    // Reports dizinini kontrol et/oluştur
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Excel dosyası oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Google Analytics Raporu');

    // Başlık bilgileri
    worksheet.addRow(['Google Analytics Özel Raporu']);
    worksheet.addRow([`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`]);
    worksheet.addRow([`Veri Dönemi: ${dateRange?.startDate} - ${dateRange?.endDate}`]);
    worksheet.addRow([`Seçilen Metrikler: ${selectedMetrics?.join(', ')}`]);
    worksheet.addRow([`Seçilen Boyutlar: ${selectedDimensions?.join(', ')}`]);
    worksheet.addRow([]); // Boş satır

    // Tablo başlıkları
    const headers = [];
    if (selectedDimensions && selectedDimensions.length > 0) {
      headers.push(...selectedDimensions);
    }
    if (selectedMetrics && selectedMetrics.length > 0) {
      headers.push(...selectedMetrics);
    }
    
    worksheet.addRow(headers);

    // Veri satırları
    reportData.data.forEach((row: any) => {
      const dataRow: any[] = [];
      
      // Dimension değerleri
      if (selectedDimensions) {
        selectedDimensions.forEach((dim: string) => {
          dataRow.push(row[dim] || '');
        });
      }
      
      // Metric değerleri
      if (selectedMetrics) {
        selectedMetrics.forEach((metric: string) => {
          const value = row[metric];
          if (typeof value === 'number') {
            dataRow.push(value);
          } else {
            dataRow.push(parseFloat(value) || value || 0);
          }
        });
      }
      
      worksheet.addRow(dataRow);
    });

    // Stil ayarları
    const headerRow = worksheet.getRow(7);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Sütun genişlikleri
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Excel dosyasını kaydet
    const excelPath = path.join(reportsDir, `${fileName}.xlsx`);
    await workbook.xlsx.writeFile(excelPath);

    // CSV dosyası da oluştur
    const csvPath = path.join(reportsDir, `${fileName}.csv`);
    let csvContent = `# Google Analytics Özel Raporu\n`;
    csvContent += `# Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}\n`;
    csvContent += `# Veri Dönemi: ${dateRange?.startDate} - ${dateRange?.endDate}\n`;
    csvContent += `# Seçilen Metrikler: ${selectedMetrics?.join(', ')}\n`;
    csvContent += `# Seçilen Boyutlar: ${selectedDimensions?.join(', ')}\n\n`;
    
    // CSV başlık
    csvContent += headers.join(',') + '\n';
    
    // CSV veri
    reportData.data.forEach((row: any) => {
      const csvRow: any[] = [];
      
      if (selectedDimensions) {
        selectedDimensions.forEach((dim: string) => {
          csvRow.push(`"${row[dim] || ''}"`);
        });
      }
      
      if (selectedMetrics) {
        selectedMetrics.forEach((metric: string) => {
          csvRow.push(row[metric] || 0);
        });
      }
      
      csvContent += csvRow.join(',') + '\n';
    });

    fs.writeFileSync(csvPath, csvContent);

    res.json({
      success: true,
      message: 'Rapor başarıyla kaydedildi',
      files: {
        excel: `/uploads/reports/${fileName}.xlsx`,
        csv: `/uploads/reports/${fileName}.csv`
      },
      reportInfo: {
        name: fileName,
        createdAt: new Date().toISOString(),
        rowCount: reportData.data.length,
        metrics: selectedMetrics,
        dimensions: selectedDimensions
      }
    });

  } catch (error: any) {
    console.error('Report save error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Rapor kaydedilemedi',
      error: error.message 
    });
  }
});

// Google Analytics kaydedilmiş raporları listeleme endpoint'i
router.get('/google-analytics/reports/saved', async (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Reports dizinini kontrol et
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Dosyaları oku ve detaylarını al
    const files = fs.readdirSync(reportsDir);
    const reports = [];

    for (const file of files) {
      // Klasörleri atla, sadece dosyaları işle
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        continue;
      }

      // Desteklenen dosya formatları
      const extension = path.extname(file).toLowerCase();
      const supportedFormats = ['.xlsx', '.csv', '.pdf', '.html', '.mhtml', '.json'];
      
      if (!supportedFormats.includes(extension)) {
        continue;
      }

      let reportName = file.replace(path.extname(file), '');
      let reportType = 'Özel Rapor';
      let timestamp = stats.birthtime || stats.mtime; // Dosya oluşturma tarihi veya değiştirilme tarihi

      // Google Analytics raporları için özel parsing
      if (file.startsWith('GA-')) {
        const nameParts = file.replace(path.extname(file), '').split('-');
        if (nameParts.length >= 3) {
          reportName = nameParts[1] || 'Custom Report';
          reportType = 'Google Analytics';
          
          // Timestamp'i parse et (YYYY-MM-DDTHH-MM-SS formatında)
          const timestampStr = nameParts.slice(2).join('-');
          const dateMatch = timestampStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            const [, year, month, day, hour, minute, second] = dateMatch;
            timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
          }
        }
      } else {
        // Manuel eklenen raporlar için dosya adını temizle
        reportName = file
          .replace(path.extname(file), '')
          .replace(/[_-]/g, ' ')
          .trim();
        
        // Rapor türünü içeriğe göre tahmin et
        const fileName = file.toLowerCase();
        if (fileName.includes('analytics') || fileName.includes('analiz')) {
          reportType = 'Analiz Raporu';
        } else if (fileName.includes('trend') || fileName.includes('trendi')) {
          reportType = 'Trend Analizi';
        } else if (fileName.includes('performance') || fileName.includes('performans')) {
          reportType = 'Performans Raporu';
        } else if (fileName.includes('keyword') || fileName.includes('anahtar')) {
          reportType = 'Keyword Raporu';
        } else if (fileName.includes('customer') || fileName.includes('musteri')) {
          reportType = 'Müşteri Analizi';
        } else if (fileName.includes('bounce') || fileName.includes('cikis')) {
          reportType = 'Davranış Analizi';
        }
      }

      reports.push({
        id: file.replace(path.extname(file), ''),
        fileName: file,
        title: reportName,
        type: reportType,
        format: extension.replace('.', '').toUpperCase(),
        size: formatFileSize(stats.size),
        sizeBytes: stats.size,
        createdAt: timestamp,
        formattedDate: timestamp.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        downloadUrl: `/uploads/reports/${file}`,
        status: 'completed'
      });
    }

    // En yeni raporları en üste sırala
    reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({
      success: true,
      data: reports,
      total: reports.length
    });

  } catch (error: any) {
    console.error('Saved reports list error:', error);
    res.status(500).json({
      success: false,
      message: 'Kaydedilmiş raporlar listelenemedi',
      error: error.message
    });
  }
});

// Dosya boyutunu formatla
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
