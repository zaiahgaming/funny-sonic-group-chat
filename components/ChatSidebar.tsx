
import React from 'react';
import type { DmChannel, ChatId, CharacterProfile, CharacterHandle } from '../types';
import Avatar from './Avatar';
import GroupChatIcon from './icons/GroupChatIcon';

interface ChatSidebarProps {
    dmChannels: DmChannel[];
    activeChatId: ChatId;
    onSwitchChat: (chatId: ChatId) => void;
    groupChatId: ChatId;
    charactersMap: Map<CharacterHandle, CharacterProfile>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ dmChannels, activeChatId, onSwitchChat, groupChatId, charactersMap }) => {
    return (
        <nav className="w-20 bg-[#202225] p-3 flex flex-col items-center space-y-3">
            <button
                onClick={() => onSwitchChat(groupChatId)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ease-in-out
                    ${activeChatId === groupChatId 
                        ? 'bg-indigo-600 text-white rounded-2xl' 
                        : 'bg-[#36393f] text-gray-400 hover:bg-indigo-600 hover:rounded-2xl hover:text-white'}`
                }
                aria-label="Switch to Team Sonic group chat"
            >
                <GroupChatIcon />
            </button>
            <div className="w-8 border-t border-gray-700"></div>
            {dmChannels.map(dm => {
                const characterProfile = charactersMap.get(dm.partner.name);
                return (
                    <button key={dm.id} onClick={() => onSwitchChat(dm.id)} aria-label={`Switch to DM with ${dm.partner.name}`}>
                         <div className={`relative w-12 h-12 rounded-full transition-all duration-200 ease-in-out
                             ${activeChatId === dm.id
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#202225]'
                                : ''
                            }`
                         }>
                           <Avatar characterProfile={characterProfile} size="md" />
                         </div>
                    </button>
                )
            })}
        </nav>
    );
};

export default ChatSidebar;
