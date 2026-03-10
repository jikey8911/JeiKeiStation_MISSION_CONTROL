import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbFunctions from './db';
import { users, agents, tasks } from '../drizzle/schema'; // Importar solo las tablas usadas en los tests
import * as drizzleOrm from 'drizzle-orm';
import * as mysql2 from 'mysql2/promise';
import { ENV } from './_core/env';

// Define common chainable methods for select operations
const mockChainableMethods = {
  limit: vi.fn(() => Promise.resolve([])),
  orderBy: vi.fn(() => Promise.resolve([])),
};

// Mock for .where() method, which should return an object with chainable methods
const mockWhereMethod = vi.fn(() => mockChainableMethods);

// Mock for .from() method, which can have .where() or directly .orderBy()/limit()
const mockFromMethod = vi.fn(() => ({
  where: mockWhereMethod,
  ...mockChainableMethods, // This allows .orderBy() and .limit() directly on the result of .from()
}));

// Mocked Drizzle instance that methods in db.ts will interact with
const mockDrizzleInstance = {
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      onDuplicateKeyUpdate: vi.fn(() => [{}, 1]), // For upsert
      // For create, we need to mock the returning part correctly for MySQL
      // Drizzle's MySQL insert returns `[ { insertId: N } ]` on success.
      returning: vi.fn(() => Promise.resolve([{ insertId: 1 }])), // Default insertId
    })),
  })),
  select: vi.fn(() => ({
    from: mockFromMethod,
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({})),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({})),
  })),
  // Direct mock of Drizzle functions used in db.ts
  eq: vi.fn(drizzleOrm.eq),
  and: vi.fn(drizzleOrm.and),
  desc: vi.fn(drizzleOrm.desc),
  inArray: vi.fn(drizzleOrm.inArray),
};

// Mockear las dependencias externas
vi.mock('mysql2/promise', () => ({
  createPool: vi.fn(() => ({
    query: vi.fn((sql: string) => {
      if (sql === "SELECT 1") return [[]]; // Simular conexión exitosa
      return [[{ insertId: 1 }]]; // Default return for other queries
    }),
    end: vi.fn(),
  })),
}));

vi.mock('drizzle-orm', () => ({
  drizzle: vi.fn(() => mockDrizzleInstance), // Ensure drizzle returns our mock instance
  eq: vi.fn((a, b) => ({ __eq: true, a, b })),
  and: vi.fn((...args) => ({ __and: true, args })),
  desc: vi.fn((col) => ({ __desc: true, col })),
  inArray: vi.fn((col, arr) => ({ __inArray: true, col, arr })),
}));

// Mockear el módulo de entorno
vi.mock('./_core/env', () => ({
  ENV: {
    databaseUrl: 'mysql://user:password@host:port/database', // URL de base de datos de prueba
  },
}));

