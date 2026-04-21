/**
 * Strategic RBAC Definitions
 * Nilai Dasar Bitmask: 
 * R (Read)   = 1
 * C (Create) = 2
 * U (Update) = 4
 * D (Delete) = 8
 * 
 * Total CRUD = 15
 */

export const PERMISSION_BIT = {
  READ: 1,
  CREATE: 2,
  UPDATE: 4,
  DELETE: 8,
} as const;

export type PermissionModule = 
  | 'USR' // User Management
  | 'ROL' // Role Management
  | 'CPY' // Company Profile
  | 'NFT' // Notifications
  | 'AUD' // Audit Logs
  | 'TDF' // Task Definitions
  | 'TAS' // Tasks
  | 'SUB' // Submissions
  | 'PRB' // Problems
  | 'REV' // Reviews
  | 'TMP'; // Templates

export type RoleCode = 'sup' | 'adm' | 'man' | 'emp';

export const ROLE_PERMISSIONS: Record<RoleCode, Partial<Record<PermissionModule, number>>> = {
  sup: { // Super Admin
    USR: 15, ROL: 15, CPY: 15, NFT: 5, AUD: 1, 
    TDF: 15, TAS: 15, SUB: 15, PRB: 15, REV: 15, TMP: 15 
  },
  adm: { // Admin
    USR: 15, ROL: 15, CPY: 15, NFT: 5, AUD: 1 
  },
  man: { // Manager
    USR: 1, ROL: 1, CPY: 1, NFT: 5, AUD: 1, 
    TDF: 15, TAS: 15, SUB: 1, PRB: 5, REV: 15, TMP: 15 
  },
  emp: { // Employee
    USR: 1, ROL: 1, CPY: 1, NFT: 5, AUD: 1, 
    TDF: 1, TAS: 1, SUB: 15, PRB: 15, REV: 1 
  }
};
