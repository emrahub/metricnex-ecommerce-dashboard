import React, { useEffect, useState } from 'react';
import DataSourceList from './components/DataSourceList';
import DataSourceModal from './components/DataSourceModal';
import { dataSourceService } from '../../services/dataSources';
import { DataSource, DataSourceType } from '../../types/dataSource';
import { useNavigate } from 'react-router-dom';

const DataSourceSettings: React.FC = () => {
  const [items, setItems] = useState<DataSource[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DataSource | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const list = await dataSourceService.list();
        setItems(list);

        // Background: validate connections live and update statuses
        try {
          for (const ds of list) {
            try {
              const r = await dataSourceService.test(ds.id, { live: true });
              const ok = r.status === 'success' && r.checks.every(c => c.ok);
              const desired = ok ? 'connected' : 'disconnected';
              if (ds.status !== desired) {
                await dataSourceService.setStatus(ds.id, desired);
              }
            } catch {
              // If test call failed, mark disconnected
              try { await dataSourceService.setStatus(ds.id, 'disconnected'); } catch {}
            }
          }
          // Reload list after updates
          const updated = await dataSourceService.list();
          setItems(updated);
        } catch {
          // ignore refresh errors
        }
      } catch (e) {
        console.warn('Backend not reachable for data-sources list.', e);
      }
    })();
  }, []);

  const refresh = async () => {
    const list = await dataSourceService.list();
    setItems(list);
  };

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleConfigure = async (ds: DataSource) => {
    const full = await dataSourceService.get(ds.id, { includeSecrets: true });
    setEditing(full);
    setModalOpen(true);
  };

  const handleRemove = async (ds: DataSource) => {
    // simple confirm for now
    if (confirm(`Remove data source “${ds.name}”?`)) {
      await dataSourceService.remove(ds.id);
      await refresh();
    }
  };

  const handleSave = async (payload: { id?: string; name: string; type: DataSourceType; config: Record<string, string> }) => {
    // Save (create or update)
    let saved: DataSource | null = null;
    if (payload.id) {
      saved = await dataSourceService.update(payload.id, { name: payload.name, config: payload.config });
    } else {
      saved = await dataSourceService.create({ name: payload.name, type: payload.type, config: payload.config });
    }

    // After saving, run a live test and update status accordingly
    try {
      if (saved?.id) {
        const result = await dataSourceService.test(saved.id, { live: true });
        const ok = result.status === 'success' && result.checks.every(c => c.ok);
        await dataSourceService.setStatus(saved.id, ok ? 'connected' : 'disconnected');
      }
    } catch (e) {
      // If test fails, mark disconnected
      if (saved?.id) {
        await dataSourceService.setStatus(saved.id, 'disconnected');
      }
    }

    setModalOpen(false);
    setEditing(null);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Sources</h3>
          <p className="mt-1 text-sm text-gray-600">Manage connections to your data sources</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
        >
          Add Data Source
        </button>
      </div>

      <DataSourceList
        items={items}
        onConfigure={handleConfigure}
        onRemove={handleRemove}
        onOpen={(ds) => navigate(`/settings/data-sources/${ds.id}`)}
      />

      <DataSourceModal
        open={modalOpen}
        initial={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
};

export default DataSourceSettings;
