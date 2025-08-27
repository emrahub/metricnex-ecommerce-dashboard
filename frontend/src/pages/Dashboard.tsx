import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { reportService } from '../services/reportService';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import type { Report } from '../types';

const Dashboard: React.FC = () => {
  // Fetch dashboard metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardService.getMetrics(),
  });

  // Fetch recent reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['recent-reports'],
    queryFn: () => reportService.getReports({ limit: 4 }),
  });

  const metrics = metricsData?.data || {
    totalReports: 0,
    reportsThisMonth: 0,
    activeScheduledReports: 0,
    totalDataSources: 0
  };

  const recentReports = reportsData?.data || [];

  const renderRecentReports = () => {
    if (reportsLoading) {
      return (
        [...Array(3)].map((_, i) => (
          <div key={i} className="px-6 py-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))
      );
    }

    if (recentReports.length > 0) {
      return recentReports.map((report: Report) => {
        const TypeIcon = getTypeIcon(report.type);
        return (
          <div key={report.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TypeIcon className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{report.title}</p>
                  <p className="text-sm text-gray-500 capitalize">{report.type} Report</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
                <span className="text-sm text-gray-500">{report.createdAt}</span>
              </div>
            </div>
          </div>
        );
      });
    }

    return (
      <div className="px-6 py-8 text-center">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">No reports yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first report.
        </p>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return ChartBarIcon;
      case 'inventory': return DocumentTextIcon;
      case 'customer': return UsersIcon;
      case 'financial': return CurrencyDollarIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your e-commerce reporting system
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 animate-pulse">
              <div className="px-6 py-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
        <>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reports
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {metrics.totalReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {metrics.reportsThisMonth}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Scheduled Reports
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {metrics.activeScheduledReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Data Sources
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {metrics.totalDataSources}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors">
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              New Report
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <ClockIcon className="mr-2 h-4 w-4" />
              Schedule Report
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <ChartBarIcon className="mr-2 h-4 w-4" />
              View Analytics
            </button>
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Cog6ToothIcon className="mr-2 h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all →
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">{renderRecentReports()}</div>
      </div>
    </div>
  );
};

export default Dashboard;
