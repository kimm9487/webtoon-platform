import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
});

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'author1@example.com' },
    update: {},
    create: {
      email: 'author1@example.com',
      username: 'author_one',
      password: 'hashedpassword',
      role: 'AUTHOR',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'author2@example.com' },
    update: {},
    create: {
      email: 'author2@example.com',
      username: 'author_two',
      password: 'hashedpassword',
      role: 'AUTHOR',
    },
  });

  const author1 = await prisma.author.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      name: 'Author One',
      bio: 'Sample webtoon author.',
    },
  });

  const author2 = await prisma.author.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      name: 'Author Two',
      bio: 'Another sample webtoon author.',
    },
  });

  const webtoon1 = await prisma.webtoon.upsert({
    where: { id: 'sample-tower' },
    update: {},
    create: {
      id: 'sample-tower',
      title: 'Tower Adventure',
      authorId: author1.id,
      description: 'A young hero climbs a mysterious tower filled with trials.',
      thumbnail: 'https://via.placeholder.com/300x400?text=Tower+Adventure',
      genre: ['Fantasy', 'Action', 'Adventure'],
      status: 'ONGOING',
      rating: 4.8,
      views: 5000000,
    },
  });

  await prisma.webtoon.upsert({
    where: { id: 'sample-highschool' },
    update: {},
    create: {
      id: 'sample-highschool',
      title: 'High School Battle',
      authorId: author1.id,
      description: 'Students face a tournament where every fight reveals a secret.',
      thumbnail: 'https://via.placeholder.com/300x400?text=High+School+Battle',
      genre: ['Action', 'Fantasy', 'School'],
      status: 'COMPLETED',
      rating: 4.7,
      views: 3000000,
    },
  });

  await prisma.webtoon.upsert({
    where: { id: 'sample-noblesse' },
    update: {},
    create: {
      id: 'sample-noblesse',
      title: 'Noble Night',
      authorId: author2.id,
      description: 'An ancient noble awakens in the modern world.',
      thumbnail: 'https://via.placeholder.com/300x400?text=Noble+Night',
      genre: ['Fantasy', 'Action', 'Supernatural'],
      status: 'COMPLETED',
      rating: 4.6,
      views: 2500000,
    },
  });

  await prisma.episode.upsert({
    where: {
      webtoonId_episodeNumber: {
        webtoonId: webtoon1.id,
        episodeNumber: 1,
      },
    },
    update: {},
    create: {
      webtoonId: webtoon1.id,
      episodeNumber: 1,
      title: 'Episode 1',
      description: 'The journey begins.',
      images: ['https://via.placeholder.com/800x1200?text=Episode+1'],
      views: 100000,
    },
  });

  await prisma.episode.upsert({
    where: {
      webtoonId_episodeNumber: {
        webtoonId: webtoon1.id,
        episodeNumber: 2,
      },
    },
    update: {},
    create: {
      webtoonId: webtoon1.id,
      episodeNumber: 2,
      title: 'Episode 2',
      description: 'The first trial.',
      images: ['https://via.placeholder.com/800x1200?text=Episode+2'],
      views: 95000,
    },
  });
}

main()
  .then(() => {
    console.log('Seed data inserted.');
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
