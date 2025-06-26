'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const menuItems = [
  {
    title: 'Dashboard',
    children: [
      { label: 'View Tutor Request', href: '/admin/tutor-request' },
      { label: 'Add Tutoring Package', href: '/admin/tutoring-package' },
      { label: 'Insert Tutor', href: '/admin/insert-tutor' },
      { label: 'Insert Course', href: '/admin/insert-course' },
    ],
  },
  {
    title: 'Content Management',
    children: [
      { label: 'Content List', href: '/admin/content-list' },
      { label: 'Add new content', href: '/admin/add-content' },
    ],
  },
  {
    title: 'User Management',
    children: [
      { label: 'Student List', href: '/admin/student-list' },
      { label: 'Tutor List', href: '/admin/tutor-list' },
    ],
  },
  {
    title: 'Question Management',
    children: [
      { label: 'Courses', href: '/admin/courses' },
      { label: 'Questions', href: '/admin/questions' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <aside className="bg-dark text-white vh-100" style={{ width: '250px', overflowY: 'auto' }}>
      <div className="p-3 border-bottom">
        <strong>Admin Panel</strong>
      </div>
      <ul className="nav flex-column">
        {menuItems.map(({ title, children }) => (
          <li className="nav-item" key={title}>
            <button
              className="btn text-start w-100 text-white px-3 py-2 d-flex justify-content-between align-items-center"
              onClick={() => toggleMenu(title)}
            >
              <span>{title}</span>
              <i className={`bi ${openMenus[title] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>
            {openMenus[title] && (
              <ul className="nav flex-column ms-3">
                {children.map(({ label, href }) => (
                  <li className="nav-item" key={href}>
                    <Link
                      href={href}
                      className={`nav-link py-1 ${pathname === href ? 'text-warning fw-bold' : 'text-white'}`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
