import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { alertsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsAPI.getAll();
      setAlerts(response.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Error al cargar alertas');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };
    return colors[severity] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Alertas</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Estanque</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell>Severidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.id}</TableCell>
                <TableCell>{alert.tank_name || 'N/A'}</TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Chip label={alert.severity} color={getSeverityColor(alert.severity)} size="small" />
                </TableCell>
                <TableCell>
                  {alert.is_resolved ? (
                    <Chip label="Resuelta" color="success" size="small" />
                  ) : (
                    <Chip label="Activa" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
