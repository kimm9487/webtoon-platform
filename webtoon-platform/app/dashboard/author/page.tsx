'use client';

import Link from 'next/link';
import { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { authorApi, AuthorDashboard, AuthorWebtoon, EpisodePayload, WebtoonPayload } from '@/lib/php-api';
import { episodeApi } from '@/lib/api';
import { mediaUrl } from '@/lib/media-url';
import { Episode } from '@/lib/types';
import { useWebtoonStore } from '@/lib/store';

const emptyWebtoon: WebtoonPayload = {
  title: '',
  description: '',
  thumbnail: '',
  genre: [],
  status: 'ongoing',
};

const emptyEpisode: EpisodePayload = {
  episodeNumber: 1,
  title: '',
  description: '',
  images: [],
};

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

export default function AuthorDashboardPage() {
  const { user, setUser } = useWebtoonStore();
  const [dashboard, setDashboard] = useState<AuthorDashboard | null>(null);
  const [selectedWebtoonId, setSelectedWebtoonId] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [webtoonForm, setWebtoonForm] = useState<WebtoonPayload>(emptyWebtoon);
  const [episodeForm, setEpisodeForm] = useState<EpisodePayload>(emptyEpisode);
  const [editingWebtoonId, setEditingWebtoonId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingEpisodeImages, setUploadingEpisodeImages] = useState(false);

  const selectedWebtoon = useMemo(
    () => dashboard?.webtoons.find((webtoon) => webtoon.id === selectedWebtoonId),
    [dashboard, selectedWebtoonId]
  );

  const loadDashboard = async () => {
    setError('');

    try {
      const response = await authorApi.dashboard();

      if (response.success && response.data) {
        setDashboard(response.data);
        setSelectedWebtoonId((current) => current || response.data!.webtoons[0]?.id || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '작가 대시보드를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      const timer = window.setTimeout(() => {
        setError('로그인이 필요합니다.');
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (!user) {
      import('@/lib/php-api').then(({ authApi }) => {
        authApi.me().then((response) => {
          if (response.success && response.data) {
            setUser(response.data);
          }
        });
      });
    }

    const timer = window.setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!selectedWebtoonId) {
        setEpisodes([]);
        return;
      }

      const response = await episodeApi.getByWebtoonId(selectedWebtoonId);
      if (response.success && response.data) {
        setEpisodes(response.data);
      }
    };

    loadEpisodes().catch((err) => {
      setError(err instanceof Error ? err.message : '에피소드를 불러오지 못했습니다.');
    });
  }, [selectedWebtoonId]);

  const uploadOne = async (file: File, type: 'thumbnails' | 'episodes') => {
    if (!allowedImageTypes.includes(file.type)) {
      throw new Error('JPG, PNG, GIF 파일만 업로드할 수 있습니다.');
    }

    const response = await authorApi.uploadFile(file, type);

    if (!response.success || !response.data) {
      throw new Error(response.error || '이미지 업로드에 실패했습니다.');
    }

    return response.data.path;
  };

  const handleThumbnailFiles = async (files: File[]) => {
    const file = files[0];

    if (!file) {
      return;
    }

    try {
      setUploadingThumbnail(true);
      setError('');
      const url = await uploadOne(file, 'thumbnails');
      setWebtoonForm((current) => ({ ...current, thumbnail: url }));
      setMessage('썸네일 이미지를 업로드했습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '썸네일 업로드에 실패했습니다.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleEpisodeImageFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    try {
      setUploadingEpisodeImages(true);
      setError('');
      const urls: string[] = [];

      for (const file of files) {
        urls.push(await uploadOne(file, 'episodes'));
      }

      setEpisodeForm((current) => ({
        ...current,
        images: [...current.images, ...urls],
      }));
      setMessage('에피소드 이미지를 업로드했습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '에피소드 이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingEpisodeImages(false);
    }
  };

  const handleWebtoonSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!webtoonForm.thumbnail) {
      setError('썸네일 이미지를 업로드해 주세요.');
      return;
    }

    try {
      if (editingWebtoonId) {
        await authorApi.updateWebtoon(editingWebtoonId, webtoonForm);
        setMessage('웹툰을 수정했습니다.');
      } else {
        const response = await authorApi.createWebtoon(webtoonForm);
        setSelectedWebtoonId(response.data?.id || '');
        setMessage('웹툰을 업로드했습니다.');
      }

      setWebtoonForm(emptyWebtoon);
      setEditingWebtoonId(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : '웹툰 저장에 실패했습니다.');
    }
  };

  const handleEditWebtoon = (webtoon: AuthorWebtoon) => {
    setEditingWebtoonId(webtoon.id);
    setWebtoonForm({
      title: webtoon.title,
      description: webtoon.description,
      thumbnail: webtoon.thumbnail,
      genre: webtoon.genre,
      status: webtoon.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteWebtoon = async (id: string) => {
    if (!confirm('이 웹툰과 모든 에피소드를 삭제할까요?')) {
      return;
    }

    await authorApi.deleteWebtoon(id);
    setMessage('웹툰을 삭제했습니다.');
    setSelectedWebtoonId('');
    await loadDashboard();
  };

  const handleEpisodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedWebtoonId) {
      setError('먼저 웹툰을 선택하세요.');
      return;
    }

    if (episodeForm.images.length === 0) {
      setError('에피소드 이미지를 1개 이상 업로드해 주세요.');
      return;
    }

    try {
      await authorApi.createEpisode(selectedWebtoonId, episodeForm);
      setEpisodeForm({
        ...emptyEpisode,
        episodeNumber: episodeForm.episodeNumber + 1,
      });
      setMessage('에피소드를 업로드했습니다.');
      const response = await episodeApi.getByWebtoonId(selectedWebtoonId);
      if (response.success && response.data) {
        setEpisodes(response.data);
      }
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : '에피소드 업로드에 실패했습니다.');
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm('이 에피소드를 삭제할까요?')) {
      return;
    }

    await authorApi.deleteEpisode(id);
    setEpisodes((current) => current.filter((episode) => episode.id !== id));
    setMessage('에피소드를 삭제했습니다.');
    await loadDashboard();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-purple-700 font-semibold">Author</p>
            <h1 className="text-4xl font-bold text-gray-950">작가 대시보드</h1>
            <p className="text-gray-600 mt-2">
              웹툰과 에피소드를 업로드하고 관리할 수 있습니다.
            </p>
          </div>
          <Link href="/webtoons" className="text-purple-700 font-semibold hover:underline">
            공개 목록 보기
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}{' '}
            {error.includes('로그인') && (
              <Link href="/auth/login" className="font-semibold underline">
                로그인하기
              </Link>
            )}
          </div>
        )}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {message}
          </div>
        )}

        {dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Stat label="웹툰" value={dashboard.stats.webtoonCount} />
              <Stat label="에피소드" value={dashboard.stats.episodeCount} />
              <Stat label="총 조회수" value={dashboard.stats.views.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-950 mb-5">
                  {editingWebtoonId ? '웹툰 수정' : '새 웹툰 업로드'}
                </h2>
                <form onSubmit={handleWebtoonSubmit} className="space-y-4">
                  <TextInput
                    label="제목"
                    value={webtoonForm.title}
                    onChange={(value) => setWebtoonForm({ ...webtoonForm, title: value })}
                  />
                  <ImageUploader
                    label="썸네일 이미지"
                    multiple={false}
                    isUploading={uploadingThumbnail}
                    onFiles={handleThumbnailFiles}
                  />
                  {webtoonForm.thumbnail && (
                    <ImagePreview
                      urls={[webtoonForm.thumbnail]}
                      onRemove={() => setWebtoonForm({ ...webtoonForm, thumbnail: '' })}
                    />
                  )}
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">설명</span>
                    <textarea
                      value={webtoonForm.description}
                      onChange={(event) => setWebtoonForm({ ...webtoonForm, description: event.target.value })}
                      className="w-full min-h-28 border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </label>
                  <TextInput
                    label="장르"
                    value={webtoonForm.genre.join(', ')}
                    onChange={(value) =>
                      setWebtoonForm({
                        ...webtoonForm,
                        genre: value.split(',').map((item) => item.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Fantasy, Action"
                  />
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">상태</span>
                    <select
                      value={webtoonForm.status}
                      onChange={(event) =>
                        setWebtoonForm({ ...webtoonForm, status: event.target.value as WebtoonPayload['status'] })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="ongoing">연재중</option>
                      <option value="completed">완결</option>
                      <option value="hiatus">휴재</option>
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 transition">
                      {editingWebtoonId ? '수정 저장' : '업로드'}
                    </button>
                    {editingWebtoonId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWebtoonId(null);
                          setWebtoonForm(emptyWebtoon);
                        }}
                        className="border border-gray-300 px-5 py-2 rounded-md font-semibold hover:bg-gray-50 transition"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-950 mb-5">에피소드 업로드</h2>
                <form onSubmit={handleEpisodeSubmit} className="space-y-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">웹툰 선택</span>
                    <select
                      value={selectedWebtoonId}
                      onChange={(event) => setSelectedWebtoonId(event.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">웹툰 선택</option>
                      {dashboard.webtoons.map((webtoon) => (
                        <option key={webtoon.id} value={webtoon.id}>
                          {webtoon.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextInput
                    label="회차"
                    type="number"
                    value={String(episodeForm.episodeNumber)}
                    onChange={(value) => setEpisodeForm({ ...episodeForm, episodeNumber: Number(value) })}
                  />
                  <TextInput
                    label="제목"
                    value={episodeForm.title}
                    onChange={(value) => setEpisodeForm({ ...episodeForm, title: value })}
                  />
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">설명</span>
                    <textarea
                      value={episodeForm.description}
                      onChange={(event) => setEpisodeForm({ ...episodeForm, description: event.target.value })}
                      className="w-full min-h-20 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </label>
                  <ImageUploader
                    label="에피소드 이미지"
                    multiple
                    isUploading={uploadingEpisodeImages}
                    onFiles={handleEpisodeImageFiles}
                  />
                  {episodeForm.images.length > 0 && (
                    <ImagePreview
                      urls={episodeForm.images}
                      onRemove={(url) =>
                        setEpisodeForm({
                          ...episodeForm,
                          images: episodeForm.images.filter((image) => image !== url),
                        })
                      }
                    />
                  )}
                  <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-indigo-700 transition">
                    에피소드 업로드
                  </button>
                </form>
              </section>
            </div>

            <section className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-950 mb-5">내 웹툰</h2>
              <div className="space-y-3">
                {dashboard.webtoons.length > 0 ? (
                  dashboard.webtoons.map((webtoon) => (
                    <div key={webtoon.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        {webtoon.thumbnail && (
                          <img
                            src={mediaUrl(webtoon.thumbnail)}
                            alt=""
                            className="w-14 h-20 object-cover rounded-md border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-bold text-gray-950">{webtoon.title}</p>
                          <p className="text-sm text-gray-600">
                            {webtoon.status} · 에피소드 {webtoon.episodeCount}개 · 조회 {Number(webtoon.views).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleEditWebtoon(webtoon)} className="border border-gray-300 px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-50">
                          수정
                        </button>
                        <button onClick={() => handleDeleteWebtoon(webtoon.id)} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-700">
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">아직 업로드한 웹툰이 없습니다.</p>
                )}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-950 mb-2">{selectedWebtoon?.title || '선택한 웹툰'} 에피소드</h2>
              <div className="space-y-3 mt-5">
                {episodes.length > 0 ? (
                  episodes.map((episode) => (
                    <div key={episode.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        {episode.images[0] && (
                          <img
                            src={mediaUrl(episode.images[0])}
                            alt=""
                            className="w-16 h-20 object-cover rounded-md border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{episode.episodeNumber}화 {episode.title}</p>
                          <p className="text-sm text-gray-600">조회 {episode.views.toLocaleString()} · 좋아요 {episode.likes.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/episodes/${episode.id}`} className="border border-gray-300 px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-50">
                          보기
                        </Link>
                        <button onClick={() => handleDeleteEpisode(episode.id)} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-700">
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">선택한 웹툰에 에피소드가 없습니다.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-gray-950 mt-1">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2"
        required
      />
    </label>
  );
}

function ImageUploader({
  label,
  multiple,
  isUploading,
  onFiles,
}: {
  label: string;
  multiple: boolean;
  isUploading: boolean;
  onFiles: (files: File[]) => void;
}) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="block border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition"
    >
      <span className="block text-sm font-semibold text-gray-800">{label}</span>
      <span className="block text-sm text-gray-500 mt-1">
        JPG, PNG, GIF 파일을 드래그하거나 클릭해서 선택
      </span>
      <span className="block text-xs text-gray-400 mt-1">
        {multiple ? '여러 파일 업로드 가능' : '파일 1개만 업로드'}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        multiple={multiple}
        disabled={isUploading}
        onChange={(event) => onFiles(Array.from(event.target.files || []))}
        className="sr-only"
      />
      {isUploading && <span className="block text-sm text-purple-700 mt-3">업로드 중...</span>}
    </label>
  );
}

function ImagePreview({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {urls.map((url) => (
        <div key={url} className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img src={mediaUrl(url)} alt="" className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => onRemove(url)}
            className="absolute top-2 right-2 bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-xs font-semibold shadow-sm hover:bg-gray-50"
          >
            제거
          </button>
        </div>
      ))}
    </div>
  );
}
