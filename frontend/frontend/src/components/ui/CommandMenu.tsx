import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Globe, Shield, Settings, 
  Terminal, Activity, Command, X, ArrowRight, Loader2
} from 'lucide-react';
import { api } from '../../lib/api';

interface CommandResult {
  id: string;
  title: string;
  type: string;
  url: string;
  icon: string;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Static navigation options
  const staticOptions: CommandResult[] = [
    { id: 'overview', title: 'Go to Overview', type: 'Page', url: '/', icon: 'Activity' },
    { id: 'users', title: 'Manage Users', type: 'Page', url: '/users', icon: 'Users' },
    { id: 'apps', title: 'OAuth Applications', type: 'Page', url: '/developer/applications', icon: 'Globe' },
    { id: 'logs', title: 'API Observability', type: 'Page', url: '/developer/api-logs', icon: 'Terminal' },
    { id: 'security', title: 'Security & Sessions', type: 'Page', url: '/security/sessions', icon: 'Shield' },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.get(`/auth/admin/search?q=${query}`);
        setResults(data.results || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const allResults = [...staticOptions.filter(o => o.title.toLowerCase().includes(query.toLowerCase())), ...results];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        navigate(allResults[selectedIndex].url);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getIcon = (name: string) => {
    switch (name) {
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Globe': return <Globe className="w-4 h-4" />;
      case 'Shield': return <Shield className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Terminal': return <Terminal className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-[#06080f]/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-xl bg-[#0d0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/30" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/20"
            placeholder="Search users, apps, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-white/40 uppercase font-bold">
            Esc
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {isLoading && query && (
            <div className="flex items-center gap-3 p-3 text-white/40 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Searching platform...
            </div>
          )}

          {!isLoading && allResults.length === 0 && query && (
            <div className="p-8 text-center text-white/30 text-sm">
              No results found for "<span className="text-white">{query}</span>"
            </div>
          )}

          {!query && (
            <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Quick Navigation
            </div>
          )}

          {allResults.map((result, idx) => (
            <div
              key={`${result.type}-${result.id}`}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${
                idx === selectedIndex ? 'bg-white/5 text-white' : 'text-white/50 hover:bg-white/[0.02] hover:text-white/80'
              }`}
              onClick={() => {
                navigate(result.url);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                  idx === selectedIndex ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-white/30'
                }`}>
                  {getIcon(result.icon)}
                </div>
                <div>
                  <div className="text-sm font-medium">{result.title}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-40">{result.type}</div>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 transition-all ${
                idx === selectedIndex ? 'translate-x-0 opacity-100 text-cyan-400' : '-translate-x-2 opacity-0'
              }`} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/40 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/40 font-mono">Enter</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400/40">
            <Command className="w-3 h-3" />
            <span className="uppercase tracking-widest">Search Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
