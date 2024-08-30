'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { bech32 } from 'bech32';
import Link from 'next/link';
import { ChartBarIcon, UsersIcon, ClockIcon, CalendarIcon, MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface ApplicationRecord {
  id: string;
  bondId: string;
  createTime: string;
  expiryTime: string;
  names: string[];
  owners: string[];
  attributes: {
    key: string;
    value: {
      string?: string;
    };
  }[];
}

type SortOption = 'time' | 'name' | 'authority' | 'owner';

const AppList: React.FC = () => {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('time');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(process.env.LACONIC_API_URL!, {
          operationName: "GetApplicationRecords",
          variables: {},
          query: `query GetApplicationRecords {
            appDeploymentRecords: queryRecords(
              attributes: [{key: "type", value: {string: "ApplicationRecord"}}]
            ) {
              id
              bondId
              createTime
              expiryTime
              names
              owners
              attributes {
                key
                value {
                  ... on StringValue {
                    string: value
                  }
                }
              }
            }
          }`
        });
        setApps(response.data.data.appDeploymentRecords);
      } catch (error) {
        console.error('Error: Failed to fetch apps', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const getAuthority = (names: string[]): string => {
    const lrnName = names.find(name => name.startsWith('lrn://'));
    if (lrnName) {
      const parts = lrnName.split('/');
      return parts[2] || 'Unknown';
    }
    return 'Unknown';
  };

  const hexToBech32 = (hexAddress: string): string => {
    try {
      const words = bech32.toWords(Buffer.from(hexAddress, 'hex'));
      return bech32.encode('laconic', words);
    } catch (error) {
      console.error('Error converting hex to bech32:', error);
      return hexAddress; // 如果转换失败,返���原始地址
    }
  };

  const stats = {
    totalApps: apps.length,
    uniqueAuthorities: new Set(apps.map(app => getAuthority(app.names))).size,
    recentlyCreated: apps.filter(app => {
      const creationDate = new Date(app.createTime);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return creationDate > thirtyDaysAgo;
    }).length,
    soonExpiring: apps.filter(app => {
      const expiryDate = new Date(app.expiryTime);
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      return expiryDate < thirtyDaysLater;
    }).length
  };

  const filteredAndSortedApps = apps
    .filter(app => {
      const name = app.attributes.find(attr => attr.key === 'name')?.value.string || '';
      const authority = getAuthority(app.names);
      const owner = hexToBech32(app.owners[0] || '');
      const searchLower = searchTerm.toLowerCase();
      return name.toLowerCase().includes(searchLower) || 
             authority.toLowerCase().includes(searchLower) ||
             owner.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      if (sortOption === 'time') {
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
      } else if (sortOption === 'name') {
        const aName = a.attributes.find(attr => attr.key === 'name')?.value.string || '';
        const bName = b.attributes.find(attr => attr.key === 'name')?.value.string || '';
        return aName.localeCompare(bName);
      } else if (sortOption === 'authority') {
        const aAuthority = getAuthority(a.names);
        const bAuthority = getAuthority(b.names);
        return aAuthority.localeCompare(bAuthority);
      } else if (sortOption === 'owner') {
        const aOwner = hexToBech32(a.owners[0] || '');
        const bOwner = hexToBech32(b.owners[0] || '');
        return aOwner.localeCompare(bOwner);
      }
      return 0;
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">App Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Apps", value: stats.totalApps, icon: <ChartBarIcon className="h-8 w-8" /> },
            { label: "Unique Authorities", value: stats.uniqueAuthorities, icon: <UsersIcon className="h-8 w-8" /> },
            { label: "Created in 30 Days", value: stats.recentlyCreated, icon: <ClockIcon className="h-8 w-8" /> },
            { label: "Expiring in 30 Days", value: stats.soonExpiring, icon: <CalendarIcon className="h-8 w-8" /> }
          ].map((item, index) => (
            <div key={index} className="bg-white bg-opacity-20 rounded-lg p-4 flex items-center">
              <div className="mr-4">{item.icon}</div>
              <div>
                <p className="text-sm font-medium mb-1">{item.label}</p>
                <p className="text-3xl font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex items-center space-x-4">
          <ArrowsUpDownIcon className="h-5 w-5 text-gray-500" />
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="time">Creation Time</option>
            <option value="name">Name</option>
            <option value="authority">Authority</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredAndSortedApps.length} apps (out of {apps.length})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedApps.map((app) => (
          <div key={app.id} className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-xl font-bold mb-3 text-gray-800">{app.attributes.find(attr => attr.key === 'name')?.value.string || 'Unnamed App'}</h2>
            <div className="space-y-2 mb-4">
              <InfoItem icon={<ClockIcon className="h-5 w-5 flex-shrink-0" />} label="Version" value={app.attributes.find(attr => attr.key === 'app_version')?.value.string || 'Unknown'} />
              <InfoItem icon={<UsersIcon className="h-5 w-5 flex-shrink-0" />} label="Authority" value={getAuthority(app.names)} />
              <InfoItem icon={<CalendarIcon className="h-5 w-5 flex-shrink-0" />} label="Created" value={new Date(app.createTime).toLocaleString()} />
              <InfoItem icon={<CalendarIcon className="h-5 w-5 flex-shrink-0" />} label="Expires" value={new Date(app.expiryTime).toLocaleString()} />
              <InfoItem icon={<UsersIcon className="h-5 w-5 flex-shrink-0" />} label="Owner" value={app.owners.map(hexToBech32).join(', ')} />
            </div>
            <Link 
              href={{
                pathname: `/app/${app.id}`,
                query: {
                  name: app.attributes.find(attr => attr.key === 'name')?.value.string || 'Unnamed App',
                  version: app.attributes.find(attr => attr.key === 'app_version')?.value.string || 'Unknown',
                  authority: getAuthority(app.names),
                  created: app.createTime,
                  expires: app.expiryTime,
                  owner: hexToBech32(app.owners[0] || '')
                }
              }}
              className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm font-medium"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="text-gray-500 mr-2 mt-1">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 break-words">{value}</p>
    </div>
  </div>
);

export default AppList;