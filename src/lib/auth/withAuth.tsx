'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { navItems, type NavItem, type PageId } from '@/lib/types/adminTypes';
import { Loader2, ShieldOff, Clock } from 'lucide-react';
import RequestAccessModal from '@/app/login/requestLoginModal';

/* ── Helpers ── */

function checkSubscription(user: any): { isExpired: boolean } {
    // Admin or Infinite users never expire
    if (!user || user.isAdmin || user.subscriptionInfinite) return { isExpired: false };
    
    // If no data exists, assume no access
    if (!user.subscriptionStartDate || user.subscriptionDays === undefined) return { isExpired: true };

    const start = new Date(user.subscriptionStartDate);
    const now = new Date();
    
    // Add the allowed days to the start date
    const expiryDate = new Date(start);
    expiryDate.setDate(start.getDate() + user.subscriptionDays);

    return { isExpired: now.getTime() > expiryDate.getTime() };
}

function getAccessibleHrefs(allowedPages: PageId[] | null): string[] { 
    const hrefs: string[] = [];
    const extract = (items: NavItem[]) => {
        items.forEach((item) => {
            if (allowedPages === null) {
                if (item.href) hrefs.push(item.href);
            } else if (item.pagePermissionId && allowedPages.includes(item.pagePermissionId as PageId)) {
                if (item.href) hrefs.push(item.href);
            }
            if (item.sublinks?.length) extract(item.sublinks);
        });
    };
    extract(navItems);
    return hrefs;
}

/* ── UI Components ── */

const NoRoleAssigned = ({ isExpired, onOpenRequest }: { isExpired: boolean, onOpenRequest: () => void }) => (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl max-w-sm w-full mx-4 text-center bg-white/5 border border-white/10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-violet-500/10 border-violet-500/20'}`}>
                {isExpired ? <Clock className="w-5 h-5 text-red-400" /> : <ShieldOff className="w-5 h-5 text-violet-400" />}
            </div>
            <div>
                <p className="text-sm font-medium text-white/70">{isExpired ? "Subscription Expired" : "Access Restricted"}</p>
                <p className="text-xs text-white/30 mt-1.5 leading-relaxed">
                    {isExpired 
                        ? "Your subscription period has ended. Please request a renewal to continue." 
                        : "Your account is approved but no roles have been assigned yet."}
                </p>
            </div>
            <button 
                onClick={onOpenRequest}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
            >
                {isExpired ? "Request Renewal" : "Request Access"}
            </button>
            <a href="/login" className="text-[10px] text-white/20 mt-2">Sign in with a different account</a>
        </div>
    </div>
);

/* ── Main Guard ── */

const AuthGuard = ({ children, redirectTo = '/login' }: { children: ReactNode; redirectTo?: string }) => {
    const [checked, setChecked] = useState(false);
    const [granted, setGranted] = useState(false);
    const [denialReason, setDenialReason] = useState<'not_permitted' | 'no_role' | 'expired' | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            if (!['/login', '/not-found'].includes(pathname)) {
                router.replace(redirectTo);
            } else {
                setGranted(true);
                setChecked(true);
            }
            return;
        }

        // 1. Permitted Check
        if (!user.isPermitted) {
            setDenialReason('not_permitted');
            setGranted(false);
            setChecked(true);
            return;
        }

        // 2. Expiry Check
        const { isExpired } = checkSubscription(user);
        if (isExpired) {
            setDenialReason('expired');
            setGranted(false);
            setChecked(true);
            return;
        }

        // 3. Role Check
        const hasRole = user.isAdmin || (user.roles && user.roles.length > 0);
        if (!hasRole) {
            setDenialReason('no_role');
            setGranted(false);
            setChecked(true);
            return;
        }

        // 4. Page Access Check
        const allowedPages = user.isAdmin ? null : (user.allowedPages as PageId[] ?? []);
        const accessibleHrefs = getAccessibleHrefs(allowedPages);

        if (pathname !== '/login' && !accessibleHrefs.some(href => pathname === href || pathname.startsWith(href + '/'))) {
            if (!['/dashboard', '/', '/not-found'].includes(pathname)) {
                router.replace('/not-found');
                return;
            }
        }

        setGranted(true);
        setChecked(true);
    }, [user, isLoading, pathname, router, redirectTo]);

    if (isLoading || !checked) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
        );
    }

    // Handle block screens with Request Modal integration
    if (!granted && user) {
        if (denialReason === 'not_permitted') {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
                    <p className="text-white/50 text-sm">Waiting for account approval...</p>
                </div>
            );
        }

        if (denialReason === 'expired' || denialReason === 'no_role') {
            return (
                <>
                    <NoRoleAssigned 
                        isExpired={denialReason === 'expired'} 
                        onOpenRequest={() => setShowModal(true)} 
                    />
                    {showModal && (
                        <RequestAccessModal 
                            user={{ displayName: user.displayName!, email: user.email!, uid: user.uid }} 
                            onClose={() => setShowModal(false)} 
                        />
                    )}
                </>
            );
        }
    }

    return <>{children}</>;
};

export default AuthGuard;