
import React from 'react';
import type { CharacterProfile, CharacterHandle } from '../types';
import Avatar from './Avatar';

interface UserListProps {
  characters: CharacterProfile[];
  onStartDm: (character: CharacterProfile) => void;
  currentUserHandle: CharacterHandle;
}

const UserList: React.FC<UserListProps> = ({ characters, onStartDm, currentUserHandle }) => {
    return (
        <aside className="w-60 bg-[#2f3136] p-3 flex-shrink-0 hidden md:flex md:flex-col">
            <h2 className="text-xs font-bold uppercase text-gray-400 mb-2 px-1">Members — {characters.length}</h2>
            <div className="flex-1 overflow-y-auto space-y-1">
                {characters.map(char => {
                    const isCurrentUser = char.name === currentUserHandle;
                    return (
                        <button 
                            key={char.name} 
                            onClick={() => !isCurrentUser && onStartDm(char)}
                            disabled={isCurrentUser}
                            className={`w-full flex items-center space-x-3 p-1 rounded-md ${isCurrentUser ? 'opacity-50 cursor-default' : 'hover:bg-white/5'}`}
                            aria-label={isCurrentUser ? `You are ${char.name}`: `Start a direct message with ${char.name}`}
                        >
                            <Avatar characterProfile={char} size="sm" />
                            <span className={`font-medium text-sm truncate ${char.color}`}>
                                {char.name}
                                {isCurrentUser && ' (You)'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default UserList;
