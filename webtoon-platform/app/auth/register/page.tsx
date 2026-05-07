'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { authApi } from '@/lib/php-api';
import { useWebtoonStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useWebtoonStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authApi.register({
        email,
        username,
        password,
        role: isAuthor ? 'AUTHOR' : 'USER',
      });

      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        login(response.data.user);
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950 mb-6">회원가입</h1>

          {error && <p className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">{error}</p>}

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">닉네임</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              minLength={3}
            />
          </label>

          <label className="block mb-6">
            <span className="block text-sm font-medium text-gray-700 mb-1">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              minLength={8}
            />
          </label>

          <label className="flex items-center gap-2 mb-6 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isAuthor}
              onChange={(event) => setIsAuthor(event.target.checked)}
              className="w-4 h-4 accent-purple-600"
            />
            작가 계정으로 가입
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-60 transition"
          >
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>

          <p className="text-sm text-gray-600 mt-5 text-center">
            이미 계정이 있나요?{' '}
            <Link href="/auth/login" className="text-purple-700 font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
