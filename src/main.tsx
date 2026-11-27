import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <main className="min-h-screen flex items-center justify-center bg-[#fff8f5] text-[#81756e] text-sm">Loading iLuvKeyks…</main>
  </StrictMode>,
);
const normalizedPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
const isStaffRoute = normalizedPath === '/staff';
const isCashierRoute = normalizedPath === '/pos';

async function mountApplication() {
  if (isCashierRoute) {
    const { CashierPOS } = await import('./components/CashierPOS');
    root.render(
      <StrictMode>
        <CashierPOS />
      </StrictMode>,
    );
    return;
  }

  if (isStaffRoute) {
    const { StaffPortal } = await import('./components/StaffPortal');
    root.render(
      <StrictMode>
        <StaffPortal />
      </StrictMode>,
    );
    return;
  }

  const { default: App } = await import('./App.tsx');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void mountApplication();
