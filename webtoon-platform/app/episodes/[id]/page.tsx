'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useWebtoonStore } from '@/lib/store';
import { episodeApi } from '@/lib/api';
import { CommentItem, authApi, commentApi } from '@/lib/php-api';
import { readEpisodeLiked, writeEpisodeLiked } from '@/lib/episode-likes';

export default function EpisodeViewPage() {
  const params = useParams();
  const id = params.id as string;
  const commentsRef = useRef<HTMLDivElement>(null);
  const { selectedEpisode, setSelectedEpisode, isLoading, setIsLoading, user, setUser } = useWebtoonStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        setIsLoading(true);
        const response = await episodeApi.getById(id);
        if (response.success && response.data) {
          setSelectedEpisode(response.data);
          setLocalLikes(response.data.likes);
        }
      } catch (error) {
        console.error('Failed to fetch episode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisode();
  }, [id, setSelectedEpisode, setIsLoading]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token || user) {
      return;
    }

    authApi
      .me()
      .then((response) => {
        if (response.success && response.data) {
          setUser(response.data);
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
      });
  }, [setUser, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!user) {
        setIsLiked(false);
        return;
      }

      setIsLiked(readEpisodeLiked(user.id, id));
      episodeApi
        .getLike(id)
        .then((response) => {
          if (response.success && response.data) {
            writeEpisodeLiked(user.id, id, response.data.liked);
            setIsLiked(response.data.liked);
          }
        })
        .catch(() => {
          // Keep the local fallback if the liked-state request fails.
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [id, user]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await commentApi.getByEpisode(id);
        if (response.success && response.data) {
          setComments(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    if (id) fetchComments();
  }, [id]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!localStorage.getItem('auth_token')) {
      setError('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await commentApi.create({ episodeId: id, content });

      if (response.success && response.data) {
        setComments((current) => [response.data!, ...current]);
        setContent('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.delete(commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.');
    }
  };

  const handleLike = async () => {
    setError('');

    if (!user) {
      setError('좋아요를 저장하려면 로그인이 필요합니다.');
      return;
    }

    const nextLiked = !isLiked;

    try {
      setIsLikeSubmitting(true);
      const response = await episodeApi.setLike(id, nextLiked);

      if (response.success && response.data) {
        writeEpisodeLiked(user.id, id, nextLiked);
        setIsLiked(nextLiked);
        setLocalLikes(response.data.likes);
        setSelectedEpisode(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '좋아요 저장에 실패했습니다.');
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedEpisode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <p className="text-gray-600 text-lg">에피소드를 찾을 수 없습니다.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Header />

      <main className="flex-grow py-8">
        <div className="bg-gray-900 text-white py-4 mb-8 border-y border-gray-800">
          <div className="max-w-5xl mx-auto px-4">
            <p className="text-gray-400">{selectedEpisode.episodeNumber}화</p>
            <h1 className="text-3xl font-bold">{selectedEpisode.title}</h1>
            <p className="text-gray-400 mt-2">{selectedEpisode.description}</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="space-y-4">
            {selectedEpisode.images.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`${selectedEpisode.title} ${index + 1}`}
                className="w-full rounded-lg shadow-lg bg-gray-800"
              />
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="bg-gray-900 text-white p-4 rounded-lg flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLikeSubmitting}
              className={`relative flex-1 px-4 py-3 rounded-md font-semibold text-transparent transition disabled:opacity-60 ${
                isLiked ? 'bg-pink-600 hover:bg-pink-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-white">
                {isLiked ? '좋아요 취소' : '좋아요'} {localLikes}
              </span>
              좋아요 {localLikes}
            </button>
            <button
              type="button"
              onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-md font-semibold transition"
            >
              댓글 {comments.length}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-md font-semibold transition"
            >
              {copied ? '복사됨' : '공유'}
            </button>
          </div>
        </div>

        <div ref={commentsRef} className="max-w-5xl mx-auto px-4 mb-8">
          <section className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-950 mb-4">댓글</h2>
            {error && <p className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">{error}</p>}

            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="감상을 남겨보세요"
                className="w-full min-h-28 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-500">
                  {user ? `${user.username}으로 작성 중` : '로그인 후 댓글을 작성할 수 있습니다.'}
                </p>
                {user ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 disabled:opacity-60 transition"
                  >
                    {isSubmitting ? '등록 중...' : '댓글 등록'}
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 transition"
                  >
                    로그인
                  </Link>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <article key={comment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-gray-950">{comment.username}</p>
                        <p className="text-xs text-gray-500">{comment.createdAt}</p>
                      </div>
                      {user?.id === comment.userId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </article>
                ))
              ) : (
                <p className="text-gray-600">아직 댓글이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
