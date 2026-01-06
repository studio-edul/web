import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { href: '/work', label: 'WORK' },
    { href: '/cv', label: 'CV' },
    { href: '/contact', label: 'CONTACT' },
    { href: '/studio-edul', label: 'STUDIO EDUL' },
  ];

  // index 페이지인 경우 모든 nav-item에 active 스타일 적용
  const isIndexPage = currentPath === '/';

  return (
    <nav className="flex justify-between items-center w-full max-w-[940px] mx-auto mb-[120px] px-[15px]">
      <Link href="/" className="nav-logo">
        2
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${currentPath === item.href || isIndexPage ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

