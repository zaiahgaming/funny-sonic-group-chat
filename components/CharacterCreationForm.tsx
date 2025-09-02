
import React, { useState } from 'react';
import type { CharacterProfile } from '../types';

interface CharacterCreationFormProps {
  onSave: (character: CharacterProfile) => void;
  onCancel: () => void;
}

const COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400', 
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400',
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400',
  'text-rose-400'
];

const CharacterCreationForm: React.FC<CharacterCreationFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState(COLORS[10]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !personality.trim() || !avatar.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    onSave({ 
        name: name.trim(), 
        personality: personality.trim(), 
        avatar: avatar.trim().substring(0, 2).toUpperCase(), 
        color 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-[#36393f] p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Create a New Character</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="char-name" className="block text-sm font-medium text-gray-300 mb-1">Nickname</label>
            <input
              id="char-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 'ChaosControl'"
              maxLength={20}
              className="w-full bg-[#2f3136] rounded-md p-2 text-white border border-black/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="char-personality" className="block text-sm font-medium text-gray-300 mb-1">Personality</label>
            <textarea
              id="char-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe their personality for the AI..."
              rows={3}
              className="w-full bg-[#2f3136] rounded-md p-2 text-white border border-black/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="char-avatar" className="block text-sm font-medium text-gray-300 mb-1">Avatar Initials (2 chars)</label>
            <input
              id="char-avatar"
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              maxLength={2}
              className="w-full bg-[#2f3136] rounded-md p-2 text-white border border-black/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="grid grid-cols-9 gap-2">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c.replace('text-', 'bg-')} transition transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition">Save Character</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreationForm;
