
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message, CharacterProfile, CharacterHandle, ChatId, DmChannel } from './types';
import { MessageType } from './types';
import { generateSystemPrompt, generateDmSystemPrompt, INITIAL_CHARACTERS } from './constants';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CharacterSelection from './components/CharacterSelection';
import CharacterCreationForm from './components/CharacterCreationForm';
import UserList from './components/UserList';
import type { Content, GenerateContentResponse } from '@google/genai';
import ChatSidebar from './components/ChatSidebar';


const GROUP_CHAT_ID: ChatId = 'team-sonic-group-chat';

const generateProactivePrompt = (messages: Message[], currentUser: CharacterHandle): string => {
    const recentMessages = messages.filter(m => m.type === MessageType.CHARACTER).slice(-10);
    
    // If the chat is new or very quiet, start a random conversation.
    if (recentMessages.length < 2) {
        return "System: PROACTIVE_EVENT - The chat is quiet. Start a new, interesting conversation.";
    }

    const lastMessage = recentMessages[recentMessages.length - 1];
    const recentAuthors = new Set(recentMessages.map(m => m.author));
    
    // Scenario 1: Prompt a character who has been quiet to speak up.
    const inactiveCharacter = INITIAL_CHARACTERS.find(c => !recentAuthors.has(c.name) && c.name !== currentUser);
    if (inactiveCharacter && Math.random() > 0.6) { // 40% chance
        return `System: PROACTIVE_EVENT - ${inactiveCharacter.name} hasn't said anything in a while. Have them chime in with something in-character.`;
    }

    // Scenario 2 (Default): Have someone react to the last message to keep the flow.
    return `System: PROACTIVE_EVENT - The last thing said was from ${lastMessage.author}: "${lastMessage.content.substring(0, 70)}...". Have someone react to this or continue the conversation.`;
};


