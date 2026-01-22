const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const startCron = require('./cron/reminderCron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Start Cron Jobs
startCron();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
// Helmet config to allow images from same origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portalRoutes = require('./routes/portalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const customTemplateRoutes = require('./routes/customTemplateRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/custom-templates', customTemplateRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Serve static uploads
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Invoice SaaS API is running');
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