describe('db.ts', () => {
  let mockPool: ReturnType<typeof mysql2.createPool>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reiniciar el estado interno de getDb para que no retorne siempre la misma instancia mock
    (dbFunctions as any)._db = null;
    (dbFunctions as any)._pool = null;

    // Obtener la instancia real del mock de createPool
    mockPool = (mysql2.createPool as any)();

    // Resetear los mocks internos de drizzleInstance y sus métodos encadenados
    mockDrizzleInstance.insert.mockClear();
    mockDrizzleInstance.select.mockClear();
    mockDrizzleInstance.update.mockClear();
    mockDrizzleInstance.delete.mockClear();
    mockDrizzleInstance.eq.mockClear();
    mockDrizzleInstance.and.mockClear();
    mockDrizzleInstance.desc.mockClear();
    mockDrizzleInstance.inArray.mockClear();

    // Clear chained mocks separately
    mockFromMethod.mockClear();
    mockWhereMethod.mockClear();
    mockChainableMethods.limit.mockClear();
    mockChainableMethods.orderBy.mockClear();

    // Reset any resolved values
    mockChainableMethods.limit.mockResolvedValue([]);
    mockChainableMethods.orderBy.mockResolvedValue([]);
    mockDrizzleInstance.insert().values().returning.mockResolvedValue([{ insertId: 1 }]);
  });

  describe('getDb', () => {
    it('should connect to the database and return a drizzle instance', async () => {
      const db = await dbFunctions.getDb();
      expect(mysql2.createPool).toHaveBeenCalledWith({ uri: ENV.databaseUrl });
      expect(mockPool.query).toHaveBeenCalledWith("SELECT 1");
      expect(drizzleOrm.drizzle).toHaveBeenCalledWith(mockPool);
      expect(db).toBe(mockDrizzleInstance);
    });

    it('should return null if DATABASE_URL is not set', async () => {
      ENV.databaseUrl = ''; // Simular que no hay URL
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const db = await dbFunctions.getDb();
      expect(consoleWarnSpy).toHaveBeenCalledWith("[Database] No DATABASE_URL found. Running in Mock Mode.");
      expect(db).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('should return null if connection fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Connection failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const db = await dbFunctions.getDb();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Database] CRITICAL: Failed to connect to the database.",
        expect.any(Error)
      );
      expect(db).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should return the same db instance on subsequent calls', async () => {
      const db1 = await dbFunctions.getDb();
      const db2 = await dbFunctions.getDb();
      expect(db1).toBe(db2);
      expect(mysql2.createPool).toHaveBeenCalledTimes(1); // Solo se conecta una vez
    });
  });

  describe('upsertUser', () => {
    it('should insert a new user if not exists', async () => {
      const userData = { openId: 'test-openid', name: 'Test User', email: 'test@example.com', loginMethod: 'clerk' };
      // Simular que no existe el usuario para que onDuplicateKeyUpdate se encargue del insert
      mockDrizzleInstance.insert().values().onDuplicateKeyUpdate.mockClear(); // Resetear para este test

      await dbFunctions.upsertUser(userData);

      expect(mockDrizzleInstance.insert).toHaveBeenCalledWith(users);
      expect(mockDrizzleInstance.insert().values).toHaveBeenCalledWith(expect.objectContaining(userData));
      expect(mockDrizzleInstance.insert().values().onDuplicateKeyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ set: expect.objectContaining({ name: 'Test User' }) })
      );
    });

    it('should update an existing user', async () => {
      const userData = { openId: 'test-openid', name: 'Updated User', email: 'updated@example.com', lastSignedIn: new Date() };
      await dbFunctions.upsertUser(userData);

      expect(mockDrizzleInstance.insert).toHaveBeenCalledWith(users);
      expect(mockDrizzleInstance.insert().values).toHaveBeenCalledWith(expect.objectContaining({ openId: userData.openId }));
      expect(mockDrizzleInstance.insert().values().onDuplicateKeyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ set: expect.objectContaining({ name: 'Updated User', email: 'updated@example.com' }) })
      );
    });
  });

  describe('getUserByOpenId', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: 1, openId: 'test-openid', name: 'Test User', createdAt: new Date(), updatedAt: new Date() };
      mockChainableMethods.limit.mockResolvedValueOnce([mockUser]); // Mockear el resultado del .limit()

      const user = await dbFunctions.getUserByOpenId('test-openid');
      expect(mockDrizzleInstance.select).toHaveBeenCalledWith();
      expect(mockFromMethod).toHaveBeenCalledWith(users);
      expect(mockWhereMethod).toHaveBeenCalledWith(
        (mockDrizzleInstance.eq as any)(users.openId, 'test-openid')
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockChainableMethods.limit.mockResolvedValueOnce([]); // Asegurarse de que no hay resultados

      const user = await dbFunctions.getUserByOpenId('non-existent-openid');
      expect(user).toBeNull();
    });
  });

  describe('createAgent', () => {
    it('should create a new agent', async () => {
      const agentData = { name: 'Agent Smith', skill: 'hacking', skills: ['hacking'], maxCapacity: 10, description: 'desc' };
      mockDrizzleInstance.insert().values().returning.mockResolvedValueOnce([{ insertId: 1 }]); // Mock MySQL insertId

      const agent = await dbFunctions.createAgent(agentData);

      expect(mockDrizzleInstance.insert).toHaveBeenCalledWith(agents);
      expect(mockDrizzleInstance.insert().values).toHaveBeenCalledWith(
        expect.objectContaining({ ...agentData, status: 'available', currentWorkload: 0 })
      );
      expect(agent).toEqual({ id: 1, ...agentData, status: 'available', currentWorkload: 0 }); // Ajustar el retorno esperado
    });

    it('should return null if agent creation fails', async () => {
      mockDrizzleInstance.insert().values().returning.mockImplementationOnce(() => {
        throw new Error('Failed to create agent');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const agent = await dbFunctions.createAgent({ name: 'Failing Agent', skill: 'none', skills: ['none'], maxCapacity: 1, description: 'desc' });
      expect(agent).toBeNull(); // Ahora esperamos null si falla
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAgents', () => {
    it('should return a list of agents', async () => {
      const mockAgents = [
        { id: 1, name: 'Agent A', createdAt: new Date(), updatedAt: new Date(), currentWorkload: 0, description: 'desc', avatar: 'url', maxCapacity: 10, skills: ['coding'], status: 'available' },
        { id: 2, name: 'Agent B', createdAt: new Date(), updatedAt: new Date(), currentWorkload: 0, description: 'desc', avatar: 'url', maxCapacity: 10, skills: ['testing'], status: 'available' }
      ];
      mockChainableMethods.orderBy.mockResolvedValueOnce(mockAgents); // Mockear el resultado del .orderBy()

      const agentsList = await dbFunctions.getAgents();
      expect(mockDrizzleInstance.select).toHaveBeenCalledWith();
      expect(mockFromMethod).toHaveBeenCalledWith(agents);
      expect(agentsList).toEqual(mockAgents);
    });

    it('should return an empty array if no agents found', async () => {
      mockChainableMethods.orderBy.mockResolvedValueOnce([]); // Asegurarse de que no hay resultados

      const agentsList = await dbFunctions.getAgents();
      expect(agentsList).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = { title: 'New Task', description: 'Desc' };
      mockDrizzleInstance.insert().values().returning.mockResolvedValueOnce([{ insertId: 101 }]); // Mock MySQL insertId

      const task = await dbFunctions.createTask(taskData);
      expect(mockDrizzleInstance.insert).toHaveBeenCalledWith(tasks);
      expect(mockDrizzleInstance.insert().values).toHaveBeenCalledWith(
        expect.objectContaining({ ...taskData, status: 'todo' })
      );
      expect(task).toEqual(expect.objectContaining({ id: 101, ...taskData, status: 'todo' }));
    });
  });

  describe('getTasks', () => {
    it('should return all tasks if no sprintId is provided', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1', createdAt: new Date(), updatedAt: new Date(), status: 'todo' }];
      mockChainableMethods.orderBy.mockResolvedValueOnce(mockTasks);

      const tasksList = await dbFunctions.getTasks();
      expect(mockDrizzleInstance.select).toHaveBeenCalledWith();
      expect(mockFromMethod).toHaveBeenCalledWith(tasks);
      // No esperamos que 'where' sea llamado si no hay sprintId
      expect(mockWhereMethod).not.toHaveBeenCalled(); 
      expect(tasksList).toEqual(mockTasks);
    });

    it('should return tasks for a specific sprintId', async () => {
      const mockTasks = [{ id: 2, title: 'Sprint Task', sprintId: 5, createdAt: new Date(), updatedAt: new Date(), status: 'todo' }];
      // Mock para el .orderBy() que viene después del .where()
      mockWhereMethod.mockReturnValueOnce({
        orderBy: vi.fn(() => Promise.resolve(mockTasks)),
        limit: vi.fn(), // Asegurarse de que limit también exista si es necesario en la cadena
      });

      const tasksList = await dbFunctions.getTasks(5);
      expect(mockDrizzleInstance.select).toHaveBeenCalledWith();
      expect(mockFromMethod).toHaveBeenCalledWith(tasks);
      expect(mockWhereMethod).toHaveBeenCalledWith(
        (mockDrizzleInstance.eq as any)(tasks.sprintId, 5)
      );
      expect(tasksList).toEqual(mockTasks);
    });
  });

  // --- COBERTURA ADICIONAL (PENDIENTE DE IMPLEMENTAR COMPLETAMENTE) ---

  // describe('getTaskById', () => { /* ... */ });
  // describe('updateTaskStatus', () => { /* ... */ });
  // describe('assignTaskToAgent', () => { /* ... */ });

  // describe('createSprint', () => { /* ... */ });
  // describe('getSprints', () => { /* ... */ });
  // describe('getSprintById', () => { /* ... */ });
  // describe('updateSprintStatus', () => { /* ... */ });

  // describe('createTaskDependency', () => { /* ... */ });
  // describe('getTaskDependencies', () => { /* ... */ });
  // describe('getAllDependencies', () => { /* ... */ });
  // describe('getBlockingTasks', () => { /* ... */ });
  // describe('deleteDependency', () => { /* ... */ });

  // describe('createNotification', () => { /* ... */ });
  // describe('getNotifications', () => { /* ... */ });
  // describe('markNotificationAsRead', () => { /* ... */ });
  // describe('markNotificationsAsRead', () => { /* ... */ });
  // describe('archiveNotification', () => { /* ... */ });
  // describe('archiveNotifications', () => { /* ... */ });
});