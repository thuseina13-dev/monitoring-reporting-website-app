import { ComponentProps } from 'react';

// Bitmasks untuk Role
export const ROLE_BIT = {
  SUPER_ADMIN: 1 << 0, // 1
  ADMIN: 1 << 1,       // 2
  MANAGER: 1 << 2,     // 4
  EMPLOYEE: 1 << 3,    // 8
} as const;

export type RoleType = keyof typeof ROLE_BIT;

export interface MenuItem {
  title: string;
  icon: string | any;
  href: string;
  requiredRoleValue: number;
}

export const MENU_ITEMS: MenuItem[] = [
  // Admin Menu
  {
    title: 'ROLE',
    icon: 'BadgeCheck',
    href: '/(dashboard)/admin/role',
    requiredRoleValue: ROLE_BIT.ADMIN,
  },
  {
    title: 'USER',
    icon: 'User',
    href: '/(dashboard)/admin/user',
    requiredRoleValue: ROLE_BIT.ADMIN,
  },
  {
    title: 'PROFIL PERUSAHAAN',
    icon: 'Building2',
    href: '/(dashboard)/admin/company-profile',
    requiredRoleValue: ROLE_BIT.ADMIN,
  },

  // Manager Menu
  {
    title: 'Delegasi Tugas',
    icon: 'Users',
    href: '/(dashboard)/manager/delegation',
    requiredRoleValue: ROLE_BIT.MANAGER,
  },
  {
    title: 'Template Tugas',
    icon: 'FileText',
    href: '/(dashboard)/manager/task-template',
    requiredRoleValue: ROLE_BIT.MANAGER,
  },
  {
    title: 'Template Evaluasi',
    icon: 'FileCheck',
    href: '/(dashboard)/manager/eval-template',
    requiredRoleValue: ROLE_BIT.MANAGER,
  },
  {
    title: 'Evaluasi',
    icon: 'Star',
    href: '/(dashboard)/manager/evaluation',
    requiredRoleValue: ROLE_BIT.MANAGER,
  },
  {
    title: 'Laporan Kendala (M)',
    icon: 'AlertCircle',
    href: '/(dashboard)/manager/issues',
    requiredRoleValue: ROLE_BIT.MANAGER,
  },

  // Employee Menu
  {
    title: 'Daftar Tugas',
    icon: 'ClipboardList',
    href: '/(dashboard)/employee/tasks',
    requiredRoleValue: ROLE_BIT.EMPLOYEE,
  },
  {
    title: 'Laporan Kendala',
    icon: 'AlertTriangle',
    href: '/(dashboard)/employee/issues',
    requiredRoleValue: ROLE_BIT.EMPLOYEE,
  },
  {
    title: 'Daftar Evaluasi',
    icon: 'CheckSquare',
    href: '/(dashboard)/employee/evaluations',
    requiredRoleValue: ROLE_BIT.EMPLOYEE,
  },
];
