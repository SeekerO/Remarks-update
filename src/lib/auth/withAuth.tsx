// withAuth.tsx
"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import { navItems, type NavItem, type PageId } from "@/lib/types/adminTypes";
import { Loader2, ShieldOff } from "lucide-react";

function getAccessibleHrefs(allowedPages: PageId[] | null): string[] {
  const hrefs: string[] = [];
  const extract = (items: NavItem[]) => {
    items.forEach((item) => {
      if (allowedPages === null) {
        if (item.href) hrefs.push(item.href);
      } else if (
        item.pagePermissionId &&
        allowedPages.includes(item.pagePermissionId as PageId)
      ) {
        if (item.href) hrefs.push(item.href);
      }
      if (item.sublinks?.length) extract(item.sublinks);
    });
  };
  extract(navItems);
  return hrefs;
}

const BlockedCard = ({
  icon,
  iconStyle,
  title,
  description,
}: {
  icon: ReactNode;
  iconStyle: React.CSSProperties;
  title: string;
  description: string;
}) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSwitchAccount = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-[20px] w-[340px] mx-4 text-center"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
          style={iconStyle}
        >
          {icon}
        </div>

        <div className="flex flex-col gap-1.5">
          <p
            className="text-[15px] font-medium tracking-tight"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {title}
          </p>
          <p
            className="text-[12.5px] leading-relaxed max-w-[240px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {description}
          </p>
        </div>

        <button
          onClick={handleSwitchAccount}
          className="text-[11px] mt-1 text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Sign in with a different account
        </button>
      </div>
    </div>
  );
};

const AuthGuard = ({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode;
  redirectTo?: string;
}) => {
  const [checked, setChecked] = useState(false);
  const [granted, setGranted] = useState(false);
  const [denialReason, setDenialReason] = useState<"not_permitted" | null>(null);

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!["/login", "/not-found", "/"].includes(pathname)) {
        router.replace(redirectTo);
      } else {
        setGranted(true);
        setChecked(true);
      }
      return;
    }

    // Only block if explicitly set to false
    if (user.isPermitted === false) {
      setDenialReason("not_permitted");
      setGranted(false);
      setChecked(true);
      return;
    }

    // Check page-level access
    const allowedPages = user.isAdmin
      ? null
      : ((user.allowedPages as PageId[]) ?? null);

    // If allowedPages is null or undefined, grant full access (default behavior)
    if (allowedPages !== null) {
      const accessibleHrefs = getAccessibleHrefs(allowedPages);
      if (
        pathname !== "/login" &&
        !accessibleHrefs.some(
          (href) => pathname === href || pathname.startsWith(href + "/"),
        )
      ) {
        if (!["/dashboard", "/", "/not-found"].includes(pathname)) {
          router.replace("/not-found");
          return;
        }
      }
    }

    setGranted(true);
    setChecked(true);
    setDenialReason(null);
  }, [user, isLoading, pathname, router, redirectTo]);

  if (isLoading || !checked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--nexus-sidebar-bg)]">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!granted && user && denialReason === "not_permitted") {
    return (
      <BlockedCard
        iconStyle={{
          background: "rgba(99,91,210,0.14)",
          border: "0.5px solid rgba(99,91,210,0.3)",
        }}
        icon={<ShieldOff className="w-[18px] h-[18px] text-indigo-300" />}
        title="Access Revoked"
        description="Your account access has been disabled by an administrator. Please contact them for assistance."
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;