
import React from 'react';

interface HeaderProps {
  activeChannelName: string;
  isDm: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeChannelName, isDm }) => {
  return (
    <header className="bg-[#36393f] shadow-md p-3 text-left border-b border-black/20 flex-shrink-0">
      <h1 className="text-lg font-semibold text-white flex items-center">
        {isDm ? (
           <span className="text-gray-500 text-2xl font-thin mr-2">@</span>
        ) : (
          <span className="text-gray-500 text-2xl font-thin mr-2">#</span>
        )}
        {activeChannelName}
      </h1>
    </header>
  );
};

export default Header;
