import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { setupPwa } from '../pwa';

export default function UpdatePrompt() {
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    return setupPwa((applyUpdate) => setUpdate(() => applyUpdate));
  }, []);

  if (!update) return null;

  return (
    <div className="update-toast" role="status">
      <span>a new version is ready. refresh after your session.</span>
      <button className="secondary-button" onClick={update}>
        <RefreshCw size={16} /> refresh
      </button>
      <button className="text-button" onClick={() => setUpdate(null)} aria-label="dismiss update">
        ×
      </button>
    </div>
  );
}
