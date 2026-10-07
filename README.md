# 📚 Моя библиотека - с Supabase

Приложение для учёта книг с облачным хранилищем данных и аутентификацией пользователей через Supabase.

## 🚀 Быстрый старт

### 1. Создайте проект в Supabase

1. Перейдите на [supabase.com](https://supabase.com) и зарегистрируйтесь
2. Создайте новый проект (бесплатный план)
3. Дождитесь завершения настройки проекта

### 2. Настройте базу данных

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Скопируйте содержимое файла `supabase-schema.sql`
3. Выполните SQL-скрипт (кнопка **Run**)

Это создаст:
- Таблицу `books` для хранения книг
- Таблицу `reading_goals` для целей чтения
- Row Level Security (RLS) политики для безопасности данных

### 3. Получите ключи API

1. Перейдите в **Project Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public key** (длинная строка)

### 4. Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```bash
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш-anon-ключ
```

Или скопируйте `.env.example`:
```bash
cp .env.example .env
```

### 5. Установите зависимости и запустите

```bash
npm install
npm run dev
```

## 🔐 Аутентификация

Приложение использует email/пароль аутентификацию Supabase.

### Включите Email провайдер:

1. В Supabase Dashboard: **Authentication** → **Providers**
2. Убедитесь, что **Email** включен
3. Опционально: отключите **Confirm email** для упрощения тестирования

## 📊 Структура базы данных

### Таблица `books`
- `id` (UUID, primary key)
- `user_id` (UUID, ссылка на auth.users)
- `title` (text) - название книги
- `author` (text) - автор
- `genre` (text) - жанр
- `status` (text) - статус: 'read', 'reading', 'want'
- `isbn` (text) - ISBN для автозагрузки обложки
- `total_pages` (integer) - всего страниц
- `current_page` (integer) - текущая страница
- `rating` (integer, 0-5) - рейтинг
- `cover_url` (text) - URL обложки
- `date_added` (bigint) - дата добавления

### Таблица `reading_goals`
- `id` (UUID, primary key)
- `user_id` (UUID, ссылка на auth.users)
- `year` (integer) - год
- `target` (integer) - цель (количество книг)

## 🔒 Безопасность

- Row Level Security (RLS) включен для всех таблиц
- Пользователи могут управлять только своими данными
- Данные автоматически фильтруются по `user_id`

## 📦 Функции

- ✅ Регистрация и вход пользователей
- ✅ Добавление, редактирование, удаление книг
- ✅ Отслеживание прогресса чтения
- ✅ Рейтинги и жанры
- ✅ Цель чтения на год
- ✅ Поиск и фильтрация
- ✅ Экспорт/импорт в JSON
- ✅ Автозагрузка обложек по ISBN
- ✅ Светлая/тёмная тема
- ✅ Облачное хранение данных

## 🛠 Технологии

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Marck Script (Google Fonts)

## 📝 Примечания

- Бесплатный план Supabase: 500MB база данных, 50,000 активных пользователей
- Данные синхронизируются в реальном времени
- При обновлении страницы данные не теряются
