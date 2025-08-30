import { KeyboardEvent, useState } from 'react';
import type { MessageBubble } from '@/types/chat';
import { Bubble } from '@/components/Bubble';

export function Chat() {
  const [messages, _] = useState<MessageBubble[]>([
    { message: 'Hello, how can I assist you today?', role: 'assistant' },
    { message: 'I need help with my code.', role: 'user' }
  ]);
  const [input, setInput] = useState('');

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Add message sending logic here
    }
  }

  return (
    <div className="w-full max-w-full p-4">
      {messages.map((msg, index) => (
        <Bubble key={index} message={msg.message} role={msg.role} />
      ))}

      <textarea
        className="w-full rounded-md bg-lc-fg p-2 text-white transition-shadow duration-200 ease-in-out placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Type your message here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
