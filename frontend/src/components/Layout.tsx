import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PresentationChartLineIcon,
  CursorArrowRippleIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, description: 'Genel Bakış' },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon, description: 'Raporlar' },
    { name: 'Analytics', href: '/google-analytics', icon: PresentationChartLineIcon, description: 'Google Analytics' },
    { name: 'Ads', href: '/google-ads', icon: CursorArrowRippleIcon, description: 'Google Ads' },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, description: 'Ayarlar' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-gray-200">
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-center border-b border-gray-200 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-md flex items-center justify-center">
                  <PresentationChartLineIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold tracking-tight">MetricNex</h1>
              <p className="text-xs text-primary-100 font-medium">Analytics Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 shadow-sm border border-primary-100'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <item.icon
                      className={`mr-4 h-5 w-5 flex-shrink-0 transition-colors ${
                        active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs ${active ? 'text-primary-500' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                    {active && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User menu at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">MetricNex Admin</p>
              <p className="text-xs text-gray-500">Analytics Manager</p>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200"
              title="Çıkış Yap"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {location.pathname === '/' ? 'Dashboard' : 
                   location.pathname === '/reports' ? 'Raporlar' :
                   location.pathname === '/google-analytics' ? 'Google Analytics' :
                   location.pathname === '/google-ads' ? 'Google Ads' : 'Ayarlar'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {location.pathname === '/' ? 'Genel performans göstergeleri ve analitikler' : 
                   location.pathname === '/reports' ? 'Kaydedilmiş raporlarınızı görüntüleyin' :
                   location.pathname === '/google-analytics' ? 'Web sitesi trafik analizi ve raporları' :
                   location.pathname === '/google-ads' ? 'Reklam kampanyası performans metrikleri' : 'Sistem ayarları ve konfigürasyonlar'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('tr-TR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
