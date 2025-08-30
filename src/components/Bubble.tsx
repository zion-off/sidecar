export function Bubble({ message, role }: { message: string; role: 'user' | 'assistant' }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs whitespace-pre-line rounded-lg px-2 py-1 lg:max-w-md ${
          role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
