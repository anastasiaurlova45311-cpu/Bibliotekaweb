import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Book {
  id: string;
  user_id?: string;
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

interface DbBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: string | null;
  status: 'read' | 'reading' | 'want';
  isbn: string | null;
  total_pages: number | null;
  current_page: number | null;
  rating: number | null;
  cover_url: string | null;
  date_added: number;
}

function dbToBook(db: DbBook): Book {
  return {
    id: db.id,
    title: db.title,
    author: db.author,
    genre: db.genre || '',
    status: db.status,
    isbn: db.isbn || '',
    totalPages: db.total_pages,
    currentPage: db.current_page || 0,
    rating: db.rating || 0,
    coverUrl: db.cover_url,
    dateAdded: db.date_added,
  };
}

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('date_added', { ascending: false });

    if (!error && data) {
      setBooks((data as DbBook[]).map(dbToBook));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBook = async (book: Omit<Book, 'id'>): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: book.title,
        author: book.author,
        genre: book.genre || null,
        status: book.status,
        isbn: book.isbn || null,
        total_pages: book.totalPages,
        current_page: book.currentPage,
        rating: book.rating || null,
        cover_url: book.coverUrl,
        date_added: book.dateAdded,
      })
      .select()
      .single();

    if (!error && data) {
      const newBook = dbToBook(data as DbBook);
      setBooks(prev => [newBook, ...prev]);
      return newBook.id;
    }
    return null;
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    if (!user) return;
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.genre !== undefined) dbUpdates.genre = updates.genre || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.isbn !== undefined) dbUpdates.isbn = updates.isbn || null;
    if (updates.totalPages !== undefined) dbUpdates.total_pages = updates.totalPages;
    if (updates.currentPage !== undefined) dbUpdates.current_page = updates.currentPage;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating || null;
    if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;

    const { error } = await supabase
      .from('books')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }
  };

  const deleteBook = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const importBooks = async (newBooks: Book[]) => {
    if (!user) return;
    // Удаляем старые книги
    await supabase.from('books').delete().eq('user_id', user.id);
    // Добавляем новые
    const toInsert = newBooks.map(b => ({
      user_id: user.id,
      title: b.title,
      author: b.author,
      genre: b.genre || null,
      status: b.status,
      isbn: b.isbn || null,
      total_pages: b.totalPages,
      current_page: b.currentPage,
      rating: b.rating || null,
      cover_url: b.coverUrl,
      date_added: b.dateAdded,
    }));
    const { data, error } = await supabase.from('books').insert(toInsert).select();
    if (!error && data) {
      setBooks((data as DbBook[]).map(dbToBook));
    }
  };

  return { books, loading, addBook, updateBook, deleteBook, importBooks, fetchBooks };
}

export function useGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(12);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  const fetchGoal = useCallback(async () => {
    if (!user) {
      setGoal(12);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_goals')
      .select('target')
      .eq('user_id', user.id)
      .eq('year', year)
      .single();

    if (!error && data) {
      setGoal(data.target);
    } else {
      setGoal(12);
    }
    setLoading(false);
  }, [user, year]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const saveGoal = async (target: number) => {
    if (!user) return;
    setGoal(target);
    const { error } = await supabase
      .from('reading_goals')
      .upsert({ user_id: user.id, year, target }, { onConflict: 'user_id,year' });

    if (error) console.error('Goal save error:', error);
  };

  return { goal, loading, saveGoal };
}
