-- ============================================
-- SQL для настройки базы данных в Supabase
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================

-- Таблица целей чтения
CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Таблица книг
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  status TEXT NOT NULL CHECK (status IN ('read', 'reading', 'want')),
  isbn TEXT,
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  cover_url TEXT,
  date_added BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);

-- Включить RLS (Row Level Security)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

-- Политики: пользователи могут управлять только своими данными
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON reading_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON reading_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON reading_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON reading_goals
  FOR DELETE USING (auth.uid() = user_id);
