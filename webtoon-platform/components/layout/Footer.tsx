import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h3 className="font-bold text-white mb-3">Webtoon</h3>
            <p className="text-sm max-w-md">
              웹툰을 검색하고, 에피소드를 읽고, 댓글로 독자들과 이야기하는 플랫폼입니다.
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <Link href="/webtoons" className="hover:text-white transition">
              웹툰
            </Link>
            <Link href="/webtoons?status=ongoing" className="hover:text-white transition">
              연재중
            </Link>
            <Link href="/webtoons?status=completed" className="hover:text-white transition">
              완결
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-center text-sm">&copy; 2026 Webtoon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
