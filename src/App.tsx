import { useState, useEffect, useCallback, useRef } from 'react';

// === TYPES ===
interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: 'read' | 'reading' | 'want';
  isbn: string;
  totalPages: number | null;
  currentPage: number;
  rating: number;
  coverUrl: string | null;
  dateAdded: number;
}

type FilterType = 'all' | 'read' | 'reading' | 'want';

// === CONSTANTS ===
const STORAGE_KEY = 'myLibraryBooks';
const THEME_KEY = 'myLibraryTheme';
const GOAL_KEY = 'myLibraryGoal';

const STATUS_LABELS: Record<string, string> = {
  read: '✅ Прочитано',
  reading: '📖 Читаю',
  want: '🔖 Хочу прочитать'
};

// === HELPERS ===
function pluralize(n: number, one: string, two: string, five: string): string {
  let abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 19) return five;
  abs = abs % 10;
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return two;
  return five;
}

function generateId(): string {
  return 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

async function fetchCoverByISBN(isbn: string): Promise<string | null> {
  if (!isbn) return null;
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanISBN) return null;
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const key = `ISBN:${cleanISBN}`;
    if (data[key] && data[key].cover) {
      return data[key].cover.medium || data[key].cover.small || null;
    }
    return null;
  } catch {
    return null;
  }
}

// === COMPONENTS ===

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title="Сменить тему"
      className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl cursor-pointer transition-all duration-300 hover:rotate-[20deg] hover:scale-105"
      style={{
        background: 'var(--card)',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {isDark ? '🌅' : '🌆'}
    </button>
  );
}

function GoalPanel({ books, goal, onEditGoal }: { books: Book[]; goal: number; onEditGoal: () => void }) {
  const readCount = books.filter(b => b.status === 'read').length;
  const year = new Date().getFullYear();
  const percent = goal > 0 ? Math.min(100, Math.round((readCount / goal) * 100)) : 0;

  let message = '';
  if (readCount === 0) message = 'Начни читать — и цель покорится!';
  else if (percent < 50) message = `Отличное начало! Осталось ${goal - readCount} книг.`;
  else if (percent < 100) message = `Больше половины! Осталось ${goal - readCount} книг.`;
  else if (percent === 100) message = '✨ Цель достигнута! Ты молодец!';
  else message = `🌟 Превышение цели на ${readCount - goal} книг!`;

  return (
    <div
      className="rounded-2xl p-7 shadow-md"
      style={{ background: 'var(--card)', borderLeft: '4px solid var(--accent-green)', boxShadow: 'var(--shadow)' }}
    >
      <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold" style={{ color: 'var(--accent-green)' }}>
        🔖 Цель на {year} год
      </h3>
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <span className="text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>{readCount}</span>
          <span className="ml-1" style={{ color: 'var(--text-soft)' }}>из {goal} книг</span>
        </div>
        <button
          onClick={onEditGoal}
          className="px-5 py-2.5 rounded-lg text-sm cursor-pointer transition-all duration-200"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-soft)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-soft)'; }}
        >
          Изменить
        </button>
      </div>
      <div className="w-full h-3.5 rounded-xl overflow-hidden mb-2.5" style={{ background: 'var(--bg-soft)' }}>
        <div
          className="h-full rounded-xl transition-all duration-500"
          style={{ width: `${percent}%`, background: 'linear-gradient(90deg, var(--accent-green), #6ab07f)' }}
        />
      </div>
      <p className="text-sm" style={{ color: 'var(--text-soft)' }}>{message}</p>
    </div>
  );
}

