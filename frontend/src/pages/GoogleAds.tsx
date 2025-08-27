import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { googleAdsService, GoogleAdsCampaign } from '../services/googleAdsService';

const GoogleAds: React.FC = () => {
  const [customerId, setCustomerId] = useState('');

  const mutation = useMutation<GoogleAdsCampaign[], Error, string>({
    mutationFn: (id: string) => googleAdsService.getCampaigns(id),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(customerId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Google Ads</h1>
        <p className="mt-2 text-gray-600">Fetch campaign data from the Google Ads API.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer ID</label>
            <input
              type="text"
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
            >
              {mutation.isPending ? 'Fetching...' : 'Fetch Campaigns'}
            </button>
          </div>
        </form>
      </div>

      {mutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {mutation.error.message}</p>
        </div>
      )}

      {mutation.data && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Campaign Data</h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(mutation.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAds;
