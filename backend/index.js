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

app.get('/health', async (_req, res) => {
  const { count, error } = await supabase
    .from('odp')
    .select('*', { count: 'exact', head: true });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, odp_count: count });
});

app.use('/auth', authRoutes);
app.use('/tiket', tiketRoutes);
app.use('/audit', auditRoutes);
app.use('/dashboard', dashboardRoutes);

if (!process.env.VERCEL) {
  app.listen(process.env.PORT, () => console.log('API jalan di :' + process.env.PORT));
}

export default app;