const App: React.FC = () => {
  const [messagesByChatId, setMessagesByChatId] = useState<Record<ChatId, Message[]>>(() => {
     try {
      const saved = localStorage.getItem('chatMessagesByChatId');
      return saved ? JSON.parse(saved) : { [GROUP_CHAT_ID]: [] };
    } catch {
      return { [GROUP_CHAT_ID]: [] };
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [groupChat, setGroupChat] = useState<Chat | null>(null);
  const [userCharacter, setUserCharacter] = useState<CharacterHandle | null>(null);
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => {
    try {
      const savedCharacters = localStorage.getItem('sonicCharacters');
      return savedCharacters ? JSON.parse(savedCharacters) : INITIAL_CHARACTERS;
    } catch {
      return INITIAL_CHARACTERS;
    }
  });
  const [isCreatingCharacter, setIsCreatingCharacter] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<ChatId>(GROUP_CHAT_ID);
  const [dmChannels, setDmChannels] = useState<DmChannel[]>(() => {
    try {
      const saved = localStorage.getItem('dmChannels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);


  const aiRef = useRef<GoogleGenAI | null>(null);
  const spokenCharactersRef = useRef<Set<CharacterHandle>>(new Set());
  const charactersMap = useMemo(() => new Map(characters.map(c => [c.name, c])), [characters]);
  const proactiveIntervalRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = useMemo(() => messagesByChatId[activeChatId] || [], [messagesByChatId, activeChatId]);

  const activeMembers = useMemo(() => {
    const groupMessages = messagesByChatId[GROUP_CHAT_ID] || [];
    const memberHandles = new Set<CharacterHandle>();
    if (userCharacter) {
      memberHandles.add(userCharacter);
    }
    groupMessages.forEach(msg => {
      if (msg.type === MessageType.CHARACTER) {
        memberHandles.add(msg.author);
      }
    });
    return characters.filter(c => memberHandles.has(c.name));
  }, [messagesByChatId, characters, userCharacter]);


  // Load initial data and character, and request notification permission
  useEffect(() => {
    const savedCharacter = localStorage.getItem('userCharacter') as CharacterHandle | null;
    if (savedCharacter && characters.some(c => c.name === savedCharacter)) {
      setUserCharacter(savedCharacter);
    }
    
    // Request notification permission if not already granted or denied
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(setNotificationPermission);
    }
  }, [characters]);

  // Update spoken characters ref when messages change
  useEffect(() => {
    const groupMessages = messagesByChatId[GROUP_CHAT_ID] || [];
    const spoken = new Set<CharacterHandle>();
    groupMessages.forEach(msg => {
        if (msg.type === MessageType.CHARACTER) {
            spoken.add(msg.author);
        }
    });
    spokenCharactersRef.current = spoken;
  }, [messagesByChatId]);

  // Persist state to localStorage
  useEffect(() => {
    if (userCharacter) {
      localStorage.setItem('userCharacter', userCharacter);
    }
    localStorage.setItem('chatMessagesByChatId', JSON.stringify(messagesByChatId));
    localStorage.setItem('sonicCharacters', JSON.stringify(characters));
    localStorage.setItem('dmChannels', JSON.stringify(dmChannels));
  }, [userCharacter, messagesByChatId, characters, dmChannels]);


  // Initialize AI instance and group chat
  useEffect(() => {
    if (!userCharacter) return;
  
    try {
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      }
      const ai = aiRef.current;
  
      // Initialize only the group chat instance
      const historyMessages = messagesByChatId[GROUP_CHAT_ID] || [];
      const characterMessages = historyMessages.filter(m => m.type === MessageType.CHARACTER);
      let history: Content[] = [];

      if (characterMessages.length > 0) {
          const turns: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
          let currentTurn: { role: 'user' | 'model'; parts: { text: string }[] } | null = null;

          for (const msg of characterMessages) {
              const role = msg.author === userCharacter ? 'user' : 'model';
              const text = `${msg.author}: ${msg.content}`;

              if (currentTurn && currentTurn.role === role) {
                  currentTurn.parts.push({ text });
              } else {
                  if (currentTurn) turns.push(currentTurn);
                  currentTurn = { role, parts: [{ text }] };
              }
          }
          if (currentTurn) turns.push(currentTurn);
          history = turns;
      }
      
      const systemInstruction = generateSystemPrompt(characters, userCharacter);

      const chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      setGroupChat(chatInstance);

    } catch (error) {
        console.error("Failed to initialize Gemini AI:", error);
        setMessagesForChat(GROUP_CHAT_ID, prev => [...(prev || []), {
            id: Date.now(),
            author: 'System',
            content: 'Error: Could not connect to the AI service. Please check your API key and refresh.',
            type: MessageType.SYSTEM,
        }]);
    }
  }, [characters, userCharacter]); // Re-init if user changes.

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setMessagesForChat = (chatId: ChatId, newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setMessagesByChatId(prev => {
        const currentMessages = prev[chatId] || [];
        const updatedMessages = typeof newMessages === 'function' ? newMessages(currentMessages) : newMessages;
        return {
            ...prev,
            [chatId]: updatedMessages
        };
    });
  };

  const processStreamedResponse = useCallback(async (resultStream: AsyncGenerator<GenerateContentResponse>, chatId: ChatId, isDm: boolean) => {
    let streamBuffer = '';
    let hasNotified = false;

    const showNotification = (author: string, content: string) => {
        if (!hasNotified && document.hidden && notificationPermission === 'granted') {
            new Notification(author, {
                body: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            });
            hasNotified = true;
        }
    };
    
    const processLine = (line: string) => {
      if (!line.trim()) return;

      if (isDm) {
          const dmChannel = dmChannels.find(dm => dm.id === chatId);
          const characterName = dmChannel?.partner.name;
          if (characterName) {
              showNotification(characterName, line);
              setMessagesForChat(chatId, prev => [...prev, {
                  id: Date.now() + Math.random(),
                  author: characterName,
                  content: line,
                  type: MessageType.CHARACTER
              }]);
          }
          return;
      }

      const systemMatch = line.match(/^\*(.*)\*$/);
      const chatMatch = line.match(/^([a-zA-Z0-9\s_]+):\s(.*)/s);

      if (systemMatch) {
          showNotification('System Event', systemMatch[1]);
          setMessagesForChat(chatId, prev => [...prev, {
              id: Date.now() + Math.random(),
              author: 'System',
              content: line,
              type: MessageType.SYSTEM,
          }]);
      } else if (chatMatch) {
          const characterName = chatMatch[1] as CharacterHandle;
          const content = chatMatch[2];
          if (charactersMap.has(characterName)) {
               showNotification(characterName, content);
               setMessagesForChat(chatId, prev => {
                  const batch: Message[] = [];
                  if (!spokenCharactersRef.current.has(characterName)) {
                      batch.push({
                          id: Date.now() + Math.random(),
                          author: 'System',
                          content: `*${characterName} has joined the chat*`,
                          type: MessageType.SYSTEM,
                      });
                      spokenCharactersRef.current.add(characterName);
                  }
                  batch.push({
                      id: Date.now() + Math.random() + 1,
                      author: characterName,
                      content,
                      type: MessageType.CHARACTER,
                  });
                  return [...prev, ...batch];
               });
          }
      }
    };

    for await (const chunk of resultStream) {
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
  }, [charactersMap, dmChannels, notificationPermission]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading || !userCharacter) return;

    const isDm = activeChatId !== GROUP_CHAT_ID;
    
    const userMessage: Message = {
      id: Date.now() + 1,
      author: userCharacter,
      content: userInput,
      type: MessageType.CHARACTER,
    };
    
    const messagesToAdd: Message[] = [];
    if (!isDm && !spokenCharactersRef.current.has(userCharacter)) {
      messagesToAdd.push({
        id: Date.now(),
        author: 'System',
        content: `*${userCharacter} has joined the chat*`,
        type: MessageType.SYSTEM,
      });
      spokenCharactersRef.current.add(userCharacter);
    }
    messagesToAdd.push(userMessage);
    setMessagesForChat(activeChatId, prev => [...prev, ...messagesToAdd]);
    setIsLoading(true);

    try {
      if (isDm) {
        const ai = aiRef.current;
        const dmChannel = dmChannels.find(dm => dm.id === activeChatId);
        if (!ai || !dmChannel) throw new Error("DM could not be initialized.");

        const groupMessages = messagesByChatId[GROUP_CHAT_ID] || [];
        const recentGroupMessages = groupMessages.slice(-15);
        const groupContext = recentGroupMessages
          .filter(msg => msg.type === MessageType.CHARACTER)
          .map(msg => `${msg.author}: ${msg.content}`)
          .join('\n');
        
        const systemInstruction = generateDmSystemPrompt(dmChannel.partner.name, userCharacter, groupContext);

        const dmHistory = (messagesByChatId[activeChatId] || []);
        const contents: Content[] = dmHistory
          .filter(msg => msg.type === MessageType.CHARACTER)
          .map(msg => ({
              role: msg.author === userCharacter ? 'user' : 'model',
              parts: [{ text: msg.content }]
          }));
        contents.push({ role: 'user', parts: [{ text: userInput }] });
        
        const result = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction }
        });
        await processStreamedResponse(result, activeChatId, true);
        
      } else { // It's the group chat
        if (!groupChat) throw new Error("Group chat not initialized.");
        const fullPrompt = `${userCharacter}: ${userInput}`;
        const result = await groupChat.sendMessageStream({ message: fullPrompt });
        await processStreamedResponse(result, GROUP_CHAT_ID, false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now(),
        author: 'System',
        content: 'Sorry, something went wrong while getting a response.',
        type: MessageType.SYSTEM,
      };
      setMessagesForChat(activeChatId, prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, groupChat, userCharacter, processStreamedResponse, activeChatId, dmChannels, messagesByChatId]);
  
  const handleProactiveMessage = useCallback(async () => {
    if (isLoading || !groupChat || !userCharacter) return;
    setIsLoading(true);
    try {
      const groupMessages = messagesByChatId[GROUP_CHAT_ID] || [];
      const proactivePrompt = generateProactivePrompt(groupMessages, userCharacter);
      const result = await groupChat.sendMessageStream({ message: proactivePrompt });
      await processStreamedResponse(result, GROUP_CHAT_ID, false);
    } catch (error) {
      console.error("Error fetching proactive message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, groupChat, userCharacter, processStreamedResponse, messagesByChatId]);

  // Smarter proactive messaging timer
  const scheduleProactiveMessage = useCallback(() => {
    if (proactiveIntervalRef.current) {
        clearTimeout(proactiveIntervalRef.current);
    }
    
    // Only schedule for the group chat and if the user isn't currently waiting for a response.
    if (activeChatId !== GROUP_CHAT_ID || isLoading) {
        return;
    }

    const groupMessages = messagesByChatId[GROUP_CHAT_ID] || [];
    const lastMessage = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1] : null;
    const lastMessageContent = lastMessage?.type === MessageType.CHARACTER ? lastMessage.content : '';

    const WPM = 225; // Average reading speed in words per minute
    const MIN_BUFFER = 8000; // Minimum 8 seconds for "thinking/typing"
    const MAX_BUFFER = 15000; // Maximum 15 seconds for "thinking/typing"
    const MAX_TIMEOUT = 60000; // Don't wait more than a minute

    const wordCount = lastMessageContent.trim().split(/\s+/).length;
    // Calculate how long it would take to read the last message.
    const readingTimeMs = (wordCount / WPM) * 60 * 1000;
    
    // Add a random buffer to simulate a natural pause for thinking and typing.
    const randomBuffer = Math.random() * (MAX_BUFFER - MIN_BUFFER) + MIN_BUFFER;
    
    const timeout = Math.min(readingTimeMs + randomBuffer, MAX_TIMEOUT);

    proactiveIntervalRef.current = window.setTimeout(() => {
        // Only trigger if tab is active
        if (!document.hidden) {
            handleProactiveMessage();
        }
    }, timeout);
  }, [activeChatId, isLoading, messagesByChatId, handleProactiveMessage]);

  // This effect manages the proactive timer, resetting it whenever the chat activity changes.
  useEffect(() => {
    if (!userCharacter || !groupChat) {
        return;
    }

    scheduleProactiveMessage();

    // Cleanup timer on unmount or when dependencies change
    return () => {
        if (proactiveIntervalRef.current) {
            clearTimeout(proactiveIntervalRef.current);
        }
    };
  }, [userCharacter, groupChat, messagesByChatId, activeChatId, scheduleProactiveMessage]);


  const handleSelectCharacter = (character: CharacterHandle) => {
    setUserCharacter(character);
  };

  const handleAddCharacter = (newCharacter: CharacterProfile) => {
    if (characters.some(c => c.name === newCharacter.name)) {
      alert("A character with this name already exists.");
      return;
    }
    setCharacters(prev => [...prev, newCharacter]);
    setIsCreatingCharacter(false);
  };
  
  const handleStartDm = (partner: CharacterProfile) => {
    if (!userCharacter) return;
    const existingDm = dmChannels.find(dm => dm.partner.name === partner.name);
    if (existingDm) {
      setActiveChatId(existingDm.id);
      return;
    }

    const newDmId = `dm_${partner.name}_${userCharacter}`;
    const newDmChannel: DmChannel = { id: newDmId, partner };

    setDmChannels(prev => [...prev, newDmChannel]);
    setMessagesByChatId(prev => ({ ...prev, [newDmId]: [] }));
    setActiveChatId(newDmId);
  };

  if (!userCharacter) {
    return (
      <>
        <CharacterSelection 
          characters={characters}
          onSelectCharacter={handleSelectCharacter} 
          onAddCharacterRequest={() => setIsCreatingCharacter(true)}
        />
        {isCreatingCharacter && (
          <CharacterCreationForm
            onSave={handleAddCharacter}
            onCancel={() => setIsCreatingCharacter(false)}
          />
        )}
      </>
    );
  }

  const activeChannel = activeChatId === GROUP_CHAT_ID
    ? { name: 'team-sonic', isDm: false }
    : { name: dmChannels.find(dm => dm.id === activeChatId)?.partner.name || 'DM', isDm: true };


  return (
    <div className="flex h-screen bg-[#36393f] text-gray-200 font-sans">
      <ChatSidebar 
        dmChannels={dmChannels}
        charactersMap={charactersMap}
        activeChatId={activeChatId}
        onSwitchChat={setActiveChatId}
        groupChatId={GROUP_CHAT_ID}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header activeChannelName={activeChannel.name} isDm={activeChannel.isDm} />
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            return <ChatMessage key={msg.id} message={msg} prevMessage={prevMsg} charactersMap={charactersMap} />;
          })}
          {isLoading && (
            <div className="flex items-start space-x-4 pt-4">
              <div className="w-10 h-10 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center font-bold text-indigo-400">?</div>
              <div className="flex items-center space-x-2 pt-1">
                <SpinnerIcon />
                <span className="text-gray-400 animate-pulse">Awaiting response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          channelName={activeChannel.name}
          isDm={activeChannel.isDm}
        />
      </div>
      <UserList 
        characters={activeMembers} 
        onStartDm={handleStartDm}
        currentUserHandle={userCharacter}
      />
    </div>
  );
};

export default App;
