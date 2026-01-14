import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiX } from 'react-icons/fi';
import { useUIStore } from '../../store/useStore';

const SearchModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      closeSearch();
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeSearch} />

      {/* Search Panel */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-lg animate-slide-down">
        <div className="container py-6">
          <form onSubmit={handleSubmit} className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-14 pr-14 py-4 text-lg border-2 border-primary-200 rounded-xl focus:outline-none focus:border-primary-400"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </form>

          {/* Quick Links */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">{t('common.popular')}:</span>
            {['Dresses', 'Party Wear', 'Summer Collection', 'Baby Sets'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  navigate(`/shop?q=${encodeURIComponent(term)}`);
                  closeSearch();
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-600 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
