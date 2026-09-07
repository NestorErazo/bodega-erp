import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import dashboardRoutes from './routes/dashboard.js';
import catalogRoutes from './routes/catalog.js';
import auditRoutes from './routes/audit.js';
import settingsRoutes from './routes/settings.js';
import saleRoutes from './routes/sales.js';
import refundRoutes from './routes/refunds.js';
import purchaseRoutes from './routes/purchases.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import cashRoutes from './routes/cash.js';
import expenseRoutes from './routes/expenses.js';
import bankRoutes from './routes/banks.js';
import accountRoutes from './routes/accounts.js';
import salespersonRoutes from './routes/salespersons.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuración
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log(`[CORS] Origen bloqueado: ${origin}`);
      return callback(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Manejar preflight OPTIONS para todas las rutas
app.options('*', cors());

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/accounting', accountRoutes);
app.use('/api', accountRoutes); // expone /accounts-receivable directo para el frontend Cartera
app.use('/api/salespersons', salespersonRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Servir frontend en producción solo si existe la carpeta
if (process.env.NODE_ENV === 'production') {
  const staticPath = process.env.FRONTEND_DIST_PATH
    ? path.resolve(process.env.FRONTEND_DIST_PATH)
    : path.join(__dirname, '../../frontend/dist');

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).json({ error: 'index.html no encontrado' });
      }
    });
  } else {
    console.log(`[server] FRONTEND_DIST no encontrado en ${staticPath}. Sirviendo solo API.`);
  }
}

// Manejo global de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});