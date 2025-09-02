
import React from 'react';
import type { Message, CharacterHandle, CharacterProfile } from '../types';
import { MessageType } from '../types';
import Avatar from './Avatar';

interface ChatMessageProps {
  message: Message;
  prevMessage: Message | null;
  charactersMap: Map<CharacterHandle, CharacterProfile>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, prevMessage, charactersMap }) => {
  switch (message.type) {
    case MessageType.CHARACTER:
      const characterInfo = charactersMap.get(message.author);

      const isContinuation =
        prevMessage &&
        prevMessage.type === MessageType.CHARACTER &&
        prevMessage.author === message.author;

      if (isContinuation) {
        return (
          <div className="flex items-center pl-14 py-0.5 group hover:bg-black/10">
            {/* Timestamp could go here on hover */}
            <p className="text-gray-300 leading-relaxed">{message.content}</p>
          </div>
        );
      }

      return (
        <div className="flex items-start space-x-4 pt-4 group hover:bg-black/10">
          <Avatar characterProfile={characterInfo} />
          <div>
            <p className="font-bold leading-relaxed">
              <span className={`${characterInfo?.color || 'text-gray-300'}`}>{message.author}</span>
            </p>
            <p className="text-gray-300 leading-relaxed">{message.content}</p>
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
