/**
 * @file tests/db.test.ts
 * @description Tests unitarios para las funciones de base de datos.
 * @role Principal Frontend Engineer
 *
 * @comment
 * Iniciamos las pruebas con `upsertUser` por ser una función crítica y recientemente
 * refactorizada durante la migración a PostgreSQL.
 *
 * Se utiliza Vitest y su sistema de mocks para aislar la lógica de la base de datos
 * del acceso real a la misma, garantizando pruebas rápidas y predecibles.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertUser, getDb } from '../server/db';
import { mockDb } from '../server/db.mock';

// Hacemos un mock completo del módulo `db` para interceptar la llamada a `getDb`.
vi.mock('../server/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/db')>();
  return {
    ...actual,
    getDb: vi.fn(), // Mockeamos getDb para controlar si devuelve la BD real o el mock.
  };
});

describe('Database Functions', () => {
  describe('upsertUser', () => {
    beforeEach(() => {
      // Reseteamos los mocks antes de cada prueba.
      vi.clearAllMocks();
      mockDb.users.clear(); // Limpiamos la base de datos mock.
    });

    it('should create a new user if they do not exist', async () => {
      // Configuramos el mock para que simule que no hay BD real.
      (getDb as vi.Mock).mockResolvedValue(null);

      const newUser = {
        openId: 'user_new_123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      await upsertUser(newUser);

      const userInDb = mockDb.users.find(newUser.openId);
      expect(userInDb).toBeDefined();
      expect(userInDb?.name).toBe('John Doe');
    });

    it('should update an existing user', async () => {
      (getDb as vi.Mock).mockResolvedValue(null);

      const existingUser = {
        openId: 'user_existing_456',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      };
      mockDb.users.upsert(existingUser); // Pre-cargamos un usuario en el mock.

      const updates = {
        openId: 'user_existing_456',
        name: 'Jane Smith',
      };

      await upsertUser(updates);

      const updatedUser = mockDb.users.find(existingUser.openId);
      expect(updatedUser?.name).toBe('Jane Smith');
      // El email no se actualizó, debería permanecer igual.
      expect(updatedUser?.email).toBe('jane.doe@example.com');
    });

    it('should assign admin role if openId matches ownerOpenId', async () => {
      (getDb as vi.Mock).mockResolvedValue(null);
      // Asumimos que ENV.ownerOpenId es 'owner_id_123' para esta prueba.
      process.env.OWNER_OPEN_ID = 'owner_id_123';

      const ownerUser = {
        openId: 'owner_id_123',
        name: 'Admin User',
      };

      await upsertUser(ownerUser);

      const userInDb = mockDb.users.find(ownerUser.openId);
      expect(userInDb?.role).toBe('admin');
    });

    it('should throw an error if openId is not provided', async () => {
      (getDb as vi.Mock).mockResolvedValue(null);

      const invalidUser: any = {
        name: 'No ID User',
      };

      // Verificamos que la función lance una excepción.
      await expect(upsertUser(invalidUser)).rejects.toThrow(
        'User openId is required for upsert'
      );
    });
  });
});
