
export enum MessageType {
  USER = 'USER',
  CHARACTER = 'CHARACTER',
  SYSTEM = 'SYSTEM',
}

export type CharacterHandle = string;
export type ChatId = string;

export interface CharacterProfile {
  name: CharacterHandle;
  color: string;
  avatar: string;
  personality?: string; // For custom characters
}

export interface Message {
  id: number;
  author: 'System' | CharacterHandle;
  content: string;
  type: MessageType;
}

export interface DmChannel {
  id: ChatId;
  partner: CharacterProfile;
}
