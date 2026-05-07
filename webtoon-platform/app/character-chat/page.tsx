'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CharacterPreset, getAllCharacters } from '@/lib/characterPresets';
import { CharacterChatModelKey, characterChatModelOptions } from '@/lib/characterChatModels';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

const characters = getAllCharacters();
const modelOptions = characterChatModelOptions();
const modelPreferenceKey = 'character_chat_model_key';

export default function CharacterChatPage() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterPreset>(characters[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedModelKey, setSelectedModelKey] = useState<CharacterChatModelKey>('default');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedModelKey = localStorage.getItem(modelPreferenceKey);

      if (savedModelKey === 'default' || savedModelKey === 'characterCreator') {
        setSelectedModelKey(savedModelKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem('auth_token');
      setIsLoggedIn(Boolean(token));

      if (!token) {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
      }

      try {
        setIsHistoryLoading(true);
        setError('');
        const response = await fetch(`/api/character-chat?characterId=${selectedCharacter.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || '대화 기록을 불러오지 못했습니다.');
        }

        setMessages(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '대화 기록을 불러오지 못했습니다.');
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedCharacter.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSelectCharacter = (character: CharacterPreset) => {
    setSelectedCharacter(character);
    setError('');
  };

  const handleSelectModel = (modelKey: CharacterChatModelKey) => {
    setSelectedModelKey(modelKey);
    localStorage.setItem(modelPreferenceKey, modelKey);
    setError('');
  };

  const handleDeleteHistory = async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setIsLoggedIn(false);
      setError('로그인 후 대화 기록을 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm(
      `${selectedCharacter.name}와의 이전 대화 기록을 모두 삭제할까요? 삭제하면 처음부터 다시 대화하게 됩니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingHistory(true);
      setError('');
      const response = await fetch(`/api/character-chat?characterId=${selectedCharacter.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '대화 기록 삭제에 실패했습니다.');
      }

      setMessages([]);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '대화 기록 삭제에 실패했습니다.');
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    const token = localStorage.getItem('auth_token');

    if (!token) {
      setIsLoggedIn(false);
      setError('로그인 후 캐릭터 채팅을 사용할 수 있습니다.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/character-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          message: userMessage.content,
          modelKey: selectedModelKey,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '응답 생성에 실패했습니다.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.data.message,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅 응답을 받을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-950">캐릭터 채팅</h1>
        </div>

        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6">
            대화 기록 저장과 동기화를 사용하려면 로그인이 필요합니다.{' '}
            <Link href="/auth/login" className="font-semibold underline">
              로그인하기
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <aside className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-950 mb-5">캐릭터 선택</h2>

            <div className="space-y-3">
              {characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => handleSelectCharacter(character)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${
                    selectedCharacter.id === character.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                    {character.avatar}
                  </span>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        selectedCharacter.id === character.id ? 'text-purple-700' : 'text-gray-900'
                      }`}
                    >
                      {character.name}
                    </p>
                    <p className="text-xs text-gray-500">{character.series}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                  {selectedCharacter.avatar}
                </span>
                <div>
                  <p className="font-semibold text-gray-950">{selectedCharacter.name}</p>
                  <p className="text-xs text-gray-500">{selectedCharacter.series}</p>
                </div>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {selectedCharacter.personality}
              </p>
            </div>
          </aside>

          <section className="bg-white border border-gray-200 rounded-lg h-[640px] max-h-[calc(100vh-180px)] min-h-[520px] flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                  {selectedCharacter.avatar}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-950">{selectedCharacter.name}</h2>
                  <p className="text-sm text-gray-600">{selectedCharacter.series}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {isLoggedIn ? '기록 저장 중' : '로그인 필요'}
                </span>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="hidden sm:inline">모델</span>
                  <select
                    value={selectedModelKey}
                    onChange={(event) => handleSelectModel(event.target.value as CharacterChatModelKey)}
                    disabled={isLoading}
                    className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                    title={modelOptions.find((option) => option.key === selectedModelKey)?.description}
                  >
                    {modelOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleDeleteHistory}
                  disabled={!isLoggedIn || isHistoryLoading || isLoading || isDeletingHistory}
                  className="border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs font-semibold hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                >
                  {isDeletingHistory ? '삭제 중...' : '기록 삭제'}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-5 overflow-y-auto space-y-4">
              {isHistoryLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  대화 기록을 불러오는 중...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  <div>
                    <p className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mx-auto mb-3">
                      {selectedCharacter.avatar}
                    </p>
                    <p className="font-semibold text-gray-700 mb-1">
                      {selectedCharacter.name}에게 말을 걸어보세요
                    </p>
                    <p className="text-sm text-gray-400">
                      대화는 로그인 계정에 저장됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex items-end gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-1">
                        {selectedCharacter.avatar}
                      </span>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold mb-1">
                    {selectedCharacter.avatar}
                  </span>
                  <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                    생각 중...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <p className="mx-5 mb-3 bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="border-t border-gray-200 p-5 flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`${selectedCharacter.name}에게 말을 걸어보세요`}
                className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={isLoading || !isLoggedIn || isDeletingHistory}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !isLoggedIn || isDeletingHistory}
                className="bg-purple-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-60 transition text-sm"
              >
                보내기
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
