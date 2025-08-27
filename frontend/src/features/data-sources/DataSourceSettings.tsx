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
      const list = await dataSourceService.list();
      setItems(list);
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
    if (payload.id) {
      await dataSourceService.update(payload.id, { name: payload.name, config: payload.config });
    } else {
      await dataSourceService.create({ name: payload.name, type: payload.type, config: payload.config });
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
