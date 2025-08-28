import React, { useEffect, useState } from 'react';
import {
  UserIcon,
  BellIcon,
  CircleStackIcon,
  KeyIcon,
  ClockIcon,
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

// Data Sources moved to modular feature components
import DataSourceSettings from '../features/data-sources/DataSourceSettings';

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
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Data Quality Overview</h4>
        <QualityPanel />
      </div>
    </div>
  );
};

const SchedulingSettings: React.FC = () => {
  const { schedulingService } = require('../services/scheduling');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', cron: '0 8 * * *', isActive: true, taskType: 'ga_weekly_sessions', slackWebhookUrl: '' });
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await schedulingService.list();
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schedulingService.create({
        name: form.name || 'Scheduled Report',
        cron: form.cron,
        isActive: form.isActive,
        task: { type: form.taskType, config: {} },
        notify: form.slackWebhookUrl ? { slackWebhookUrl: form.slackWebhookUrl } : undefined,
      });
      setOpen(false);
      setForm({ name: '', cron: '0 8 * * *', isActive: true, taskType: 'ga_weekly_sessions', slackWebhookUrl: '' });
      await refresh();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Report Scheduling</h3>
          <p className="mt-1 text-sm text-gray-600">Configure automatic report generation</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">Add Schedule</button>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-gray-600">Loading schedules…</div>
      ) : items.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-600">
          <ClockIcon className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm font-medium">No scheduled reports yet</p>
          <p className="text-sm">Click “Add Schedule” to create your first scheduled report</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{it.name}</p>
                <p className="text-sm text-gray-600">cron: <span className="font-mono">{it.cron}</span> • task: {it.task?.type} • {it.isActive ? 'active' : 'paused'}</p>
                {it.lastRunAt && <p className="text-xs text-gray-500">Last run: {new Date(it.lastRunAt).toLocaleString()}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await schedulingService.testRun(it.id); }} className="px-3 py-1 rounded-lg border border-gray-300 text-sm">Test run</button>
                <button onClick={async () => { if (confirm('Delete schedule?')) { await schedulingService.remove(it.id); await refresh(); } }} className="px-3 py-1 rounded-lg border border-red-300 text-sm text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form onSubmit={createSchedule} className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Add Schedule</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300" placeholder="Weekly GA sessions" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cron</label>
              <input value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 font-mono" placeholder="0 8 * * *" />
              <p className="text-xs text-gray-500 mt-1">Use cron format. Example: 0 8 * * * (every day at 08:00)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Task</label>
              <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300">
                <option value="ga_weekly_sessions">GA: Weekly Sessions Report</option>
                <option value="custom">Custom (placeholder)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slack Webhook (optional)</label>
              <input value={form.slackWebhookUrl} onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300" placeholder="https://hooks.slack.com/services/..." />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Quality overview panel
const QualityPanel: React.FC = () => {
  const { qualityService } = require('../services/quality');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const data = await qualityService.overview(); setItems(data); } finally { setLoading(false); } })(); }, []);
  if (loading) return <div className="p-4 text-sm text-gray-600">Loading quality overview…</div>;
  if (!items.length) return <div className="p-4 text-sm text-gray-600">No data sources yet</div>;
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const color = it.status === 'ok' ? 'text-green-700' : it.status === 'warn' ? 'text-yellow-700' : 'text-red-700';
        return (
          <div key={it.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{it.name} <span className="text-gray-500">• {it.type.replace(/_/g, ' ')}</span></p>
              <span className={`text-sm font-medium ${color}`}>{it.status.toUpperCase()}</span>
            </div>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {it.checks.map((c: any, idx: number) => (
                <li key={idx} className={`text-sm ${c.ok ? 'text-green-700' : 'text-red-700'}`}>• {c.name}{!c.ok && c.message ? ` — ${c.message}` : ''}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default Settings;
