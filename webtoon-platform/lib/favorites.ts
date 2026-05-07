const legacyFavoriteKey = 'favorite_webtoons';
export const favoriteNotificationChangedEvent = 'favorite-notifications-changed';

export interface FavoriteNotification {
  id: string;
  webtoonId: string;
  webtoonTitle: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  createdAt: string;
  readAt?: string;
}

export function readFavoriteIds(userId: string): string[] {
  return readIds(favoriteKey(userId));
}

export function writeFavoriteIds(userId: string, ids: string[]): void {
  localStorage.setItem(favoriteKey(userId), JSON.stringify(uniqueIds(ids)));
}

export function readFavoriteLastSeenEpisode(userId: string, webtoonId: string): number | null {
  const value = Number(localStorage.getItem(favoriteEpisodeKey(userId, webtoonId)));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function writeFavoriteLastSeenEpisode(userId: string, webtoonId: string, episodeNumber: number): void {
  localStorage.setItem(favoriteEpisodeKey(userId, webtoonId), String(Math.max(episodeNumber, 0)));
}

export function readFavoriteNotifications(userId: string): FavoriteNotification[] {
  try {
    const value = JSON.parse(localStorage.getItem(favoriteNotificationKey(userId)) || '[]');

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(isFavoriteNotification);
  } catch {
    localStorage.removeItem(favoriteNotificationKey(userId));
    return [];
  }
}

export function addFavoriteNotification(
  userId: string,
  notification: Omit<FavoriteNotification, 'id' | 'createdAt'>
): FavoriteNotification[] {
  const current = readFavoriteNotifications(userId);
  const id = `${notification.webtoonId}:${notification.episodeId}`;
  const nextNotification: FavoriteNotification = {
    ...notification,
    id,
    createdAt: new Date().toISOString(),
  };
  const next = [nextNotification, ...current.filter((item) => item.id !== id)].slice(0, 30);

  localStorage.setItem(favoriteNotificationKey(userId), JSON.stringify(next));
  window.dispatchEvent(new Event(favoriteNotificationChangedEvent));

  return next;
}

export function markFavoriteNotificationsRead(userId: string): FavoriteNotification[] {
  const readAt = new Date().toISOString();
  const next = readFavoriteNotifications(userId).map((notification) => ({
    ...notification,
    readAt: notification.readAt || readAt,
  }));

  localStorage.setItem(favoriteNotificationKey(userId), JSON.stringify(next));
  window.dispatchEvent(new Event(favoriteNotificationChangedEvent));

  return next;
}

export function migrateLegacyFavoriteIds(userId: string): string[] {
  const key = favoriteKey(userId);
  const currentIds = readIds(key);
  const legacyIds = readIds(legacyFavoriteKey);

  if (legacyIds.length === 0) {
    return currentIds;
  }

  const mergedIds = uniqueIds([...currentIds, ...legacyIds]);
  localStorage.setItem(key, JSON.stringify(mergedIds));
  localStorage.removeItem(legacyFavoriteKey);

  return mergedIds;
}

function favoriteKey(userId: string): string {
  return `favorite_webtoons:${userId}`;
}

function favoriteEpisodeKey(userId: string, webtoonId: string): string {
  return `favorite_webtoon_last_seen_episode:${userId}:${webtoonId}`;
}

function favoriteNotificationKey(userId: string): string {
  return `favorite_webtoon_notifications:${userId}`;
}

function isFavoriteNotification(value: unknown): value is FavoriteNotification {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === 'string' &&
    typeof item.webtoonId === 'string' &&
    typeof item.webtoonTitle === 'string' &&
    typeof item.episodeId === 'string' &&
    typeof item.episodeNumber === 'number' &&
    typeof item.episodeTitle === 'string' &&
    typeof item.createdAt === 'string' &&
    (item.readAt === undefined || typeof item.readAt === 'string')
  );
}

function readIds(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? uniqueIds(value.filter((item): item is string => typeof item === 'string')) : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
