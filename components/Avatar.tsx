
import React from 'react';
import type { CharacterProfile } from '../types';

interface AvatarProps {
  characterProfile: CharacterProfile | undefined;
  size?: 'sm' | 'md';
}

const Avatar: React.FC<AvatarProps> = ({ characterProfile, size = 'md' }) => {
    const sizeClasses = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
    if (!characterProfile) {
        return <div className={`${sizeClasses} rounded-full bg-gray-600 flex-shrink-0`}></div>;
    }
    return (
        <div className={`${sizeClasses} flex-shrink-0 rounded-full flex items-center justify-center font-bold ${characterProfile.color} bg-gray-700`}>
            {characterProfile.avatar}
        </div>
    );
};

export default Avatar;
