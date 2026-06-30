import mysql from 'mysql2/promise';
import { getConfig } from './appConfig.js';

let pool: mysql.Pool | null = null;

export function initMysqlPool() {
  const config = getConfig();
  if (!config.mysql.enabled) {
    return null;
  }
  
  pool = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    charset: 'utf8',
    connectionLimit: 10,
  });
  
  return pool;
}

export function getMysqlPool(): mysql.Pool | null {
  return pool;
}

export async function getConnection() {
  if (!pool) {
    throw new Error('MySQL pool not initialized');
  }
  return pool.getConnection();
}