import React from 'react';
import { DataSource } from '../../../types/dataSource';

type Props = {
  items: DataSource[];
  onConfigure: (ds: DataSource) => void;
  onRemove: (ds: DataSource) => void;
  onOpen?: (ds: DataSource) => void;
};

const sr = (text: string) => (
  <span className="sr-only">{text}</span>
);

const DataSourceList: React.FC<Props> = ({ items, onConfigure, onRemove, onOpen }) => {
  return (
    <div className="space-y-4">
      {items.map((source) => {
        const connected = source.status === 'connected';
        return (
          <div key={source.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                  aria-hidden
                />
                {sr(connected ? 'Connected' : 'Disconnected')}
              </div>
              <div>
                <button
                  className="text-left text-sm font-medium text-gray-900 hover:underline"
                  onClick={() => onOpen && onOpen(source)}
                >
                  {source.name}
                </button>
                <p className="text-sm text-gray-600 capitalize">{source.type.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right mr-2">
                <p className="text-sm text-gray-900 capitalize">{source.status}</p>
                <p className="text-sm text-gray-600">Last sync: {source.lastSync || 'Never'}</p>
              </div>
              <button
                onClick={() => onConfigure(source)}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Configure
              </button>
              {onOpen && (
                <button
                  onClick={() => onOpen(source)}
                  className="px-3 py-1 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-lg hover:bg-primary-50"
                >
                  Open
                </button>
              )}
              <button
                onClick={() => onRemove(source)}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DataSourceList;
