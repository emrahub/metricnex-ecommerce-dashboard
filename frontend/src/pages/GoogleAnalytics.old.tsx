import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { googleAnalyticsService } from '../services/googleAnalyticsService';
import { GoogleAnalyticsReport } from '../types';
import { CalendarIcon, GlobeAltIcon, DevicePhoneMobileIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface ReportData {
  success: boolean;
  title: string;
  data: any[];
}

const GoogleAnalytics: React.FC = () => {
  const [propertyId, setPropertyId] = useState('349428903');
  const [startDate, setStartDate] = useState('2025-05-01');
  const [endDate, setEndDate] = useState('2025-05-31');
  const [metrics, setMetrics] = useState('activeUsers');
  const [dimensions, setDimensions] = useState('country');
  const [activeTab, setActiveTab] = useState<'custom' | 'weekly' | 'country' | 'device' | 'traffic'>('weekly');

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
    mutation.mutate({
      propertyId,
      startDate,
      endDate,
      metrics: metrics.split(',').map(m => m.trim()),
      dimensions: dimensions.split(',').map(d => d.trim()),
    });
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
                <div>
                  <label htmlFor="metrics" className="block text-sm font-medium text-gray-700">Metrikler (virgülle ayırın)</label>
                  <input
                    type="text"
                    id="metrics"
                    value={metrics}
                    placeholder="activeUsers,sessions,screenPageViews"
                    onChange={(e) => setMetrics(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700">Boyutlar (virgülle ayırın)</label>
                  <input
                    type="text"
                    id="dimensions"
                    value={dimensions}
                    placeholder="country,city,deviceCategory"
                    onChange={(e) => setDimensions(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                >
                  {mutation.isPending ? 'Rapor Alınıyor...' : 'Rapor Al'}
                </button>
              </div>
              
              {mutation.isError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  <p>Hata: {mutation.error?.message}</p>
                </div>
              )}

              {mutation.data && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Rapor Sonuçları</h4>
                  <div className="overflow-x-auto">
                    <pre className="bg-gray-100 p-4 rounded-md text-sm">
                      {JSON.stringify(mutation.data, null, 2)}
                    </pre>
                  </div>
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
