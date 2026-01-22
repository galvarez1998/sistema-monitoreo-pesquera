import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { sensorsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Sensors() {
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      const response = await sensorsAPI.getAll();
      setSensors(response.data);
    } catch (error) {
      console.error('Error loading sensors:', error);
      toast.error('Error al cargar sensores');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Sensores</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estanque</TableCell>
              <TableCell>Última Lectura</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensors.map((sensor) => (
              <TableRow key={sensor.id}>
                <TableCell>{sensor.id}</TableCell>
                <TableCell>{sensor.sensor_type}</TableCell>
                <TableCell>{sensor.tank_name || 'N/A'}</TableCell>
                <TableCell>{sensor.last_reading || 'N/A'}</TableCell>
                <TableCell>{sensor.unit}</TableCell>
                <TableCell>{sensor.is_active ? 'Activo' : 'Inactivo'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
