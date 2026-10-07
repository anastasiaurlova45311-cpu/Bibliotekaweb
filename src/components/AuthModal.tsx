import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message === 'User already registered' ? 'Пользователь уже зарегистрирован' : error.message);
      } else {
        setSuccess('Письмо для подтверждения отправлено на вашу почту! Проверьте inbox.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Неверный email или пароль');
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-5 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-[20px] p-7 w-full max-w-[420px] animate-slide-up"
        style={{ background: 'var(--card)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <h2 className="text-2xl mb-5 font-semibold text-center" style={{ color: 'var(--heading)' }}>
          {isSignUp ? '📝 Регистрация' : '🔑 Вход'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(192,57,43,0.15)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(74,124,89,0.15)', color: 'var(--accent-green)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
              style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
            />
          </div>
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Минимум 6 символов"
              className="w-full px-3.5 py-2.5 rounded-xl text-base transition-all duration-200 outline-none"
              style={{ border: '2px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-soft)'; }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 rounded-xl text-base font-semibold cursor-pointer text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="mt-5 text-center text-sm" style={{ color: 'var(--text-soft)' }}>
          {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            className="ml-2 font-semibold cursor-pointer bg-transparent border-none"
            style={{ color: 'var(--primary)' }}
          >
            {isSignUp ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-5 py-3 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200"
          style={{ background: 'var(--bg-soft)', color: 'var(--text)', border: '2px solid var(--border)' }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
