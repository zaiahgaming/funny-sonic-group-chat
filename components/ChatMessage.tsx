import React from 'react';
import type { Message, Character } from '../types';
import { MessageType } from '../types';
import { CHARACTERS_MAP } from '../constants';
import Avatar from './Avatar';

interface ChatMessageProps {
  message: Message;
  userCharacter: Character | null;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userCharacter }) => {
  switch (message.type) {
    case MessageType.CHARACTER:
      // FIX: Replaced 'as any' with a specific type assertion for better type safety.
      const characterInfo = CHARACTERS_MAP.get(message.author as Character);
      const isUserMessage = message.author === userCharacter;

      if (isUserMessage) {
        return (
          <div className="flex justify-end">
            <div className="bg-indigo-600 text-white p-3 rounded-lg rounded-br-none max-w-sm md:max-w-md shadow-lg">
              {message.content}
            </div>
          </div>
        );
      }

      return (
        <div className="flex justify-start items-end space-x-3">
            {/* FIX: Added type assertion because inside this case, message.author is guaranteed to be a Character. */}
            <Avatar characterName={message.author as Character} />
            <div>
              <p className={`font-bold text-sm mb-1 ${characterInfo?.color || 'text-gray-300'}`}>
                {message.author}
              </p>
              <div className="bg-gray-800 p-3 rounded-lg rounded-bl-none max-w-sm md:max-w-md shadow-lg">
                {message.content}
              </div>
            </div>
        </div>
      );
    case MessageType.SYSTEM:
      return (
        <div className="text-center text-sm text-gray-400 italic py-2">
          {message.content}
        </div>
      );
    default:
      return null;
  }
};

export default ChatMessage;