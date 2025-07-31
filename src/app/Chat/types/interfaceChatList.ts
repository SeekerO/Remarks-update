export interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
  canChat: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  profilePic: string | null;
  email: string;
  canChat: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface ChatWithUnread {
  id: string;
  name: string | null;
  participants: Record<string, boolean>;
  type?: "one-to-one" | "group";
  unreadCount?: number;
  lastMessageTimestamp?: number;
  createdAt: number;
  isGroupChat?: boolean;
  lastMessageSenderName?: string;
  lastMessageContent?: string;
}

export interface CreateGroupChatProps {
  setCreateGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
  newChatName: string;
  setNewChatName: React.Dispatch<React.SetStateAction<string>>;
  allUsers: UserProfile[];
  onlineUsers: Record<string, boolean>;
  selectedUsers: string[];
  handleUserSelect: (uid: string) => void;
  handleCreateChat: () => void;
}

export interface YourChatsListProps {
  setCreateGroupChat: React.Dispatch<React.SetStateAction<boolean>>;
  allUsers: UserProfile[];
  handleOneToOneChat: (targetUserId: string) => void;
  chatsWithUnread: ChatWithUnread[];
  onSelectChat: (chatId: string) => void;
  getChatDisplayName: (chat: ChatWithUnread) => string;
  currentUserId: string;
  getChatProfilePic: (
    chat: ChatWithUnread
  ) => string | string[] | null | undefined;
}
