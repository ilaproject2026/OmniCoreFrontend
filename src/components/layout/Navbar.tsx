import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationDropdown } from './NotificationDropdown';
import { RoleSwitcher } from './RoleSwitcher';
import { TenantSwitcher } from './TenantSwitcher';
import { BranchSwitcher } from './BranchSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, Shield, LayoutDashboard, Maximize2, Minimize2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface NavbarProps {
  onToggleSidebar?: () => void;
  isPlatform?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isPlatform = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-[#0f172a]/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {!isPlatform ? (
          <>
            <TenantSwitcher />
            <BranchSwitcher />
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300">
            <Shield className="h-3.5 w-3.5" />
            <span>Platform Super Admin Workspace</span>
          </div>
        )}

        <div className="hidden md:block pl-2">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Workspace Switcher Link */}
        {user?.isPlatformUser && (
          <Link
            to={isPlatform ? '/app/dashboard' : '/platform/dashboard'}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
            {isPlatform ? 'Switch to Tenant Operations' : 'Switch to Super Admin'}
          </Link>
        )}

        {/* Live Role Switcher for dynamic authorization inspection */}
        <RoleSwitcher />

        {/* Top Level Fullscreen Option */}
        <button
          onClick={toggleFullscreen}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
            isFullscreen
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
          }`}
          title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen (F11)'}
          aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden xl:inline text-[11px] font-medium">Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
              <span className="hidden xl:inline text-[11px]">Full Screen</span>
            </>
          )}
        </button>

        {/* Notification bell */}
        <NotificationDropdown />

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
          <div className="flex items-center gap-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-700"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
          </div>

          <button
            onClick={() => logout()}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
