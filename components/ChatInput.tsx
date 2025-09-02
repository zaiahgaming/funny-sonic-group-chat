
import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (input: string) => void;
  isLoading: boolean;
  channelName: string;
  isDm: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, channelName, isDm }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const placeholder = isDm ? `Message @${channelName}` : `Message #${channelName}`;

  return (
    <div className="px-4 pb-4 bg-[#36393f]">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-[#40444b] rounded-lg px-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 text-white placeholder-gray-400 focus:outline-none"
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="text-indigo-400 hover:text-indigo-300 disabled:text-gray-600 disabled:cursor-not-allowed transition duration-300"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
