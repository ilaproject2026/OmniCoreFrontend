import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, CheckCheck, AlertCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/useClickOutside';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      default:
        return <Clock className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-40 overflow-hidden flex flex-col text-slate-200">
          {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-[#0b0f17]/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No notifications to display.
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 text-xs transition-colors hover:bg-slate-800/60 cursor-pointer',
                      !n.isRead && 'bg-blue-950/20'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{getSeverityIcon(n.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                    </div>
                    {!n.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-2.5 bg-[#0b0f17]/50 text-center">
              <Link
                to="/app/notifications"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                View full Notification Center
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
      )}
    </div>
  );
};
