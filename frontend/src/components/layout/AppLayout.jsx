import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BetaBanner from './BetaBanner';

export default function AppLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar - fixed width */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <BetaBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
