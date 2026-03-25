import { UserProfile } from "@/lib/types/adminTypes"

export default function UserAvatar({ user, isOnline }: { user: UserProfile; isOnline: boolean }) {
    const initials = user.displayName
        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";
    return (
        <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center
        text-xs font-semibold text-white
        bg-gradient-to-br from-indigo-500 to-violet-600">
                {user.photoURL
                    ? <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    : initials}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
        border-white dark:border-[#0d0d1a] transition-colors
        ${isOnline ? "bg-emerald-400" : "bg-red-700"}`} />
        </div>
    );
}