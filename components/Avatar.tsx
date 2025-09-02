
import React from 'react';
import { CHARACTERS_MAP } from '../constants';
import type { Character } from '../types';

interface AvatarProps {
  characterName: Character;
}

const Avatar: React.FC<AvatarProps> = ({ characterName }) => {
    const characterInfo = CHARACTERS_MAP.get(characterName);
    if (!characterInfo) {
        return <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0"></div>;
    }
    return (
        <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${characterInfo.color} bg-gray-700 border-2 border-gray-600`}>
            {characterInfo.avatar}
        </div>
    );
};

export default Avatar;
