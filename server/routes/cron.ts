import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const cronRouter = Router();

cronRouter.post('/api/cron/daily-collection', async (req, res) => {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (token !== process.env.CRON_SECRET) {
    console.error('Unauthorized cron request - invalid token');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('[CRON] Starting daily collection via cron endpoint...');
    console.log('[CRON] Timestamp:', new Date().toISOString());
    
    // Run the daily collection script
    const scriptPath = path.join(process.cwd(), 'scripts', 'daily-collection-with-email.sh');
    console.log('[CRON] Executing script:', scriptPath);
    
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`);
    
    if (stdout) {
      console.log('[CRON] Script output:', stdout);
    }
    
    if (stderr) {
      console.error('[CRON] Script errors:', stderr);
    }
    
    console.log('[CRON] Daily collection completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Daily collection completed',
      timestamp: new Date().toISOString(),
      output: stdout
    });
  } catch (error: any) {
    console.error('[CRON] Daily collection failed:', error);
    console.error('[CRON] Error details:', error.message);
    
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      details: error.stderr || error.stdout
    });
  }
});

// Health check endpoint for cron monitoring
cronRouter.get('/api/cron/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cronSecret: process.env.CRON_SECRET ? 'configured' : 'missing'
  });
});
