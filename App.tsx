
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message, Character } from './types';
import { MessageType } from './types';
import { SYSTEM_PROMPT, CHARACTERS_MAP, INITIAL_MESSAGES } from './constants';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CharacterSelection from './components/CharacterSelection';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [userCharacter, setUserCharacter] = useState<Character | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved data from localStorage on initial render
    const savedCharacter = localStorage.getItem('userCharacter') as Character | null;
    if (savedCharacter) {
      setUserCharacter(savedCharacter);
    }

    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages(INITIAL_MESSAGES);
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    if (userCharacter) {
      localStorage.setItem('userCharacter', userCharacter);
    }
    // Only save non-empty message arrays to avoid overwriting initial state on first load
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [userCharacter, messages]);


  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const chatInstance = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: SYSTEM_PROMPT,
          },
        });
        setChat(chatInstance);
      } catch (error) {
        console.error("Failed to initialize Gemini AI:", error);
        setMessages(prev => [...prev, {
          id: Date.now(),
          author: 'System',
          content: 'Error: Could not connect to the AI service. Please check your API key and refresh.',
          type: MessageType.SYSTEM,
        }]);
      }
    };
    initChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading || !chat || !userCharacter) return;

    const userMessage: Message = {
      id: Date.now(),
      author: userCharacter,
      content: userInput,
      type: MessageType.CHARACTER,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chat.sendMessageStream({ message: userInput });
      let streamBuffer = '';
      
      const processLine = (line: string) => {
        if (!line.trim()) return;

        const systemMatch = line.match(/^\*(.*)\*$/);
        const chatMatch = line.match(/^([a-zA-Z0-9\s]+):\s(.*)/s);

        if (systemMatch) {
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                author: 'System',
                content: line,
                type: MessageType.SYSTEM,
            }]);
        } else if (chatMatch) {
            const characterName = chatMatch[1];
            const content = chatMatch[2];
            if (CHARACTERS_MAP.has(characterName as any)) {
                 setMessages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    author: characterName as Character,
                    content,
                    type: MessageType.CHARACTER,
                }]);
            }
        }
      };

      for await (const chunk of result) {
          streamBuffer += chunk.text;
          const lines = streamBuffer.split('\n');
          
          if (lines.length > 1) {
              for (let i = 0; i < lines.length - 1; i++) {
                processLine(lines[i]);
              }
              streamBuffer = lines[lines.length - 1];
          }
      }
      
      if (streamBuffer.trim()) {
        processLine(streamBuffer);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now(),
        author: 'System',
        content: 'Sorry, something went wrong while getting a response.',
        type: MessageType.SYSTEM,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chat, userCharacter]);
  
  const handleSelectCharacter = (character: Character) => {
    setUserCharacter(character);
  };

  if (!userCharacter) {
    return <CharacterSelection onSelectCharacter={handleSelectCharacter} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} userCharacter={userCharacter}/>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center space-x-2">
             <div className="w-10 h-10 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center font-bold text-indigo-400">?</div>
            <div className="flex items-center space-x-1 bg-gray-800 p-3 rounded-lg">
              <SpinnerIcon />
              <span className="text-gray-400 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} userCharacter={userCharacter}/>
    </div>
  );
};

export default App;
