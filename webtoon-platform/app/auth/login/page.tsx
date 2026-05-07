'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { authApi } from '@/lib/php-api';
import { useWebtoonStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useWebtoonStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        login(response.data.user);
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950 mb-6">로그인</h1>

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

          <label className="block mb-6">
            <span className="block text-sm font-medium text-gray-700 mb-1">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-60 transition"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-sm text-gray-600 mt-5 text-center">
            계정이 없나요?{' '}
            <Link href="/auth/register" className="text-purple-700 font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
