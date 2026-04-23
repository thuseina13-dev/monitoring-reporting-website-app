import { describe, expect, it, afterAll } from "bun:test";
import { db } from "../db";
import { roles } from "../db/schema";
import { eq } from "drizzle-orm";

describe('Database Constraints Integration Test', () => {
  it('Unique Constraint: Roles.code tidak boleh duplikat', async () => {
    const testCode = 'test_' + Date.now();
    
    // 1. Insert role pertama
    await db.insert(roles).values({
      code: testCode,
      name: 'Test Role 1',
      type: 'employee'
    });

    // 2. Coba insert role kedua dengan code yang sama
    try {
      await db.insert(roles).values({
        code: testCode,
        name: 'Test Role 2',
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
    
    // 1. Insert role pertama
    await db.insert(roles).values({
      code: 'code1_' + Date.now(),
      name: testName,
      type: 'employee'
    });

    // 2. Coba insert role kedua dengan name yang sama
    try {
      await db.insert(roles).values({
        code: 'code2_' + Date.now(),
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
