import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { reportService } from '../services/reportService';

const Reports: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ReportsList />} />
      <Route path="/new" element={<CreateReport />} />
      <Route path="/:id" element={<ReportDetail />} />
    </Routes>
  );
};

const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Pagination states (currently unused)
  // const [totalReports, setTotalReports] = useState(0);
  // const reportsPerPage = 6; // Sayfa başına 6 rapor

  const categories = [
    { id: 'satis', name: 'Satış', icon: '💰', color: 'text-green-600 bg-green-50' },
    { id: 'marka', name: 'Marka', icon: '🏷️', color: 'text-purple-600 bg-purple-50' },
    { id: 'teknik', name: 'Teknik', icon: '⚙️', color: 'text-blue-600 bg-blue-50' },
    { id: 'seo', name: 'SEO', icon: '🔍', color: 'text-orange-600 bg-orange-50' },
    { id: 'genel', name: 'Genel', icon: '📊', color: 'text-indigo-600 bg-indigo-50' },
    { id: 'global', name: 'Global', icon: '🌍', color: 'text-emerald-600 bg-emerald-50' }
  ];

  // Rapor kategorisi otomatik atama fonksiyonu
  const assignCategory = (report: any) => {
    const title = report.title.toLowerCase();
    const fileName = (report.fileName || '').toLowerCase();
    const content = `${title} ${fileName}`;

    if (content.includes('satış') || content.includes('sales') || content.includes('gelir') || content.includes('revenue')) {
      return 'satis';
    }
    if (content.includes('marka') || content.includes('brand') || content.includes('logo') || content.includes('kampanya')) {
      return 'marka';
    }
    if (content.includes('teknik') || content.includes('technical') || content.includes('api') || content.includes('sistem')) {
      return 'teknik';
    }
    if (content.includes('seo') || content.includes('arama') || content.includes('search') || content.includes('google')) {
      return 'seo';
    }
    if (content.includes('global') || content.includes('dünya') || content.includes('world') || content.includes('international')) {
      return 'global';
    }
    return 'genel'; // Varsayılan kategori
  };

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/analytics/google-analytics/reports/saved');
        
        if (response.data.success) {
          // Raporlara kategori ata
          const reportsWithCategories = response.data.data.map((report: any) => ({
            ...report,
            category: assignCategory(report)
          }));
          
          setReports(reportsWithCategories);
          // setTotalReports(response.data.total || reportsWithCategories.length);
        } else {
          setError('Raporlar yüklenemedi');
        }
      } catch (err: any) {
        console.error('Failed to load reports:', err);
        setError('Raporlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'processing': return 'text-yellow-700 bg-yellow-100';
      case 'draft': return 'text-gray-700 bg-gray-100';
      case 'archived': return 'text-red-700 bg-red-100';
      default: return 'text-green-700 bg-green-100';
    }
  };

  const getFormatIcon = (format: string) => {
    return format.toUpperCase();
  };

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'xlsx': return 'text-green-700 bg-green-100';
      case 'csv': return 'text-blue-700 bg-blue-100';
      case 'pdf': return 'text-red-700 bg-red-100';
      case 'html': return 'text-orange-700 bg-orange-100';
      case 'mhtml': return 'text-orange-700 bg-orange-100';
      case 'json': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Client-side filtering for current page
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.fileName && report.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || report.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  // Kategori bazlı raporları grupla
  const reportsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredReports.filter(report => report.category === category.id);
    return acc;
  }, {} as Record<string, any[]>);

  // Pagination calculations
  // Pagination calculations (reserved for future use)
  // const totalPages = Math.ceil(totalReports / reportsPerPage);
  // const startIndex = (currentPage - 1) * reportsPerPage;
  // const endIndex = Math.min(startIndex + reportsPerPage, totalReports);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            MetricNex Raporları
          </h1>
          <p className="mt-2 text-gray-600">
            Kaydedilmiş analitik raporlarınızı görüntüleyin ve indirin
          </p>
        </div>
        <button
          onClick={() => navigate('/google-analytics')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <ChartBarIcon className="mr-2 h-4 w-4" />
          Yeni Rapor Oluştur
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Search */}
          <div className="relative col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rapor ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange();
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                handleFilterChange();
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tüm Formatlar</option>
              <option value="XLSX">Excel (XLSX)</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
              <option value="HTML">HTML</option>
              <option value="MHTML">MHTML</option>
              <option value="JSON">JSON</option>
            </select>
          </div>

          {/* Clear filters */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedCategory('all');
                handleFilterChange();
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Category-based Reports Display */}
      {selectedCategory === 'all' ? (
        // Kategoriye göre gruplar halinde göster
        <div className="space-y-6">
          {categories.map(category => {
            const categoryReports = reportsByCategory[category.id] || [];
            if (categoryReports.length === 0) return null;

            return (
              <div key={category.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-200 ${category.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center space-x-2">
                      <span className="text-xl">{category.icon}</span>
                      <span>{category.name}</span>
                      <span className="text-sm font-normal">({categoryReports.length})</span>
                    </h3>
                    <button 
                      onClick={() => setSelectedCategory(category.id)}
                      className="text-sm text-current hover:underline"
                    >
                      Tümünü Gör
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {categoryReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => window.open(`http://localhost:3000${report.downloadUrl}`, '_blank')}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <ChartBarIcon className="h-5 w-5 text-blue-500" />
                            <h4 className="text-lg font-medium text-gray-900">
                              {report.title}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status)}`}>
                              {report.status === 'completed' ? 'Tamamlandı' : report.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {report.fileName}
                            </span>
                            <span>{report.type}</span>
                            <span>{report.formattedDate}</span>
                            <span>{report.size}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatColor(report.format)}`}>
                            {getFormatIcon(report.format)}
                          </span>
                          <div className="flex space-x-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`http://localhost:3000${report.downloadUrl}`, '_blank');
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="İndir"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Seçili kategorideki tüm raporları göster
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <span className="text-xl">{categories.find(c => c.id === selectedCategory)?.icon}</span>
                <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                <span className="text-sm font-normal">({filteredReports.length})</span>
              </h3>
              <button 
                onClick={() => setSelectedCategory('all')}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Tüm Kategoriler
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => window.open(`http://localhost:3000${report.downloadUrl}`, '_blank')}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <ChartBarIcon className="h-5 w-5 text-blue-500" />
                      <h4 className="text-lg font-medium text-gray-900">
                        {report.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status)}`}>
                        {report.status === 'completed' ? 'Tamamlandı' : report.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {report.fileName}
                      </span>
                      <span>{report.type}</span>
                      <span>{report.formattedDate}</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatColor(report.format)}`}>
                      {getFormatIcon(report.format)}
                    </span>
                    <div className="flex space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`http://localhost:3000${report.downloadUrl}`, '_blank');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="İndir"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="p-12 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  Bu kategoride rapor bulunamadı
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Henüz bu kategoriye ait kayıtlı rapor bulunmuyor.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no reports at all */}
      {filteredReports.length === 0 && selectedCategory === 'all' && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              {searchTerm || selectedType !== 'all' 
                ? 'Arama kriterlerinize uygun rapor bulunamadı' 
                : 'Henüz kaydedilmiş rapor yok'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all'
                ? 'Arama kriterlerinizi değiştirmeyi deneyin.'
                : 'Google Analytics sayfasından yeni raporlar oluşturabilirsiniz.'}
            </p>
            {(!searchTerm && selectedType === 'all') && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/google-analytics')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
                >
                  <ChartBarIcon className="mr-2 h-4 w-4" />
                  Rapor Oluştur
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const CreateReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sales',
    format: 'pdf',
    timeRange: 'last_30_days'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/reports');
    } catch (error) {
      console.error('Failed to create report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Create New Report</h3>
          <p className="mt-1 text-sm text-gray-600">
            Generate a new report with your specified parameters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Report Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter report title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Describe what this report will contain"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="customer">Customer Analytics</option>
                <option value="financial">Financial Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Output Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="html">HTML Report</option>
                <option value="json">JSON Data</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time Range</label>
            <select
              value={formData.timeRange}
              onChange={(e) => setFormData(prev => ({ ...prev, timeRange: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await reportService.getReport(id);
        
        if (response.success) {
          setReport(response.data);
        } else {
          setError('Report not found');
        }
      } catch (err: any) {
        console.error('Failed to load report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">{error || 'Report not found'}</h3>
        <p className="mt-2 text-sm text-gray-500">
          The report you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
          >
            ← Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-700 bg-green-100';
      case 'processing': return 'text-yellow-700 bg-yellow-100';
      case 'draft': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const handleDownload = () => {
    if (report.downloadUrl) {
      window.open(`http://localhost:3000${report.downloadUrl}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={() => navigate('/reports')}
                className="text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: report.category?.color || '#6B7280' }}
              />
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{report.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Type:</span>
                <p className="capitalize">{report.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Format:</span>
                <p className="uppercase">{report.format}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <p>{report.createdAt}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Size:</span>
                <p>{report.fileSize}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {(report.format === 'html' || report.format === 'pdf') && (
              <button
                onClick={() => window.open(`http://localhost:3000/api/reports/${report.id}/download`, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                Full Screen
              </button>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Preview */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
        
        {(report.format === 'html' || report.format === 'pdf') ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <iframe
              src={report.format === 'pdf' 
                ? `http://localhost:3000/api/reports/${report.id}/download#toolbar=1&navpanes=1&scrollbar=1` 
                : `http://localhost:3000/api/reports/${report.id}/download`
              }
              className="w-full h-[800px] border-0"
              title={report.title}
              style={{
                minHeight: '800px',
                background: 'white'
              }}
            />
          </div>
        ) : report.format === 'excel' ? (
          <div className="border border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Excel Spreadsheet</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                Excel files contain structured data that's best viewed in a spreadsheet application.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900">File Size</div>
                  <div className="text-lg text-green-600">{report.fileSize}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900">Format</div>
                  <div className="text-lg text-green-600">{report.format.toUpperCase()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900">Created</div>
                  <div className="text-lg text-green-600">{report.createdAt}</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                  Download Excel File
                </button>
                <button
                  onClick={() => window.open(`http://localhost:3000/api/reports/${report.id}/download`, '_blank')}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Open in Browser
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">Preview not available</h3>
            <p className="mt-2 text-sm text-gray-500">
              {report.format.toUpperCase()} files cannot be previewed in browser. Please download to view.
            </p>
            <div className="mt-4">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Download {report.format.toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Metadata */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Information</h3>
        
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.category?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created By</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.createdBy}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">File Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{report.filename}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">File Size</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.fileSize}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Reports;
