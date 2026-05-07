export function readEpisodeLiked(userId: string, episodeId: string): boolean {
  return localStorage.getItem(episodeLikeKey(userId, episodeId)) === '1';
}

export function writeEpisodeLiked(userId: string, episodeId: string, liked: boolean): void {
  if (liked) {
    localStorage.setItem(episodeLikeKey(userId, episodeId), '1');
    return;
  }

  localStorage.removeItem(episodeLikeKey(userId, episodeId));
}

function episodeLikeKey(userId: string, episodeId: string): string {
  return `liked_episode:${userId}:${episodeId}`;
}
