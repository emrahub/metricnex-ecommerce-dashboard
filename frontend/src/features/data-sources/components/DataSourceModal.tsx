import React, { useEffect, useMemo, useState } from 'react';
import { PROVIDERS, providerById } from '../providers';
import { DataSource, DataSourceType, ProviderDefinition } from '../../../types/dataSource';

type Props = {
  open: boolean;
  initial?: DataSource | null;
  onClose: () => void;
  onSave: (payload: { id?: string; name: string; type: DataSourceType; config: Record<string, string> }) => void;
};

const DataSourceModal: React.FC<Props> = ({ open, initial, onClose, onSave }) => {
  const isEdit = Boolean(initial);
  const [selectedProvider, setSelectedProvider] = useState<DataSourceType | ''>('');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const provider: ProviderDefinition | undefined = useMemo(() => {
    return selectedProvider ? providerById(selectedProvider) : undefined;
  }, [selectedProvider]);

  useEffect(() => {
    if (open) {
      if (initial) {
        setSelectedProvider(initial.type);
        setName(initial.name);
        setConfig(initial.config || {});
      } else {
        setSelectedProvider('');
        setName('');
        setConfig({});
      }
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!selectedProvider) e.provider = 'Provider is required';
    const def = provider;
    if (def) {
      def.fields.forEach((f) => {
        if (f.required && !String(config[f.key] || '').trim()) {
          e[f.key] = `${f.label} is required`;
        }
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ id: initial?.id, name: name.trim(), type: selectedProvider as DataSourceType, config });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">{isEdit ? 'Configure Data Source' : 'Add Data Source'}</h3>
          <p className="text-sm text-gray-600">Connect by entering IDs and tokens</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select
              disabled={isEdit}
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as DataSourceType)}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Select a provider</option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.provider && <p className="mt-1 text-xs text-red-600">{errors.provider}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Connection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My GA Property / Shopify EU / etc."
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {provider && (
            <div className="space-y-3">
              {provider.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={config[field.key] || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                      value={config[field.key] || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  )}
                  {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
                  {errors[field.key] && <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataSourceModal;
