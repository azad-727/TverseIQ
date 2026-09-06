import { useState } from 'react';
import { reportApi } from '../services/api';
import { useToast } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ui/FileUpload';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Upload as UploadIcon, History, RotateCcw } from 'lucide-react';
import './UploadPage.css';

const PLATFORMS = [
  { value: 'AMAZON', label: 'Amazon Ads' },
  { value: 'FLIPKART', label: 'Flipkart Ads' },
  { value: 'MYNTRA', label: 'Myntra' }
];

export function UploadPage() {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [platform, setPlatform] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [hasAsin, setHasAsin] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await reportApi.getHistory();
      setHistory(data);
    } catch (e) {
      console.error('Could not fetch upload history', e);
      setHistory([]);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const canUpload = file && platform && periodStart && periodEnd;

  const handleUpload = async () => {
    if (!canUpload) return;
    setUploading(true);
    try {
      const result = await reportApi.upload(file, platform, periodStart, periodEnd, hasAsin);
      toast.success(result.message || 'Report uploaded successfully');
      setFile(null);
      setPlatform('');
      setPeriodStart('');
      setPeriodEnd('');
      setHasAsin(false);
      fetchHistory(); // Refresh history
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleUndo = async (uploadId) => {
    try {
      await reportApi.undoUpload(uploadId);
      toast.success('Upload undone successfully');
      fetchHistory();
    } catch (e) {
      toast.error(e.message || 'Undo failed');
    }
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold", color: "var(--grey-900)" }}>Upload Reports <span className="title-dot" style={{ display: "inline-block", width: "8px", height: "8px", background: "#f97316", borderRadius: "50%", marginLeft: "4px" }}></span></h1>
          <p className="page-subtitle">Upload search term reports to analyze keyword performance</p>
        </div>
      </div>

      <Card padding="lg" style={{ marginBottom: '24px' }}>
        <div className="upload-layout">
          <div className="upload-dropzone">
            <FileUpload onFileSelect={setFile} disabled={uploading} />
          </div>
          <div className="upload-config">
            <Select label="Platform" value={platform} onChange={setPlatform} options={PLATFORMS} placeholder="Select platform..." />
            <Input label="Period Start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            <Input label="Period End" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            <Toggle label="Report has ASIN/SKU column" checked={hasAsin} onChange={setHasAsin} />
            <Button variant="primary" icon={UploadIcon} fullWidth loading={uploading} disabled={!canUpload} onClick={handleUpload}>
              Upload Report
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--grey-200)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} />
            Upload History
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--grey-500)', margin: '4px 0 0 0' }}>
            Track your past report uploads and undo them if necessary. Note: Undo requires backend support.
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Date Uploaded</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Platform</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Period</th>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <History size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>No reports have been uploaded yet.</p>
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px' }}>{new Date(h.uploadedAt).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{h.platform}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {h.periodStart} to {h.periodEnd}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: h.status === 'COMPLETED' ? '#dcfce7' : h.status === 'UNDONE' ? '#f1f5f9' : '#fef3c7',
                        color: h.status === 'COMPLETED' ? '#166534' : h.status === 'UNDONE' ? '#64748b' : '#b45309'
                      }}>
                        {h.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {h.status === 'COMPLETED' && (
                        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => handleUndo(h.id)} style={{ color: '#ef4444' }}>
                          Undo
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
