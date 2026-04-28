// withAuth.tsx
"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import { navItems, type NavItem, type PageId } from "@/lib/types/adminTypes";
import { Loader2, ShieldOff, Clock, Shield } from "lucide-react";
import RequestAccessModal from "@/app/login/requestLoginModal";

function checkSubscription(user: any): { isExpired: boolean } {
  if (!user || user.isAdmin === true || user.subscriptionInfinite === true) {
    return { isExpired: false };
  }
  if (!user.subscriptionStartDate || !user.subscriptionDays) {
    return { isExpired: true };
  }
  const start = new Date(user.subscriptionStartDate);
  const expiryDate = new Date(start);
  expiryDate.setDate(start.getDate() + Number(user.subscriptionDays));
  return { isExpired: Date.now() > expiryDate.getTime() };
}

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

// Replace BlockedCard's "Switch account" anchor with a button:
const BlockedCard = ({
  icon,
  iconStyle,
  title,
  description,
  buttonLabel,
  buttonStyle,
  onAction,
}: {
  icon: ReactNode;
  iconStyle: React.CSSProperties;
  title: string;
  description: string;
  buttonLabel: string;
  buttonStyle?: string;
  onAction: () => void;
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

        <div className="w-full flex flex-col gap-2 mt-1">
          <button
            onClick={onAction}
            className={`w-full py-2.5 rounded-[10px] text-[13px] font-semibold tracking-wide transition-colors ${buttonStyle ?? "bg-indigo-600 hover:bg-indigo-500 text-white"}`}
          >
            {buttonLabel}
          </button>

          {/* ✅ Now properly logs out before switching */}
          <button
            onClick={handleSwitchAccount}
            className="text-[11px] mt-1"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Switch account
          </button>
        </div>
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
  const [denialReason, setDenialReason] = useState<
    "not_permitted" | "no_role" | "expired" | null
  >(null);
  const [showModal, setShowModal] = useState(false);

  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // if (!user) {
    //   if (!["/login", "/not-found"].includes(pathname))
    //     router.replace(redirectTo);
    //   else {
    //     setGranted(true);
    //     setChecked(true);
    //   }
    //   return;
    // }

    // withAuth.tsx — only this block changes
    if (!user) {
      if (!["/login", "/not-found", "/"].includes(pathname)) {
        router.replace(redirectTo);
      } else {
        setGranted(true);
        setChecked(true);
      }
      return;
    }

    if (!user.isPermitted) {
      setDenialReason("not_permitted");
      setGranted(false);
      setChecked(true);
      return;
    }

    const { isExpired } = checkSubscription(user);
    if (isExpired) {
      setDenialReason("expired");
      setGranted(false);
      setChecked(true);
      return;
    }

    const hasRole = user.isAdmin || (user.roles && user.roles.length > 0);
    if (!hasRole) {
      setDenialReason("no_role");
      setGranted(false);
      setChecked(true);
      return;
    }

    const allowedPages = user.isAdmin
      ? null
      : ((user.allowedPages as PageId[]) ?? []);
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

  if (!granted && user) {
    const modalProps = {
      user: {
        displayName: user.displayName!,
        email: user.email!,
        uid: user.uid,
      },
      onClose: () => setShowModal(false),
    };

    if (denialReason === "not_permitted") {
      return (
        <>
          <BlockedCard
            iconStyle={{
              background: "rgba(234,179,8,0.1)",
              border: "0.5px solid rgba(234,179,8,0.25)",
            }}
            icon={<Shield className="w-[18px] h-[18px] text-yellow-400" />}
            title="Awaiting Approval"
            description="Your account is pending administrator review. You can send a request to speed up the process."
            buttonLabel="Request Approval"
            buttonStyle="text-indigo-300 font-semibold hover:bg-indigo-500/10 transition-colors"
            onAction={() => setShowModal(true)}
          />
          {showModal && <RequestAccessModal {...modalProps} />}
        </>
      );
    }

    if (denialReason === "expired") {
      return (
        <>
          <BlockedCard
            iconStyle={{
              background: "rgba(220,60,60,0.12)",
              border: "0.5px solid rgba(220,60,60,0.25)",
            }}
            icon={<Clock className="w-[18px] h-[18px] text-red-400" />}
            title="Subscription Expired"
            description="Your subscription period has ended. Request a renewal to continue accessing the platform."
            buttonLabel="Request Renewal"
            onAction={() => setShowModal(true)}
          />
          {showModal && <RequestAccessModal {...modalProps} />}
        </>
      );
    }

    if (denialReason === "no_role") {
      return (
        <>
          <BlockedCard
            iconStyle={{
              background: "rgba(99,91,210,0.14)",
              border: "0.5px solid rgba(99,91,210,0.3)",
            }}
            icon={<ShieldOff className="w-[18px] h-[18px] text-indigo-300" />}
            title="Access Restricted"
            description="Account approved, but no roles have been assigned yet. Contact your administrator or request access."
            buttonLabel="Request Access"
            onAction={() => setShowModal(true)}
          />
          {showModal && <RequestAccessModal {...modalProps} />}
        </>
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
