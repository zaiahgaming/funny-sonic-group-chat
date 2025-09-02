
import React from 'react';
import { CHARACTERS } from '../constants';
import type { Character } from '../types';
import Avatar from './Avatar';

interface CharacterSelectionProps {
  onSelectCharacter: (character: Character) => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onSelectCharacter }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold text-indigo-400 mb-2 tracking-wider">
        Team Sonic
      </h1>
      <h2 className="text-2xl text-gray-300 mb-8">Choose Your Character</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full max-w-4xl">
        {CHARACTERS.map((char) => (
          <button
            key={char.name}
            onClick={() => onSelectCharacter(char.name)}
            className="flex flex-col items-center p-4 bg-gray-800 rounded-lg border-2 border-transparent hover:border-indigo-500 hover:bg-gray-700 transition duration-300 ease-in-out transform hover:-translate-y-1"
            aria-label={`Select ${char.name}`}
          >
            <Avatar characterName={char.name} />
            <span className={`mt-2 font-semibold ${char.color}`}>{char.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;
