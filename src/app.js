const express = require('express');
const cors = require('cors');
const sqlInjectionCheck = require('./middleware/sqlInjection');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const statesRoutes = require('./routes/statesRoutes');
const requestRoutes = require('./routes/requestRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const healthRoutes = require('./routes/healthRoutes')
const app = express();

app.use(cors({
  origin: 'http://192.168.12.14:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(sqlInjectionCheck);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/', clientRoutes);
app.use('/', statesRoutes);
app.use('/', requestRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/', healthRoutes);


module.exports = app; 