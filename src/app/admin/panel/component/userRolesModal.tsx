"use client";

import { useState } from "react";
import {
  X,
  Shield,
  Calendar,
  Infinity,
  Crown,
  Pencil,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  ImageIcon,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { UserProfile } from "@/lib/types/adminTypes";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "editor" | "user" | "comelec";

export interface UserSubscription {
  roles: UserRole[];
  subscriptionDays: number | null; 
  subscriptionInfinite: boolean;
  subscriptionStartDate: string | null;
  allowedPresets: string[];
}

export const WATERMARK_PRESETS = [
  { id: "white-eid", name: "White EID Logo", type: "logo" as const },
  { id: "black-eid", name: "Black EID Logo", type: "logo" as const },
  { id: "white-eid-com", name: "White EID & COMELEC", type: "logo" as const },
  { id: "black-eid-com", name: "Black EID & COMELEC", type: "logo" as const },
  { id: "comelec", name: "COMELEC Logo", type: "logo" as const },
  { id: "kkk", name: "KKK Logo", type: "logo" as const },
  { id: "black-shadow", name: "Black Shadow Footer", type: "footer" as const },
  { id: "white-shadow", name: "White Shadow Footer", type: "footer" as const },
] as const;

const ROLE_CONFIG: Record<UserRole, { label: string; icon: any; color: string }> = {
  editor:  { label: "Editor",  icon: Pencil,    color: "indigo" },
  user:    { label: "User",    icon: Users,     color: "emerald" },
  comelec: { label: "COMELEC", icon: Building2, color: "violet" },
};

interface UserRolesModalProps {
  user: UserProfile & { subscription?: UserSubscription };
  onClose: () => void;
  onSave: (uid: string, sub: UserSubscription) => Promise<void>;
}

export default function UserRolesModal({ user, onClose, onSave }: UserRolesModalProps) {
  const sub = user.subscription;
  const isAdmin = user.isAdmin === true;

  // ── State ──────────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<UserRole[]>(Array.isArray(sub?.roles) ? sub.roles : []);
  const [subscriptionInfinite, setSubscriptionInfinite] = useState<boolean>(
    isAdmin ? true : (sub?.subscriptionInfinite ?? false)
  );
  const [subscriptionDays, setSubscriptionDays] = useState<number>(sub?.subscriptionDays ?? 30);
  const [startDate, setStartDate] = useState<string>(
    sub?.subscriptionStartDate || new Date().toISOString().split("T")[0]
  );
  const [allowedPresets, setAllowedPresets] = useState<string[]>(
    sub?.allowedPresets || []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleRole = (r: UserRole) => {
    if (isAdmin) return; // Prevent role selection if already admin
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const togglePreset = (id: string) => {
    if (isAdmin) return;
    setAllowedPresets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllPresets = () => {
    if (isAdmin) return;
    setAllowedPresets(WATERMARK_PRESETS.map(p => p.id));
  };

  const selectNonePresets = () => {
    if (isAdmin) return;
    setAllowedPresets([]);
  };

  const expiryDate = (() => {
    if (subscriptionInfinite || isAdmin) return null;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + (subscriptionDays || 0));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

  const validationError = (() => {
    if (isAdmin) return null; // No validation needed for admins
    if (roles.length === 0) return "At least one role must be selected.";
    if (!subscriptionInfinite) {
      if (subscriptionDays < 1) return "Duration must be at least 1 day.";
      if (!startDate) return "Start date is required.";
    }
    return null;
  })();

  const handleSave = async () => {
    if (validationError) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(user.uid, {
        // AUTOMATICALLY REMOVE ROLES IF ADMIN
        roles: isAdmin ? [] : roles, 
        subscriptionDays: isAdmin || subscriptionInfinite ? null : subscriptionDays,
        subscriptionInfinite: isAdmin ? true : subscriptionInfinite,
        subscriptionStartDate: isAdmin || subscriptionInfinite ? null : startDate,
        allowedPresets: isAdmin ? WATERMARK_PRESETS.map(p => p.id) : allowedPresets,
      });
      onClose();
    } catch (err) {
      setSaveError("Failed to update user configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0d0d1a] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-violet-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/85 flex items-center gap-2">
              Roles & Subscription
              {isAdmin && <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase font-bold">Admin</span>}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 truncate">{user.displayName} • {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {isAdmin && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700/80 dark:text-amber-500/60 leading-relaxed">
                User is promoted as <strong>Admin</strong>. Roles will be automatically cleared upon saving to maintain clean access logic.
              </p>
            </div>
          )}

          {/* Roles Grid */}
          <section className={isAdmin ? "opacity-40 pointer-events-none" : ""}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/20 mb-3">
              {isAdmin ? "Roles (Cleared for Admin)" : "User Roles"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ROLE_CONFIG) as [UserRole, any][]).map(([id, cfg]) => {
                const isActive = !isAdmin && roles.includes(id);
                const Icon = cfg.icon;
                return (
                  <button
                    key={id}
                    onClick={() => toggleRole(id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      isActive 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400" 
                        : "bg-transparent border-black/[0.05] dark:border-white/[0.05] text-gray-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Subscription Section */}
          <section className={`rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden`}>
            <div className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Access Duration</span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                subscriptionInfinite || isAdmin ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20" : "bg-transparent border-black/[0.06] dark:border-white/[0.06]"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${subscriptionInfinite || isAdmin ? "bg-sky-500 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400"}`}>
                    <Infinity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${subscriptionInfinite || isAdmin ? "text-sky-700 dark:text-sky-300" : "text-gray-500"}`}>Infinite Access</p>
                    <p className="text-[10px] text-gray-400">Never expires</p>
                  </div>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => setSubscriptionInfinite(!subscriptionInfinite)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${subscriptionInfinite ? "bg-sky-500" : "bg-gray-300 dark:bg-white/10"}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${subscriptionInfinite ? "left-6" : "left-1"}`} />
                  </button>
                )}
              </div>

              {!subscriptionInfinite && !isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-xs outline-none focus:border-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Days</label>
                    <input 
                      type="number" 
                      value={subscriptionDays}
                      onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-xs outline-none focus:border-indigo-500 transition-all" 
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Presets Section */}
          <section className="space-y-2">
            <div 
              className="w-full flex items-center justify-between p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer"
              onClick={() => setPresetsOpen(!presetsOpen)}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Allowed Presets</span>
              </div>
              <div className="flex items-center gap-3">
                {presetsOpen && !isAdmin && (
                    <div className="flex items-center gap-2 border-r border-black/[0.08] dark:border-white/[0.08] pr-3 mr-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={selectAllPresets} className="text-[9px] font-bold uppercase text-indigo-500 hover:text-indigo-600 transition-colors">All</button>
                        <button onClick={selectNonePresets} className="text-[9px] font-bold uppercase text-gray-400 hover:text-gray-500 transition-colors">None</button>
                    </div>
                )}
                {presetsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </div>

            {presetsOpen && (
              <div className="grid grid-cols-1 gap-1.5 p-1">
                {WATERMARK_PRESETS.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => togglePreset(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      (allowedPresets.includes(p.id) || isAdmin) ? "bg-violet-500/5 border-violet-500/20 cursor-default" : "border-transparent hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className={`w-3.5 h-3.5 ${(allowedPresets.includes(p.id) || isAdmin) ? "text-violet-500" : "text-gray-400"}`} />
                      <span className={`text-[11px] font-medium ${(allowedPresets.includes(p.id) || isAdmin) ? "text-gray-800 dark:text-white/80" : "text-gray-400"}`}>{p.name}</span>
                    </div>
                    {(allowedPresets.includes(p.id) || isAdmin) && <CheckCircle2 className="w-3 h-3 text-violet-500" />}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
          {saveError && (
            <div className="mb-4 flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[10px] text-red-600 dark:text-red-400">{saveError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isSaving} className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-gray-500 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-40">Cancel</button>
            <button
              onClick={handleSave}
              disabled={isSaving || !!validationError}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSaving ? "Saving changes..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}