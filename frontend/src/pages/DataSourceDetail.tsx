import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dataSourceService } from '../services/dataSources';
import { DataSource } from '../types/dataSource';

const DataSourceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { status: 'success' | 'failed'; provider: string; checks: { name: string; ok: boolean; message?: string }[] }>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const ds = await dataSourceService.get(id, { includeSecrets: true });
      setItem(ds);
      setLoading(false);
    })();
  }, [id]);

  const runTest = async () => {
    if (!id) return;
    setTesting(true);
    try {
      const r = await dataSourceService.test(id, { live });
      setTestResult(r);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!item) return <div className="p-6">Not found</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-600">{item.type.replace(/_/g, ' ')} • Status: {item.status}</p>
        </div>
        <button onClick={() => navigate('/settings')} className="px-3 py-1 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50">Back to Settings</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(item.config || {}).map(([k, v]) => (
            <div key={k} className="text-sm">
              <div className="text-gray-600">{k}</div>
              <div className="font-mono break-all">{v as string}</div>
            </div>
          ))}
        </div>
        {item.type === 'google_ads' && (
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-medium text-gray-800">For a successful live test, provide:</span> Customer ID, Developer Token, OAuth Client ID, OAuth Client Secret, and OAuth Refresh Token. Login Customer ID is optional.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Connection Test</h3>
            <p className="text-sm text-gray-600">Validates required fields, token format, and optional live API call</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="rounded border-gray-300" checked={live} onChange={(e) => setLive(e.target.checked)} />
              Live test
            </label>
            <button onClick={runTest} disabled={testing} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-50">
            {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
        {testResult && (
          <div className="mt-3">
            <p className={`text-sm font-medium ${testResult.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              Result: {testResult.status.toUpperCase()}
            </p>
            <ul className="mt-2 space-y-1">
              {testResult.checks.map((c, i) => (
                <li key={i} className="text-sm">
                  <span className={c.ok ? 'text-green-700' : 'text-red-700'}>• {c.name}</span>
                  {!c.ok && c.message ? <span className="text-gray-600"> — {c.message}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceDetail;
