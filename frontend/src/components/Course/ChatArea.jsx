import { useState } from 'react';
import { Send, Smile, Paperclip, Image as ImageIcon } from 'lucide-react';

const mockMessages = [
  {
    id: '1',
    sender: 'Sarah Johnson',
    avatar: 'SJ',
    content: 'Hey everyone! Did anyone finish the calculus homework?',
    timestamp: '10:30 AM',
    isOwn: false,
  },
  {
    id: '2',
    sender: 'Mike Chen',
    avatar: 'MC',
    content: 'Yeah, just finished! Problem 5 was tough though 😅',
    timestamp: '10:32 AM',
    isOwn: false,
  },
  {
    id: '3',
    sender: 'You',
    avatar: 'JD',
    content: 'I struggled with that one too! Can we go over it together?',
    timestamp: '10:33 AM',
    isOwn: true,
  },
  {
    id: '4',
    sender: 'Emily Taylor',
    avatar: 'ET',
    content: 'I can help! Let\'s jump on a video call in Study Room 1?',
    timestamp: '10:35 AM',
    isOwn: false,
  },
  {
    id: '5',
    sender: 'Alex Rivera',
    avatar: 'AR',
    content: 'Perfect timing! I was about to ask about the exam next week. Anyone down for a group study session tomorrow?',
    timestamp: '10:40 AM',
    isOwn: false,
  },
  {
    id: '6',
    sender: 'You',
    avatar: 'JD',
    content: 'Sounds great! I\'m free after 3 PM',
    timestamp: '10:42 AM',
    isOwn: true,
  },
];

export function ChatArea({ course }) {
  const [messages] = useState(mockMessages);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      // In a real app, this would send the message
      setInputValue('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}
          >
            {!message.isOwn && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: course.color }}
              >
                <span className="text-sm">{message.avatar}</span>
              </div>
            )}
            <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'} max-w-md`}>
              {!message.isOwn && (
                <span className="text-xs text-gray-600 mb-1 px-1">{message.sender}</span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.isOwn
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ImageIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            <button className="hover:scale-110 transition-transform">
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <button
            onClick={handleSend}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
