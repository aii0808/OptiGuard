import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './services/supabase.js';
import authRoutes from './routes/auth.js';
import tiketRoutes from './routes/tiket.js';
import auditRoutes from './routes/audit.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(cors({ 
  origin: true,
  credentials: true
}));
app.use(express.json());

const welcomeHandler = (_req, res) => {
  res.json({
    status: 'online',
    service: 'OptiGuard STO Telkom Akses Payakumbuh API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tiket: '/api/tiket',
      audit: '/api/audit',
      dashboard: '/api/dashboard',
    },
  });
};

const healthHandler = async (_req, res) => {
  const { count, error } = await supabase
    .from('odp')
    .select('*', { count: 'exact', head: true });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, odp_count: count });
};

// Root & Health endpoints (both direct and /api prefixed)
app.get('/', welcomeHandler);
app.get('/api', welcomeHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Sub-routes mounted on both direct and /api prefixes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/tiket', tiketRoutes);
app.use('/api/tiket', tiketRoutes);

app.use('/audit', auditRoutes);
app.use('/api/audit', auditRoutes);

app.use('/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('API jalan di :' + port));
}

export default app;
