import { useState, useEffect, useRef } from 'react';
import { getChatRoom, getChatMessages, sendChatMessage, getProjectNotes, addProjectNote } from '../../../api/services/projectDetails';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, StickyNote, Send, Pin } from 'lucide-react';

const ProjectChatAndNotes = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('chat');
  
  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          <MessageSquare size={16} /> <span>Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center space-x-2 ${activeTab === 'notes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          <StickyNote size={16} /> <span>Notes</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatSection projectId={projectId} /> : <NotesSection projectId={projectId} />}
      </div>
    </div>
  );
};

const ChatSection = ({ projectId }) => {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getChatRoom(projectId).then(res => {
      setRoomId(res.data.id);
      getChatMessages(res.data.id).then(msgRes => setMessages(msgRes.data.results || msgRes.data));
    });
  }, [projectId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const formData = new FormData();
    formData.append('message', newMsg);
    
    sendChatMessage(roomId, formData).then(() => {
      setNewMsg('');
      getChatMessages(roomId).then(res => setMessages(res.data.results || res.data));
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === user.id ? 'bg-primary text-white' : 'bg-white border'}`}>
              <p className="text-xs font-bold mb-1 opacity-80">{msg.sender_name || 'User'}</p>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex space-x-2">
        <input 
          type="text" 
          value={newMsg} 
          onChange={e => setNewMsg(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..." 
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={handleSend} className="bg-primary text-white p-2 rounded-lg bg-blue-800">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

const NotesSection = ({ projectId }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [mentionAll, setMentionAll] = useState(false);

  const fetchNotes = () => getProjectNotes(projectId).then(res => setNotes(res.data));
  useEffect(() => { fetchNotes(); }, [projectId]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addProjectNote(projectId, { content: newNote, mention_all: mentionAll })
      .then(() => { setNewNote(''); setMentionAll(false); fetchNotes(); });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {notes.map(note => (
          <div key={note.id} className={`p-3 rounded-lg border ${note.is_pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">{note.user_name}</span>
              <div className="flex items-center space-x-2">
                {note.is_pinned && <Pin size={12} className="text-yellow-600" />}
                <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t">
        <textarea 
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write a note... Use @all to mention everyone."
          className="w-full border rounded-lg p-2 text-sm mb-2"
          rows="3"
        />
        <div className="flex justify-between items-center">
          <label className="flex items-center space-x-2 text-xs text-gray-600">
            <input type="checkbox" checked={mentionAll} onChange={e => setMentionAll(e.target.checked)} />
            <span>Mention All (@all)</span>
          </label>
          <button onClick={handleAddNote} className="bg-primary text-white px-4 py-1 rounded text-sm bg-blue-800">
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectChatAndNotes;
