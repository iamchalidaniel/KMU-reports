"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, AlertTriangle, Settings } from 'lucide-react';

const navItems = [
  { href: '/electrician-dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/electrician-dashboard/tasks', label: 'Tasks', icon: Wrench },
  { href: '/electrician-dashboard/incidents', label: 'Incidents', icon: AlertTriangle, primary: true },
  { href: '/electrician-dashboard/settings', label: 'Settings', icon: Settings },
];

export default function ElectricianBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/electrician-dashboard'
              ? pathname === '/electrician-dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 min-w-0 py-2 transition-colors ${
                item.primary
                  ? 'text-kmuGreen'
                  : isActive
                    ? 'text-kmuGreen font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {item.primary ? (
                <div className="w-12 h-12 rounded-full bg-kmuGreen flex items-center justify-center text-white shadow-lg -mt-6">
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-kmuGreen' : ''}`} />
              )}
              <span className="text-[10px] font-medium truncate max-w-full px-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