function RecPanel({ books }: { books: Book[] }) {
  const readBooks = books.filter(b => b.status === 'read' && b.genre);
  const genreCount: Record<string, number> = {};
  readBooks.forEach(b => {
    const g = b.genre.trim();
    if (g) genreCount[g] = (genreCount[g] || 0) + 1;
  });

  const top = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div
      className="rounded-2xl p-7 shadow-md"
      style={{ background: 'var(--card)', borderLeft: '4px solid var(--accent-purple)', boxShadow: 'var(--shadow)' }}
    >
      <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold" style={{ color: 'var(--accent-purple)' }}>
        ✨ Твои любимые жанры
      </h3>
      <div className="flex flex-col gap-2">
        {top.length === 0 ? (
          <p className="italic text-sm" style={{ color: 'var(--text-soft)' }}>Прочти книги — и мы покажем твои любимые жанры</p>
        ) : (
          top.map(([genre, count]) => (
            <div key={genre} className="flex justify-between items-center px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--bg-soft)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{genre}</span>
              <span className="px-2.5 py-0.5 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--accent-purple)' }}>
                {count} {pluralize(count, 'книга', 'книги', 'книг')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatsCards({ books }: { books: Book[] }) {
  const stats = [
    { label: 'Всего книг', value: books.length, className: '' },
    { label: '✅ Прочитано', value: books.filter(b => b.status === 'read').length, className: 'read' },
    { label: '📖 Читаю', value: books.filter(b => b.status === 'reading').length, className: 'reading' },
    { label: '🔖 Хочу прочитать', value: books.filter(b => b.status === 'want').length, className: 'want' },
  ];

  const borderColor: Record<string, string> = {
    '': 'var(--primary)',
    'read': 'var(--accent-green)',
    'reading': 'var(--accent-blue)',
    'want': 'var(--accent-purple)',
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 mb-8">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-4 rounded-xl text-center shadow-md transition-transform duration-200 hover:-translate-y-1"
          style={{ background: 'var(--card)', borderLeft: `4px solid ${borderColor[stat.className]}`, boxShadow: 'var(--shadow)' }}
        >
          <div className="text-3xl font-bold" style={{ color: 'var(--primary-dark)' }}>{stat.value}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-soft)' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function BookCard({ book, onEdit, onDelete, onPageChange }: {
  book: Book;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (id: string, page: number) => void;
}) {
  const renderStars = (rating: number) => {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= rating ? '♦' : '◇';
    }
    return html;
  };

  return (
    <div
      className="animate-fade-in rounded-2xl p-6 shadow-md transition-all duration-300 hover:-translate-y-1 relative flex gap-6"
      style={{
        background: 'var(--card)',
        boxShadow: 'var(--shadow)',
        borderTop: `4px solid ${book.status === 'read' ? 'var(--accent-green)' : book.status === 'reading' ? 'var(--accent-blue)' : 'var(--accent-purple)'}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
    >
      {/* Cover */}
      <div
        className="w-28 h-[150px] flex-shrink-0 rounded-lg flex items-center justify-center text-4xl overflow-hidden"
        style={{ background: 'var(--bg-soft)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="Обложка" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '📔'; }} />
        ) : '📔'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold leading-tight mb-1 break-words" style={{ color: 'var(--primary-dark)' }}>
          {book.title}
        </h4>
        <p className="italic text-sm mb-2.5" style={{ color: 'var(--text-soft)' }}>{book.author}</p>

        <div className="flex gap-1.5 flex-wrap mb-2">
          {book.genre && (
            <span className="inline-block px-2.5 py-0.5 rounded-xl text-xs" style={{ background: 'var(--bg-soft)', color: 'var(--text-soft)' }}>
              {book.genre}
            </span>
          )}
          <span
            className="inline-block px-2.5 py-0.5 rounded-xl text-xs font-semibold"
            style={{
              background: book.status === 'read' ? 'rgba(74,124,89,0.15)' : book.status === 'reading' ? 'rgba(61,108,185,0.15)' : 'rgba(123,94,167,0.15)',
              color: book.status === 'read' ? 'var(--accent-green)' : book.status === 'reading' ? 'var(--accent-blue)' : 'var(--accent-purple)',
            }}
          >
            {STATUS_LABELS[book.status]}
          </span>
        </div>

        {book.rating > 0 && (
          <div className="text-base tracking-widest mb-2" style={{ color: '#f4b942' }}>
            {renderStars(book.rating)}
          </div>
        )}

        {/* Progress */}
        {book.totalPages && book.totalPages > 0 && (
          <div className="mb-2.5">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-soft)' }}>
              <span>{Math.min(book.currentPage, book.totalPages)} / {book.totalPages} стр.</span>
              <span>{Math.round((Math.min(book.currentPage, book.totalPages) / book.totalPages) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-xl overflow-hidden mb-1" style={{ background: 'var(--bg-soft)' }}>
              <div
                className="h-full rounded-xl transition-all duration-300"
                style={{
                  width: `${Math.round((Math.min(book.currentPage, book.totalPages) / book.totalPages) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent-blue), #6b9bd1)',
                }}
              />
            </div>
            {book.status === 'reading' && (
              <input
                type="range"
                className="page-slider"
                min="0"
                max={book.totalPages}
                value={Math.min(book.currentPage, book.totalPages)}
                onChange={(e) => onPageChange(book.id, parseInt(e.target.value))}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 justify-end pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => onEdit(book.id)}
            className="p-2.5 px-4 rounded-lg text-base cursor-pointer transition-all duration-200 bg-transparent border-none hover:bg-[var(--bg-soft)]"
            title="Редактировать"
          >
            🖊️
          </button>
          <button
            onClick={() => onDelete(book.id)}
            className="p-2.5 px-4 rounded-lg text-base cursor-pointer transition-all duration-200 bg-transparent border-none hover:bg-red-100"
            title="Удалить"
          >
            ❌
          </button>
        </div>
      </div>
    </div>
  );
}

function BookModal({ book, onSave, onClose }: {
  book: Book | null;
  onSave: (data: Partial<Book>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [genre, setGenre] = useState(book?.genre || '');
  const [status, setStatus] = useState<Book['status']>(book?.status || 'want');
  const [isbn, setIsbn] = useState(book?.isbn || '');
  const [totalPages, setTotalPages] = useState(book?.totalPages?.toString() || '');
  const [rating, setRating] = useState(book?.rating || 0);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onSave({
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      status,
      isbn: isbn.trim(),
      totalPages: totalPages ? parseInt(totalPages) : null,
      rating,
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-5 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-[20px] p-7 w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ background: 'var(--card)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <h2 className="text-2xl mb-5 font-semibold" style={{ color: 'var(--primary-dark)' }}>
          {book ? 'Редактировать книгу' : 'Добавить книгу'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Название *</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
              style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
            />
          </div>
          <div className="mb-3.5">
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Автор *</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
              style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3.5 max-[500px]:grid-cols-1">
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Жанр</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Фантастика"
                maxLength={50}
                className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
                style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Book['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
                style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
              >
                <option value="want">🔖 Хочу прочитать</option>
                <option value="reading">📖 Читаю</option>
                <option value="read">✅ Прочитано</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3.5 max-[500px]:grid-cols-1">
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-3-16-148410-0"
                className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
                style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-soft)' }}>Для автозагрузки обложки</p>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Всего страниц</label>
              <input
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                min="1"
                max="9999"
                placeholder="320"
                className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
                style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
              />
            </div>
          </div>
          <div className="mb-3.5">
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Рейтинг</label>
            <div className="flex gap-1 text-3xl justify-end flex-row-reverse">
              {[5, 4, 3, 2, 1].map(v => (
                <span
                  key={v}
                  className="cursor-pointer select-none transition-colors duration-150"
                  style={{ color: v <= rating ? '#f4b942' : 'var(--border)' }}
                  onClick={() => setRating(v)}
                >
                  ♦
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5 justify-end mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200"
              style={{ background: 'var(--bg-soft)', color: 'var(--text)', border: '2px solid var(--border)' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-8 py-4 rounded-xl text-base font-semibold cursor-pointer text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--primary)' }}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toast({ message, isError, onDone }: { message: string; isError: boolean; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-8 right-8 px-5 py-3.5 rounded-xl shadow-2xl z-50 max-w-[300px] animate-slide-in-right"
      style={{
        background: 'var(--card)',
        color: 'var(--text)',
        borderLeft: `4px solid ${isError ? 'var(--danger)' : 'var(--accent-green)'}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}
    >
      {message}
    </div>
  );
}

// === MAIN APP ===
export default function App() {
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem(GOAL_KEY) || '') || 12);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [modalBook, setModalBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Theme
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Save books
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  // Save goal
  useEffect(() => {
    localStorage.setItem(GOAL_KEY, goal.toString());
  }, [goal]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) setModalOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
  }, []);

  const handleToggleTheme = () => setIsDark(prev => !prev);

  const handleEditGoal = () => {
    const input = prompt('Сколько книг хочешь прочитать в этом году?', goal.toString());
    if (input === null) return;
    const n = parseInt(input);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      showToast('Цель обновлена!');
    }
  };

  const handleAddBook = () => {
    setModalBook(null);
    setModalOpen(true);
  };

  const handleEditBook = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setModalBook(book);
      setModalOpen(true);
    }
  };

  const handleDeleteBook = (id: string) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    if (confirm(`Удалить книгу «${book.title}»?`)) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const handlePageChange = (id: string, page: number) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, currentPage: page } : b));
  };

  const handleSaveBook = async (data: Partial<Book>) => {
    let coverUrl: string | null = null;
    if (data.isbn) {
      coverUrl = await fetchCoverByISBN(data.isbn);
    }

    if (modalBook) {
      // Edit
      setBooks(prev => prev.map(b => {
        if (b.id !== modalBook.id) return b;
        return {
          ...b,
          ...data,
          coverUrl: coverUrl || b.coverUrl || null,
          totalPages: data.totalPages || null,
          currentPage: data.status === 'read' && data.totalPages
            ? data.totalPages
            : (b.currentPage || 0),
        };
      }));
    } else {
      // Add new
      const newBook: Book = {
        id: generateId(),
        dateAdded: Date.now(),
        coverUrl,
        totalPages: data.totalPages || null,
        currentPage: data.status === 'read' && data.totalPages ? data.totalPages : 0,
        title: data.title || '',
        author: data.author || '',
        genre: data.genre || '',
        status: data.status || 'want',
        isbn: data.isbn || '',
        rating: data.rating || 0,
      };
      setBooks(prev => [...prev, newBook]);
    }
    setModalOpen(false);
  };

  const handleExport = () => {
    if (books.length === 0) {
      showToast('Библиотека пуста — нечего экспортировать', true);
      return;
    }
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Библиотека экспортирована!');
  };

  const handleImport = () => {
    importRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Неверный формат');
        if (!confirm(`Импортировать ${data.length} книг? Текущая библиотека будет ЗАМЕНЕНА.`)) return;
        setBooks(data);
        showToast(`Импортировано ${data.length} книг!`);
      } catch {
        showToast('Ошибка: неверный JSON файл', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter and search
  const filteredBooks = books
    .filter(b => {
      const matchFilter = currentFilter === 'all' || b.status === currentFilter;
      const q = currentSearch.toLowerCase().trim();
      const matchSearch = !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    })
    .sort((a, b) => b.dateAdded - a.dateAdded);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'Все', value: 'all' },
    { label: '✅ Прочитано', value: 'read' },
    { label: '📖 Читаю', value: 'reading' },
    { label: '🔖 Хочу прочитать', value: 'want' },
  ];

  return (
    <div className="w-full px-10 py-10">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="w-12 h-12 max-[600px]:w-10 max-[600px]:h-10" />
          <div>
            <h1 className="text-4xl font-bold tracking-wide max-[600px]:text-3xl" style={{ color: 'var(--heading)' }}>
              Моя библиотека
            </h1>
            <p className="italic" style={{ color: 'var(--text-soft)' }}>Коллекция книг, которые вдохновляют</p>
          </div>
        </div>
        <ThemeToggle isDark={isDark} onToggle={handleToggleTheme} />
      </header>

      {/* Top panels */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-8 mb-8 max-[800px]:grid-cols-1">
        <GoalPanel books={books} goal={goal} onEditGoal={handleEditGoal} />
        <RecPanel books={books} />
      </div>

      {/* Stats */}
      <StatsCards books={books} />

      {/* Controls */}
      <div className="rounded-2xl p-7 mb-8" style={{ background: 'var(--card)', boxShadow: 'var(--shadow)' }}>
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
            placeholder="🔎 Поиск по названию или автору..."
            className="flex-1 min-w-[200px] px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
            style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
          />
          <button
            onClick={handleAddBook}
            className="px-8 py-4 rounded-xl text-base font-semibold cursor-pointer text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--primary)' }}
          >
            + Добавить книгу
          </button>
        </div>
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={handleExport}
            title="Экспорт в JSON"
            className="px-6 py-4 rounded-xl text-lg cursor-pointer transition-all duration-200"
            style={{ background: 'var(--bg-soft)', color: 'var(--text)', border: '2px solid var(--border)', fontStyle: 'italic' }}
          >
            💾 Экспорт
          </button>
          <button
            onClick={handleImport}
            title="Импорт из JSON"
            className="px-6 py-4 rounded-xl text-lg cursor-pointer transition-all duration-200"
            style={{ background: 'var(--bg-soft)', color: 'var(--text)', border: '2px solid var(--border)', fontStyle: 'italic' }}
          >
            📂 Импорт
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          {filterButtons.map(fb => (
            <button
              key={fb.value}
              onClick={() => setCurrentFilter(fb.value)}
              className="px-6 py-3 rounded-full text-sm cursor-pointer transition-all duration-200"
              style={{
                border: '2px solid var(--border)',
                background: currentFilter === fb.value ? 'var(--primary)' : 'transparent',
                color: currentFilter === fb.value ? '#fff' : 'var(--text-soft)',
                borderColor: currentFilter === fb.value ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(450px,1fr))] gap-8 max-[600px]:grid-cols-1">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 col-span-full" style={{ color: 'var(--text-soft)' }}>
            <div className="text-6xl mb-4 opacity-40">📔</div>
            <h3 className="text-xl mb-2" style={{ color: 'var(--text)' }}>
              {books.length === 0 ? 'Библиотека пуста' : 'Ничего не найдено'}
            </h3>
            <p>{books.length === 0 ? 'Добавьте свою первую книгу!' : 'Попробуйте изменить фильтры или поиск'}</p>
          </div>
        ) : (
          filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
              onPageChange={handlePageChange}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <BookModal
          book={modalBook}
          onSave={handleSaveBook}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          isError={toast.isError}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
