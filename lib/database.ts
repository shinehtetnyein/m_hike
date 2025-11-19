import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Types
export interface Hike {
  id: string;
  name: string;
  location: string;
  date: string;
  parking: string;
  length: string;
  difficulty: string;
  description: string;
  weather: string;
  rating: string;
  companions: string;
  createdAt: string;
}

export interface DatabaseResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Database configuration
const DATABASE_NAME = 'hikes.db';
const DATABASE_VERSION = '1.0';

// Persistent mock database for web platform using localStorage
const createMockDatabase = () => {
  console.log('Using persistent mock database for web platform');
  const STORAGE_KEY = 'mhike_hikes_v1';

  let memoryRows: any[] = [];
  const hasLocalStorage = typeof window !== 'undefined' && window.localStorage;
  const readAll = () => {
    try {
      if (hasLocalStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        console.log('MOCK DB readAll:', parsed);
        return parsed;
      } else {
        console.log('MOCK DB readAll (memory):', memoryRows);
        return memoryRows;
      }
    } catch (e) {
      console.error('MOCK DB readAll error:', e);
      return [];
    }
  };

  const writeAll = (rows: any[]) => {
    try {
      if (hasLocalStorage) {
        console.log('MOCK DB writeAll:', rows);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      } else {
        memoryRows = rows;
        console.log('MOCK DB writeAll (memory):', memoryRows);
      }
    } catch (e) {
      console.error('MOCK DB writeAll error:', e);
    }
  };

  const createResultRows = (arr: any[]) => ({
    _array: arr,
    length: arr.length,
    item: (i: number) => arr[i] ?? null,
  });

  return {
    transaction: (callback: (tx: any) => void) => {
      callback({
        executeSql: (
          sql: string,
          params: any[] = [],
          success?: (tx: any, result: any) => void,
          error?: (tx: any, err: any) => boolean
        ) => {
          try {
            const normalized = sql.trim().toUpperCase();
            if (normalized.startsWith('INSERT INTO HIKES')) {
              const rows = readAll();
              const [id, name, location, date, parking, length, difficulty, description, weather, rating, companions, createdAt] = params;
              rows.push({ id, name, location, date, parking, length, difficulty, description, weather, rating, companions, createdAt });
              writeAll(rows);
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (normalized.startsWith('SELECT * FROM HIKES')) {
              let rows = readAll();
              rows = rows.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              if (success) success(null, { rows: createResultRows(rows) });
              return;
            }
            if (normalized.startsWith('DELETE FROM HIKES WHERE ID')) {
              let rows = readAll();
              const id = params[0];
              rows = rows.filter(r => r.id !== id);
              writeAll(rows);
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (normalized === 'DELETE FROM HIKES') {
              writeAll([]);
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (normalized.startsWith('UPDATE HIKES')) {
              let rows = readAll();
              const id = params[params.length - 1];
              rows = rows.map(r => r.id === id ? {
                ...r,
                name: params[0],
                location: params[1],
                date: params[2],
                parking: params[3],
                length: params[4],
                difficulty: params[5],
                description: params[6],
                weather: params[7],
                rating: params[8],
                companions: params[9],
                createdAt: params[10],
              } : r);
              writeAll(rows);
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (normalized.startsWith('SELECT COUNT(*)')) {
              const rows = readAll();
              if (success) success(null, { rows: createResultRows([{ count: rows.length }]) });
              return;
            }
            if (normalized.startsWith('SELECT * FROM HIKES WHERE ID')) {
              const rows = readAll();
              const id = params[0];
              const found = rows.filter(r => r.id === id);
              if (success) success(null, { rows: createResultRows(found) });
              return;
            }
            if (normalized.startsWith('DROP TABLE')) {
              writeAll([]);
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (normalized.startsWith('CREATE TABLE')) {
              if (success) success(null, { rows: createResultRows([]) });
              return;
            }
            if (success) success(null, { rows: createResultRows([]) });
          } catch (err) {
            if (error) error(null, err as any);
          }
        }
      });
    }
  };
};

// Database service class
class DatabaseService {
  private db: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      if (Platform.OS === 'web') {
        this.db = createMockDatabase();
      } else {
        let dbInstance: any = null;
        const sqliteAny = SQLite as any;
        try {
          if (sqliteAny && typeof sqliteAny.openDatabase === 'function') {
            dbInstance = sqliteAny.openDatabase(
              DATABASE_NAME,
              DATABASE_VERSION,
              'Hikes Database',
              -1
            );
          } else if (sqliteAny && typeof sqliteAny.openDatabaseSync === 'function') {
            dbInstance = sqliteAny.openDatabaseSync(DATABASE_NAME);
          }
        } catch (e) {
          console.warn('SQLite open attempt failed:', e);
          dbInstance = null;
        }
        if (dbInstance) {
          this.db = dbInstance;
          console.log('SQLite database initialized successfully');
        } else {
          console.warn('SQLite is not available; falling back to mock database');
          this.db = createMockDatabase();
        }
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.db = createMockDatabase();
      this.isInitialized = true;
    }
  }

  private async executeTransaction<T>(
    sql: string,
    params: any[] = [],
    operation: string
  ): Promise<DatabaseResult> {
    return new Promise((resolve) => {
      if (!this.isInitialized || !this.db) {
        resolve({
          success: false,
          error: 'Database not initialized'
        });
        return;
      }

      // Guard: if transaction is not a function, fallback to mock DB
      if (typeof this.db.transaction !== 'function') {
        console.warn('Database instance does not have a transaction function; falling back to mock DB');
        this.db = createMockDatabase();
        // Try again with mock DB
        if (typeof this.db.transaction !== 'function') {
          resolve({
            success: false,
            error: 'Database transaction function is not available'
          });
          return;
        }
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            sql,
            params,
            (tx: any, result: any) => {
              console.log(`Database ${operation} successful`);
              resolve({
                success: true,
                data: result
              });
            },
            (tx: any, error: any) => {
              console.error(`Database ${operation} failed:`, error);
              resolve({
                success: false,
                error: error.message
              });
              return true; // Return true to continue transaction
            }
          );
        },
        (error: any) => {
          console.error(`Transaction error during ${operation}:`, error);
          resolve({
            success: false,
            error: error.message
          });
        }
      );
    });
  }

  // Initialize database tables
  async initDatabase(): Promise<DatabaseResult> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS hikes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        parking TEXT NOT NULL,
        length TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        description TEXT,
        weather TEXT,
        rating TEXT,
        companions TEXT,
        createdAt TEXT NOT NULL
      );
    `;

    return await this.executeTransaction(createTableSQL, [], 'initialization');
  }

  // Add a new hike
  async addHike(hike: Omit<Hike, 'createdAt'>): Promise<DatabaseResult> {
    const createdAt = new Date().toISOString();
    const sql = `
      INSERT INTO hikes (id, name, location, date, parking, length, difficulty, description, weather, rating, companions, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
      const hikeWithDefaults: Omit<Hike, 'createdAt'> = {
        id: hike.id || '',
        name: hike.name || '',
        location: hike.location || '',
        date: hike.date || '',
        parking: hike.parking || '',
        length: hike.length || '',
        difficulty: hike.difficulty || '',
        description: hike.description || '',
        weather: hike.weather || '',
        rating: hike.rating || '',
        companions: hike.companions || '',
      };
      const params = [
        hikeWithDefaults.id,
        hikeWithDefaults.name,
        hikeWithDefaults.location,
        hikeWithDefaults.date,
        hikeWithDefaults.parking,
        hikeWithDefaults.length,
        hikeWithDefaults.difficulty,
        hikeWithDefaults.description || '',
        hikeWithDefaults.weather || '',
        hikeWithDefaults.rating || '',
        hikeWithDefaults.companions || '',
        createdAt
      ];

    return await this.executeTransaction(sql, params, 'add hike');
  }

  // Get all hikes sorted by date (newest first)
  async getAllHikes(): Promise<DatabaseResult & { data?: Hike[] }> {
    const sql = `SELECT * FROM hikes ORDER BY date DESC`;
    
    const result = await this.executeTransaction(sql, [], 'get all hikes');
    
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.rows._array || []
      };
    }
    
    return result;
  }

  // Get hike by ID
  async getHikeById(id: string): Promise<DatabaseResult & { data?: Hike | null }> {
    const sql = `SELECT * FROM hikes WHERE id = ?`;
    
    const result = await this.executeTransaction(sql, [id], 'get hike by id');
    
    if (result.success && result.data) {
      const hikes = result.data.rows._array || [];
      return {
        ...result,
        data: hikes.length > 0 ? hikes[0] : null
      };
    }
    
    return result;
  }

  // Update hike
  async updateHike(hike: Hike): Promise<DatabaseResult> {
    const sql = `
      UPDATE hikes 
      SET name = ?, location = ?, date = ?, parking = ?, length = ?, difficulty = ?, 
          description = ?, weather = ?, rating = ?, companions = ?
      WHERE id = ?
    `;
    
    const params = [
      hike.name,
      hike.location,
      hike.date,
      hike.parking,
      hike.length,
      hike.difficulty,
      hike.description,
      hike.weather,
      hike.rating,
      hike.companions,
      hike.id
    ];

    return await this.executeTransaction(sql, params, 'update hike');
  }

  // Delete hike by ID
  async deleteHike(id: string): Promise<DatabaseResult> {
    const sql = `DELETE FROM hikes WHERE id = ?`;
    return await this.executeTransaction(sql, [id], 'delete hike');
  }

  // Delete all hikes
  async deleteAllHikes(): Promise<DatabaseResult> {
    const sql = `DELETE FROM hikes`;
    return await this.executeTransaction(sql, [], 'delete all hikes');
  }

  // Reset entire database
  async resetDatabase(): Promise<DatabaseResult> {
    const dropResult = await this.executeTransaction(
      `DROP TABLE IF EXISTS hikes`,
      [],
      'drop table'
    );

    if (!dropResult.success) {
      return dropResult;
    }

    return await this.initDatabase();
  }

  // Get database statistics
  async getDatabaseStats(): Promise<DatabaseResult & { data?: { hikeCount: number } }> {
    const sql = `SELECT COUNT(*) as count FROM hikes`;
    
    const result = await this.executeTransaction(sql, [], 'get stats');
    
    if (result.success && result.data) {
      const count = result.data.rows._array[0]?.count || 0;
      return {
        ...result,
        data: { hikeCount: count }
      };
    }
    
    return result;
  }
}

