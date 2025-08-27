import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { googleAnalyticsService } from '../services/googleAnalyticsService';
import { GoogleAnalyticsReport } from '../types';
import { CalendarIcon, GlobeAltIcon, DevicePhoneMobileIcon, ArrowTrendingUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ReportData {
  success: boolean;
  title: string;
  data: any[];
}

// Google Analytics metrik listesi
const AVAILABLE_METRICS = [
  { value: 'activeUsers', label: 'Aktif Kullanıcılar', description: 'Belirli dönemdeki aktif kullanıcılar' },
  { value: 'newUsers', label: 'Yeni Kullanıcılar', description: 'İlk kez ziyaret edenler' },
  { value: 'sessions', label: 'Oturumlar', description: 'Toplam oturum sayısı' },
  { value: 'screenPageViews', label: 'Sayfa Görüntüleme', description: 'Toplam sayfa görüntüleme' },
  { value: 'bounceRate', label: 'Çıkış Oranı', description: 'Tek sayfa ziyaretleri yüzdesi' },
  { value: 'averageSessionDuration', label: 'Ortalama Oturum Süresi', description: 'Ortalama ziyaret süresi' },
  { value: 'engagementRate', label: 'Etkileşim Oranı', description: 'Etkileşimli oturum yüzdesi' },
  { value: 'eventsPerSession', label: 'Oturum Başı Etkinlik', description: 'Oturum başına ortalama etkinlik' },
  { value: 'conversions', label: 'Dönüşümler', description: 'Toplam dönüşüm sayısı' },
  { value: 'totalRevenue', label: 'Toplam Gelir', description: 'Toplam gelir miktarı' },
];

// Google Analytics boyut listesi
const AVAILABLE_DIMENSIONS = [
  { value: 'date', label: 'Tarih', description: 'Gün bazlı' },
  { value: 'country', label: 'Ülke', description: 'Ziyaretçi ülkesi' },
  { value: 'city', label: 'Şehir', description: 'Ziyaretçi şehri' },
  { value: 'deviceCategory', label: 'Cihaz Kategorisi', description: 'Desktop/Mobile/Tablet' },
  { value: 'browser', label: 'Tarayıcı', description: 'Chrome, Safari, Firefox vb.' },
  { value: 'operatingSystem', label: 'İşletim Sistemi', description: 'Windows, iOS, Android vb.' },
  { value: 'sessionSource', label: 'Trafik Kaynağı', description: 'Google, Facebook, Direct vb.' },
  { value: 'sessionMedium', label: 'Trafik Ortamı', description: 'Organic, CPC, Email vb.' },
  { value: 'pagePath', label: 'Sayfa Yolu', description: 'Ziyaret edilen sayfalar' },
  { value: 'landingPage', label: 'Giriş Sayfası', description: 'İlk görülen sayfa' },
  { value: 'sessionDefaultChannelGroup', label: 'Kanal Grubu', description: 'Organik, Ücretli, Sosyal vb.' },
  { value: 'dayOfWeek', label: 'Haftanın Günü', description: 'Pazartesi, Salı vb.' },
  { value: 'hour', label: 'Saat', description: 'Gün içi saat dağılımı' },
];

const GoogleAnalytics: React.FC = () => {
  const [propertyId, setPropertyId] = useState('349428903');
  const [startDate, setStartDate] = useState('2025-05-01');
  const [endDate, setEndDate] = useState('2025-05-31');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['activeUsers', 'sessions']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['country']);
  const [showMetricsDropdown, setShowMetricsDropdown] = useState(false);
  const [showDimensionsDropdown, setShowDimensionsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'weekly' | 'country' | 'device' | 'traffic'>('weekly');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const mutation = useMutation<GoogleAnalyticsReport, Error, Parameters<typeof googleAnalyticsService.getReport>[0]>({
    mutationFn: (params) => googleAnalyticsService.getReport(params),
  });

  // Hazır raporlar
  const weeklyReport = useQuery<ReportData>({
    queryKey: ['analytics', 'weekly-sessions'],
    queryFn: () => fetch('/api/analytics/google-analytics/reports/weekly-sessions').then(res => res.json()),
    enabled: activeTab === 'weekly'
  });

  const countryReport = useQuery<ReportData>({
    queryKey: ['analytics', 'country-traffic'],
    queryFn: () => fetch('/api/analytics/google-analytics/reports/country-traffic').then(res => res.json()),
    enabled: activeTab === 'country'
  });

  const deviceReport = useQuery<ReportData>({
    queryKey: ['analytics', 'device-category'],
    queryFn: () => fetch('/api/analytics/google-analytics/reports/device-category').then(res => res.json()),
    enabled: activeTab === 'device'
  });

  const trafficReport = useQuery<ReportData>({
    queryKey: ['analytics', 'traffic-sources'],
    queryFn: () => fetch('/api/analytics/google-analytics/reports/traffic-sources').then(res => res.json()),
    enabled: activeTab === 'traffic'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMetrics.length === 0) {
      alert('En az bir metrik seçmelisiniz!');
      return;
    }
    mutation.mutate({
      propertyId,
      startDate,
      endDate,
      metrics: selectedMetrics,
      dimensions: selectedDimensions,
    });
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleDimension = (dimension: string) => {
    setSelectedDimensions(prev => 
      prev.includes(dimension) 
        ? prev.filter(d => d !== dimension)
        : [...prev, dimension]
    );
  };

  const formatMetricValue = (value: any, metric: string): string => {
    if (value === null || value === undefined) return '-';
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return value.toString();

    // Yüzde metrikler
    if (metric.includes('Rate') || metric.includes('rate')) {
      return `${numValue.toFixed(2)}%`;
    }
    
    // Para birimi
    if (metric.includes('Revenue') || metric.includes('revenue')) {
      return `₺${numValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }
    
    // Süre (saniye)
    if (metric.includes('Duration') || metric.includes('duration')) {
      const minutes = Math.floor(numValue / 60);
      const seconds = Math.floor(numValue % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Sayısal değerler
    if (numValue >= 1000) {
      return numValue.toLocaleString('tr-TR');
    }
    
    return numValue.toString();
  };

  const saveReport = async (reportData: any) => {
    try {
      setSaveMessage(null);
      
      const response = await fetch('/api/analytics/google-analytics/report/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData,
          reportName: 'OzelRapor',
          selectedMetrics,
          selectedDimensions,
          dateRange: { startDate, endDate }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveMessage({
          type: 'success',
          text: `Rapor başarıyla kaydedildi! Excel: ${result.files.excel} | CSV: ${result.files.csv}`
        });
      } else {
        setSaveMessage({
          type: 'error',
          text: result.message || 'Rapor kaydedilemedi'
        });
      }
    } catch (error: any) {
      setSaveMessage({
        type: 'error',
        text: 'Rapor kaydedilirken hata oluştu: ' + error.message
      });
    }
  };

  const renderWeeklyChart = (data: any[]) => {
    if (!data || data.length === 0) return <p>Veri bulunamadı</p>;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.slice(0, 3).map((item, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-600">{item.date}</div>
              <div className="text-2xl font-bold text-gray-900">{item.sessions?.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-gray-500">oturum</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oturumlar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktif Kullanıcılar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sayfa Görüntüleme</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sessions?.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.activeUsers?.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pageViews?.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCountryTable = (data: any[]) => {
    if (!data || data.length === 0) return <p>Veri bulunamadı</p>;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ülke</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oturumlar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktif Kullanıcılar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yeni Kullanıcılar</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.country}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sessions?.toLocaleString('tr-TR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.activeUsers?.toLocaleString('tr-TR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.newUsers?.toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Google Analytics</h1>
        <p className="mt-2 text-gray-600">Elle Shoes Analytics Raporları</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'weekly', label: 'Son 7 Gün', icon: CalendarIcon },
            { key: 'country', label: 'Ülke Bazlı', icon: GlobeAltIcon },
            { key: 'device', label: 'Cihaz Türü', icon: DevicePhoneMobileIcon },
            { key: 'traffic', label: 'Trafik Kaynağı', icon: ArrowTrendingUpIcon },
            { key: 'custom', label: 'Özel Rapor', icon: null },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'weekly' && 'Son 7 Günlük Oturum Sayıları'}
            {activeTab === 'country' && 'Ülke Bazlı Trafik (Son 30 Gün)'}
            {activeTab === 'device' && 'Cihaz Kategorileri (Son 7 Gün)'}
            {activeTab === 'traffic' && 'Trafik Kaynakları (Son 7 Gün)'}
            {activeTab === 'custom' && 'Özel Rapor'}
          </h3>
        </div>
        <div className="p-6">
          {activeTab === 'weekly' && (
            <div>
              {weeklyReport.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : weeklyReport.error ? (
                <div className="text-red-600">Hata: {weeklyReport.error.message}</div>
              ) : (
                renderWeeklyChart(weeklyReport.data?.data || [])
              )}
            </div>
          )}

          {activeTab === 'country' && (
            <div>
              {countryReport.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : countryReport.error ? (
                <div className="text-red-600">Hata: {countryReport.error.message}</div>
              ) : (
                renderCountryTable(countryReport.data?.data || [])
              )}
            </div>
          )}

          {activeTab === 'device' && (
            <div>
              {deviceReport.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : deviceReport.error ? (
                <div className="text-red-600">Hata: {deviceReport.error.message}</div>
              ) : deviceReport.data?.data ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cihaz</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oturumlar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çıkış Oranı (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ort. Süre (sn)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deviceReport.data.data.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.device}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sessions?.toLocaleString('tr-TR')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bounceRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.avgDuration}sn</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>Veri bulunamadı</p>}
            </div>
          )}

          {activeTab === 'traffic' && (
            <div>
              {trafficReport.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : trafficReport.error ? (
                <div className="text-red-600">Hata: {trafficReport.error.message}</div>
              ) : trafficReport.data?.data ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kaynak</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medya</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oturumlar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcılar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trafficReport.data.data.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.source}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.medium}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sessions?.toLocaleString('tr-TR')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.users?.toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>Veri bulunamadı</p>}
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">Property ID</label>
                  <input
                    type="text"
                    id="propertyId"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div></div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Metrikler Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metrikler 
                  <span className="text-xs text-gray-500 ml-2">
                    ({selectedMetrics.length} seçili)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMetricsDropdown(!showMetricsDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {selectedMetrics.length > 0 
                        ? selectedMetrics.map(m => AVAILABLE_METRICS.find(am => am.value === m)?.label).join(', ')
                        : 'Metrik seçin...'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
                
                {showMetricsDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {AVAILABLE_METRICS.map((metric) => (
                      <div
                        key={metric.value}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleMetric(metric.value)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedMetrics.includes(metric.value)}
                            onChange={() => {}}
                            className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                            <div className="text-xs text-gray-500">{metric.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Boyutlar Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boyutlar 
                  <span className="text-xs text-gray-500 ml-2">
                    ({selectedDimensions.length} seçili)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDimensionsDropdown(!showDimensionsDropdown)}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {selectedDimensions.length > 0 
                        ? selectedDimensions.map(d => AVAILABLE_DIMENSIONS.find(ad => ad.value === d)?.label).join(', ')
                        : 'Boyut seçin...'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
                
                {showDimensionsDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {AVAILABLE_DIMENSIONS.map((dimension) => (
                      <div
                        key={dimension.value}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleDimension(dimension.value)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedDimensions.includes(dimension.value)}
                            onChange={() => {}}
                            className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{dimension.label}</div>
                            <div className="text-xs text-gray-500">{dimension.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                >
                  {mutation.isPending ? 'Rapor Alınıyor...' : 'Rapor Al'}
                </button>
                
                {selectedMetrics.length === 0 && (
                  <span className="text-xs text-red-500">En az bir metrik seçmelisiniz!</span>
                )}
              </div>
              
              {mutation.isError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <p>Hata: {mutation.error?.message}</p>
                </div>
              )}

              {saveMessage && (
                <div className={`px-4 py-3 rounded-lg ${
                  saveMessage.type === 'success' 
                    ? 'bg-green-100 border border-green-400 text-green-700' 
                    : 'bg-red-100 border border-red-400 text-red-700'
                }`}>
                  <p>{saveMessage.text}</p>
                  {saveMessage.type === 'success' && (
                    <div className="mt-2 space-x-2">
                      <a 
                        href={`http://localhost:3000${saveMessage.text.match(/Excel: ([^\s|]+)/)?.[1]}`}
                        download
                        className="text-sm underline hover:no-underline"
                      >
                        📊 Excel İndir
                      </a>
                      <a 
                        href={`http://localhost:3000${saveMessage.text.match(/CSV: ([^\s|]+)/)?.[1]}`}
                        download
                        className="text-sm underline hover:no-underline ml-4"
                      >
                        📄 CSV İndir
                      </a>
                    </div>
                  )}
                </div>
              )}

              {mutation.data && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Rapor Sonuçları ({mutation.data.data?.length || 0} kayıt)
                    </h4>
                    <button
                      onClick={() => saveReport(mutation.data)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      📊 Raporu Kaydet
                    </button>
                  </div>
                  
                  {mutation.data.data && mutation.data.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            {/* Boyut başlıkları */}
                            {selectedDimensions.map((dimension) => (
                              <th
                                key={dimension}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {AVAILABLE_DIMENSIONS.find(d => d.value === dimension)?.label || dimension}
                              </th>
                            ))}
                            {/* Metrik başlıkları */}
                            {selectedMetrics.map((metric) => (
                              <th
                                key={metric}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {AVAILABLE_METRICS.find(m => m.value === metric)?.label || metric}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {mutation.data.data.slice(0, 100).map((row: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {/* Boyut değerleri */}
                              {selectedDimensions.map((dimension) => (
                                <td key={dimension} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {row[dimension] || '-'}
                                </td>
                              ))}
                              {/* Metrik değerleri */}
                              {selectedMetrics.map((metric) => (
                                <td key={metric} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatMetricValue(row[metric], metric)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {mutation.data.data.length > 100 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          İlk 100 kayıt gösteriliyor. Tüm veriler için raporu kaydedin.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Seçilen kriterlere göre veri bulunamadı.</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleAnalytics;