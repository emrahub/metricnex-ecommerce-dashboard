import React, { useState } from 'react';
import {
  UserIcon,
  BellIcon,
  CircleStackIcon,
  KeyIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'data-sources', name: 'Data Sources', icon: CircleStackIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'scheduling', name: 'Scheduling', icon: ClockIcon },
  ];

  const TabContent: React.FC = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'data-sources':
        return <DataSourceSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'scheduling':
        return <SchedulingSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your dashboard preferences and integrations
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <TabContent />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    organization: 'Acme Corporation',
    role: 'Administrator',
    timezone: 'America/New_York'
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Update your personal information and preferences
        </p>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Organization</label>
          <input
            type="text"
            value={formData.organization}
            onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailReports: true,
    reportComplete: true,
    reportFailed: true,
    weeklyDigest: true,
    systemUpdates: false,
    securityAlerts: true
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure how and when you receive notifications
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Email Report Delivery</h4>
            <p className="text-sm text-gray-600">Receive reports via email when generated</p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, emailReports: !prev.emailReports }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.emailReports ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.emailReports ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Report Completion</h4>
            <p className="text-sm text-gray-600">Get notified when reports finish generating</p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, reportComplete: !prev.reportComplete }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.reportComplete ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.reportComplete ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Report Failures</h4>
            <p className="text-sm text-gray-600">Alert me when report generation fails</p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, reportFailed: !prev.reportFailed }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.reportFailed ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.reportFailed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Weekly Digest</h4>
            <p className="text-sm text-gray-600">Summary of activity and reports each week</p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.weeklyDigest ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
            <p className="text-sm text-gray-600">Important security-related notifications</p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, securityAlerts: !prev.securityAlerts }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications.securityAlerts ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.securityAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

const DataSourceSettings: React.FC = () => {
  const dataSources = [
    { id: 1, name: 'Shopify Store', type: 'shopify', status: 'connected', lastSync: '2 hours ago' },
    { id: 2, name: 'Google Analytics', type: 'google_analytics', status: 'connected', lastSync: '1 hour ago' },
    { id: 3, name: 'Facebook Ads', type: 'facebook_ads', status: 'disconnected', lastSync: 'Never' },
    { id: 4, name: 'MySQL Database', type: 'database', status: 'connected', lastSync: '30 minutes ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Sources</h3>
          <p className="mt-1 text-sm text-gray-600">
            Manage connections to your data sources
          </p>
        </div>
        <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700">
          Add Data Source
        </button>
      </div>

      <div className="space-y-4">
        {dataSources.map((source) => (
          <div key={source.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${source.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{source.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{source.type.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-900 capitalize">{source.status}</p>
                <p className="text-sm text-gray-600">Last sync: {source.lastSync}</p>
              </div>
              <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SecuritySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account security and access
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700">
              Update Password
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
              Enable
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">API Access</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">API Key</p>
                <p className="text-sm text-gray-600 font-mono">sk_live_••••••••••••••••••••••••••••</p>
              </div>
              <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SchedulingSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Report Scheduling</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure automatic report generation
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Scheduled Reports</h4>
            <p className="text-sm text-blue-700 mt-1">
              Set up automatic report generation on a recurring schedule. Reports will be generated and delivered according to your preferences.
            </p>
          </div>
        </div>
      </div>

      <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
        <ClockIcon className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm font-medium">No scheduled reports yet</p>
        <p className="text-sm">Click to create your first scheduled report</p>
      </button>
    </div>
  );
};

export default Settings;