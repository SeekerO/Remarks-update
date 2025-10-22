// components/Wrapper.tsx
"use client"
import PopupChat from "@/app/Chat/PopupChat";
import { useAuth } from "@/app/Chat/AuthContext";
import Sidebar from "../sidebar";
interface ChatWrapper {
    children: React.ReactNode;
}

const ChatWrapper: React.FC<ChatWrapper> = ({ children }) => {
    const { user } = useAuth();
    return (
        <>
            {children}
            <>
                {user && user.canChat !== false &&
                    <>
                        <div className='absolute bottom-5 right-5 z-50'>
                            <PopupChat />
                        </div>
                    </>
                }
            </>
        </>
    );
};

export default ChatWrapper;
