import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  Pool as PoolIcon,
  Sensors as SensorsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { tanksAPI, alertsAPI, sensorsAPI } from '../services/api';
import { connectSocket, onSensorReading, onNewAlert, offSensorReading, offNewAlert } from '../services/socket';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTanks: 0,
    activeSensors: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
  });
  const [recentReadings, setRecentReadings] = useState([]);
  const [tanks, setTanks] = useState([]);

  useEffect(() => {
    loadDashboardData();
    
    // Connect to WebSocket
    const socket = connectSocket();
    
    onSensorReading((data) => {
      console.log('New sensor reading:', data);
      // Update recent readings
      setRecentReadings(prev => [data, ...prev.slice(0, 9)]);
    });
    
    onNewAlert((alert) => {
      toast.warning(`Nueva alerta: ${alert.message}`);
      setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
    });
    
    return () => {
      // Properly cleanup WebSocket connection
      offSensorReading();
      offNewAlert();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load tanks
      const tanksResponse = await tanksAPI.getAll();
      setTanks(tanksResponse.data);
      setStats(prev => ({ ...prev, totalTanks: tanksResponse.data.length }));

      // Load sensors
      const sensorsResponse = await sensorsAPI.getAll();
      setStats(prev => ({ 
        ...prev, 
        activeSensors: sensorsResponse.data.filter(s => s.is_active).length 
      }));

      // Load alerts
      const activeAlertsResponse = await alertsAPI.getAll({ is_resolved: 'false' });
      const resolvedAlertsResponse = await alertsAPI.getAll({ is_resolved: 'true' });
      
      setStats(prev => ({
        ...prev,
        activeAlerts: activeAlertsResponse.data.length,
        resolvedAlerts: resolvedAlertsResponse.data.length,
      }));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Estanques"
            value={stats.totalTanks}
            icon={<PoolIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sensores Activos"
            value={stats.activeSensors}
            icon={<SensorsIcon sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertas Activas"
            value={stats.activeAlerts}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertas Resueltas"
            value={stats.resolvedAlerts}
            icon={<CheckIcon sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monitoreo en Tiempo Real
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentReadings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado de Estanques
            </Typography>
            {tanks.slice(0, 5).map((tank) => (
              <Box key={tank.id} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  {tank.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {tank.location || 'Sin ubicación'}
                </Typography>
                <Typography variant="caption" color={tank.is_active ? 'success.main' : 'error.main'}>
                  {tank.is_active ? '● Activo' : '● Inactivo'}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
