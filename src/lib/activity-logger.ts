import fs from 'fs';
import path from 'path';

/**
 * Logs an activity to activity.log in the root directory.
 * This should be called from server components or API routes.
 */
export function logActivity(action: string, details: string) {
  try {
    const logPath = path.join(process.cwd(), 'activity.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ACTION: ${action} | DETAILS: ${details}\n`;
    
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error('Failed to write to activity.log:', error);
  }
}
