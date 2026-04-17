import { db } from '../db';
import { auditLogs } from '../db/schema';

interface AuditPayload {
  userId: string;
  description: string;
  type: string; // Contoh: GET, POST, LOGIN, dll
  createdBy?: string;
}

/**
 * Utilitas untuk mencatat Log Audit ke database sesuai spesifikasi terbaru.
 * Kolom: id, user_id, description (text), type (varchar 255), created_at, created_by
 */
export const createAuditLog = async (payload: AuditPayload, tx?: any) => {
  const database = tx || db;
  
  try {
    await database.insert(auditLogs).values({
      userId: payload.userId,
      description: payload.description,
      type: payload.type,
      createdBy: payload.createdBy || payload.userId, // Default ke userId jika tidak ada
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
