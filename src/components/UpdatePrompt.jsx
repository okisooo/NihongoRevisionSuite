import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { setupPwa } from '../pwa';

export default function UpdatePrompt() {
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    setupPwa((applyUpdate) => setUpdate(() => applyUpdate));
  }, []);

  if (!update) return null;

  return (
    <div className="update-toast" role="status">
      <span>A new version is available ✨</span>
      <button onClick={update}>
        <RefreshCw size={16} /> Refresh
      </button>
      <button className="update-toast-dismiss" onClick={() => setUpdate(null)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
