
export enum MessageType {
  USER = 'USER',
  CHARACTER = 'CHARACTER',
  SYSTEM = 'SYSTEM',
}

export type Character = 
  | 'GottaGoFast'
  | 'TheFinalBraincell'
  | 'Knux'
  | 'Ames'
  | 'TheUltimateLifeform'
  | 'Dark'
  | 'Batty'
  | 'firegrl'
  | 'muffinknife'
  | 'omega bot'
  | 'Faker'
  | 'Maria';


export interface Message {
  id: number;
  author: 'System' | Character;
  content: string;
  type: MessageType;
}