// Create and export singleton instance
export const databaseService = new DatabaseService();

// Legacy functions for backward compatibility
export const initDatabase = (): Promise<void> => {
  return databaseService.initDatabase().then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};
export const addHike = (hike: Partial<Hike>): Promise<void> => {
  // Always ensure all required fields are present
  const hikeWithDefaults: Omit<Hike, 'createdAt'> = {
    id: hike.id || '',
    name: hike.name || '',
    location: hike.location || '',
    date: hike.date || '',
    parking: hike.parking || '',
    length: hike.length || '',
    difficulty: hike.difficulty || '',
    description: hike.description || '',
    weather: hike.weather || '',
    rating: hike.rating || '',
    companions: hike.companions || '',
  };
  return databaseService.addHike(hikeWithDefaults).then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};

export const getAllHikes = async (): Promise<Hike[]> => {
  const result = await databaseService.getAllHikes();
  try {
    console.log('database.getAllHikes result:', result && result.data ? result.data : result);
  } catch (e) {
    // swallow any logging error
  }
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data || [];
};

export const getHikeById = (id: string): Promise<Hike | null> => {
  return databaseService.getHikeById(id).then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data || null;
  });
};

export const updateHike = (hike: Hike): Promise<void> => {
  return databaseService.updateHike(hike).then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};

export const deleteHike = (id: string): Promise<void> => {
  return databaseService.deleteHike(id).then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};

export const deleteAllHikes = (): Promise<void> => {
  return databaseService.deleteAllHikes().then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};

export const resetDatabase = (): Promise<void> => {
  return databaseService.resetDatabase().then(result => {
    if (!result.success) {
      throw new Error(result.error);
    }
  });
};