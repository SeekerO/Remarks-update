// components/Wrapper.tsx
"use client"
import PopupChat from '../../Chat/PopupChat';

interface ChatWrapper {
    children: React.ReactNode;
}

const ChatWrapper: React.FC<ChatWrapper> = ({ children }) => {

    return (
        <>
            {children}
            <div className='absolute bottom-5 right-5 z-50'>
                <PopupChat />
            </div>
        </>
    );
};

export default ChatWrapper;
