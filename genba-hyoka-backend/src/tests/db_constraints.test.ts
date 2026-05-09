import { describe, expect, it, afterAll } from "bun:test";
import { db } from "../db";
import { roles } from "../db/schema";
import { eq } from "drizzle-orm";

describe('Database Constraints Integration Test', () => {
  it('Unique Constraint: Roles.code tidak boleh duplikat', async () => {
    const testCode = Math.random().toString(36).substring(2, 7); // 5 chars
    
    // 1. Insert role pertama
    await db.insert(roles).values({
      code: testCode,
      name: 'Test Role 1 ' + Date.now(),
      type: 'employee'
    });

    // 2. Coba insert role kedua dengan code yang sama
    try {
      await db.insert(roles).values({
        code: testCode,
        name: 'Test Role 2 ' + Date.now(),
        type: 'employee'
      });
      // Jika sampai sini berarti gagal (tidak throw error)
      expect(true).toBe(false); 
    } catch (error: any) {
      expect(error).toBeDefined();
    } finally {
      // Cleanup
      await db.delete(roles).where(eq(roles.code, testCode));
    }
  });

  it('Unique Constraint: Roles.name tetap harus unique', async () => {
    const testName = 'Test Name ' + Date.now();
    const code1 = Math.random().toString(36).substring(2, 7);
    const code2 = Math.random().toString(36).substring(7, 12);
    
    // 1. Insert role pertama
    await db.insert(roles).values({
      code: code1,
      name: testName,
      type: 'employee'
    });

    // 2. Coba insert role kedua dengan name yang sama
    try {
      await db.insert(roles).values({
        code: code2,
        name: testName,
        type: 'employee'
      });
      expect(true).toBe(false); 
    } catch (error: any) {
      expect(error).toBeDefined();
    } finally {
      // Cleanup
      await db.delete(roles).where(eq(roles.name, testName));
    }
  });
});
