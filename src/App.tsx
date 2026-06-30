import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Statistics } from './pages/Statistics';
import { QC } from './pages/QC';
import { Terminal } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [apiUrl, setApiUrl] = useState('');
  const [loadingApi, setLoadingApi] = useState(true);
  const [qcEnabled, setQcEnabled] = useState(false);

  useEffect(() => {
    const fetchApiInfo = async () => {
      try {
        const response = await fetch('/api/info');
        const data = await response.json();
        if (data.success && data.apiUrl) {
          setApiUrl(data.apiUrl);
        } else {
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          const port = window.location.port || (protocol === 'https:' ? '443' : '80');
          setApiUrl(`${protocol}//${hostname}:${port}/api`);
        }
        if (data.qcModule) {
          setQcEnabled(data.qcModule.enabled);
        }
      } catch {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port || (protocol === 'https:' ? '443' : '80');
        setApiUrl(`${protocol}//${hostname}:${port}/api`);
      } finally {
        setLoadingApi(false);
      }
    };
    fetchApiInfo();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'statistics':
        return <Statistics />;
      case 'qc':
        return qcEnabled ? <QC /> : <Home />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} qcEnabled={qcEnabled} />
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <Terminal className="w-5 h-5 text-cyan-600" />
            <div>
              <p className="text-sm text-slate-500">API 地址</p>
              <p className="text-sm font-mono text-slate-700">
                {loadingApi ? '加载中...' : apiUrl}
              </p>
            </div>
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}
