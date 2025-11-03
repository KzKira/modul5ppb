import { useState } from 'react';
import { BASE_URL } from '../../config/api';

export default function ApiEndpointButton({ className = '' }) {
  const [open, setOpen] = useState(false);

  const exampleEndpoint = `${BASE_URL || window.location.origin}/api/v1/recipes?category=makanan&difficulty=sulit&sort_by=created_at&order=desc`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exampleEndpoint);
      // eslint-disable-next-line no-alert
      alert('Endpoint disalin ke clipboard');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Gagal menyalin endpoint');
    }
  };

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm"
      >
        Tampilkan contoh endpoint
      </button>

      {open && (
        <div className="mt-3 p-3 bg-slate-50 border rounded-md text-sm">
          <div className="mb-2 text-xs text-slate-500">Contoh GET resep (category=makanan, difficulty=sulit, sort latest):</div>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">{exampleEndpoint}</pre>
          <div className="mt-2 flex gap-2">
            <button onClick={handleCopy} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Salin</button>
            <a href={exampleEndpoint} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white border rounded-md text-sm">Buka di tab baru</a>
          </div>
        </div>
      )}
    </div>
  );
}
