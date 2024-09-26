'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon, UserIcon, ShieldCheckIcon, CalendarIcon, LinkIcon } from '@heroicons/react/24/outline';

interface DeploymentRecord {
  id: string;
  names: string[];
  attributes: {
    key: string;
    value: {
      string?: string;
    };
  }[];
}

const InfoLink: React.FC<{ label: string; href: string }> = ({ label, href }) => (
  <div className="flex items-center">
    <LinkIcon className="h-5 w-5 text-gray-500 mr-2" />
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline transition duration-300 ease-in-out"
    >
      {label}
    </a>
  </div>
);

const AppDeploymentPage: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [appInfo, setAppInfo] = useState({
    name: '',
    version: '',
    authority: '',
    created: '',
    expires: '',
    owner: '',
    repository: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const searchParams = useSearchParams();
  const appId = params.appID as string;

  useEffect(() => {
    const name = searchParams.get('name') || 'Unnamed App';
    const version = searchParams.get('version') || 'Unknown';
    const authority = searchParams.get('authority') || 'Unknown';
    const created = searchParams.get('created') || 'Invalid Date';
    const expires = searchParams.get('expires') || 'Invalid Date';
    const owner = searchParams.get('owner') || '';
    const repository = searchParams.get('repository') || 'Unknown';

    setAppInfo({
      name,
      version,
      authority,
      created: new Date(created).toLocaleString(),
      expires: new Date(expires).toLocaleString(),
      owner,
      repository,
    });

    const fetchDeployments = async () => {
      try {
        const response = await fetch(process.env.LACONIC_API_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName: "GetApplicationDeploymentRecords",
            variables: { appId },
            query: `
              query GetApplicationDeploymentRecords($appId: String!) {
                appDeploymentRecords: queryRecords(
                  attributes: [{key: "type", value: {string: "ApplicationDeploymentRecord"}}, {key: "application", value: {string: $appId}}]
                ) {
                  id
                  names
                  attributes {
                    key
                    value {
                      ...ValueParts
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
              }
              
              fragment ValueParts on Value {
                ... on BooleanValue {
                  bool: value
                  __typename
                }
                ... on IntValue {
                  int: value
                  __typename
                }
                ... on FloatValue {
                  float: value
                  __typename
                }
                ... on StringValue {
                  string: value
                  __typename
                }
                ... on BytesValue {
                  bytes: value
                  __typename
                }
                ... on LinkValue {
                  link: value
                  __typename
                }
                __typename
              }
            `
          }),
        });
        const data = await response.json();
        if (data.errors) {
          console.error('GraphQL Errors:', data.errors);
          throw new Error('Failed to fetch deployment records');
        }
        setDeployments(data.data.appDeploymentRecords);
      } catch (error) {
        console.error('Error fetching deployments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeployments();
  }, [searchParams, appId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => window.history.back()}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition duration-300 ease-in-out"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to App List
      </button>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{appInfo.name}</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Application Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={<ClockIcon className="h-5 w-5" />} label="Version" value={appInfo.version} />
          <InfoItem icon={<ShieldCheckIcon className="h-5 w-5" />} label="Authority" value={appInfo.authority} />
          <InfoItem icon={<CalendarIcon className="h-5 w-5" />} label="Created" value={appInfo.created} />
          <InfoItem icon={<CalendarIcon className="h-5 w-5" />} label="Expires" value={appInfo.expires} />
          <InfoItem icon={<UserIcon className="h-5 w-5" />} label="Owner" value={appInfo.owner} />
          <div className="md:col-span-2"></div>
          {appInfo.repository ? (
          <InfoLink label={appInfo.repository} href={appInfo.repository} />
          ) : (
            <InfoItem icon={<LinkIcon className="h-5 w-5" />} label="Repository" value="Unknown" />
          )}
</div>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Deployment Records</h2>
        {deployments.length > 0 ? (
          deployments.map((deployment) => (
            <div key={deployment.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-600">{deployment.names[0]}</h3>
              <UrlList deployment={deployment} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No Deployments Found</p>
        )}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center">
    <div className="text-gray-500 mr-2">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const UrlList: React.FC<{ deployment: DeploymentRecord }> = ({ deployment }) => {
  const [urlStatuses, setUrlStatuses] = useState<Record<string, 'checking' | 'available' | 'unavailable'>>({});

  useEffect(() => {
    const checkUrls = async () => {
      const urlAttribute = deployment.attributes.find(attr => attr.key === 'url');
      if (urlAttribute && urlAttribute.value.string) {
        const urls = urlAttribute.value.string.split(',');
        const initialStatuses: Record<string, "checking" | "available" | "unavailable"> = 
          Object.fromEntries(urls.map(url => [url, 'checking' as const]));
        setUrlStatuses(initialStatuses);

        for (const url of urls) {
          try {
            const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            setUrlStatuses(prev => ({
              ...prev,
              [url]: data.isAvailable ? 'available' : 'unavailable'
            }));
          } catch {
            setUrlStatuses(prev => ({
              ...prev,
              [url]: 'unavailable'
            }));
          }
        }
      }
    };

    checkUrls();
  }, [deployment]);

  const urlAttribute = deployment.attributes.find(attr => attr.key === 'url');
  if (!urlAttribute || !urlAttribute.value.string) {
    return <p className="text-gray-500 italic">No URLs available</p>;
  }

  const urls = urlAttribute.value.string.split(',');

  return (
    <ul className="space-y-2">
      {urls.map((url, index) => (
        <li key={index} className="flex items-center">
          {urlStatuses[url] === 'checking' ? (
            <span className="w-4 h-4 mr-2">
              <svg className="animate-spin h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          ) : (
            <span className={`w-4 h-4 rounded-full mr-2 ${
              urlStatuses[url] === 'available' ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition duration-300 ease-in-out">
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default AppDeploymentPage;