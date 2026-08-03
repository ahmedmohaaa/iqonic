import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import apiClient from '../api/axios';

const TagInput = ({ projectId, onSelect, selectedUsers = [] }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      apiClient
        .get('search/', { params: { q: query } })
        .then(res => {
          const users = res.data.results?.users || [];
          setSuggestions(users);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      onSelect([...selectedUsers, user]);
    }
    setQuery('');
    setSuggestions([]);
  };

  const handleRemove = (userId) => {
    onSelect(selectedUsers.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUsers.map(user => (
          <span
            key={user.id}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
          >
            @{user.username}
            <button
              onClick={() => handleRemove(user.id)}
              className="ml-2 text-primary hover:text-red-600"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type @ to mention..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                <span className="text-xs text-gray-400">{user.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;