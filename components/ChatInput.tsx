
import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';
import Avatar from './Avatar';
import type { Character } from '../types';

interface ChatInputProps {
  onSendMessage: (input: string) => void;
  isLoading: boolean;
  userCharacter: Character | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, userCharacter }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-gray-800/80 backdrop-blur-sm border-t border-indigo-500/30">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {userCharacter && <Avatar characterName={userCharacter} />}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
