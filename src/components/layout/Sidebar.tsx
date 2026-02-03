'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Users,
  TrendingUp,
  Lightbulb,
  Settings,
  LogOut,
  Car,
  Gauge,
  Menu,
  X,
  Home,
  Building2,
  Package,
  CheckCircle,
  FileText,
} from 'lucide-react';

const navigation = [
  { name: 'Customer Portal', href: '/customer-portal', icon: Home },
  { name: 'Back Office', href: '/backoffice', icon: Building2 },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Trade-In', href: '/trade-in', icon: Car },
  { name: 'Test Drive', href: '/test-drive', icon: Gauge },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Approvals', href: '/approvals/discounts', icon: CheckCircle },
  { name: 'Performance', href: '/analytics', icon: TrendingUp },
  { name: 'Coaching', href: '/coaching', icon: Lightbulb },
  { name: 'Summary', href: '/summary', icon: FileText },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] h-14 flex items-center justify-between px-4">
        <span className="text-lg font-bold text-white">AutoLead.ai</span>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-60 bg-gradient-to-b from-[#7c3aed] to-[#5b21b6] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-xl font-bold text-white">AutoLead.ai</span>
            {/* Close button - mobile only */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-white/10 px-3 py-4">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}

            {/* User / Logout */}
            <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white min-h-[44px]">
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
