import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { tanksAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Tanks() {
  const [tanks, setTanks] = useState([]);

  useEffect(() => {
    loadTanks();
  }, []);

  const loadTanks = async () => {
    try {
      const response = await tanksAPI.getAll();
      setTanks(response.data);
    } catch (error) {
      console.error('Error loading tanks:', error);
      toast.error('Error al cargar estanques');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Estanques</Typography>
        <Button variant="contained" onClick={() => toast.info('Función en desarrollo')}>
          Agregar Estanque
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {tanks.map((tank) => (
          <Grid item xs={12} sm={6} md={4} key={tank.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{tank.name}</Typography>
                <Typography color="textSecondary">{tank.description}</Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Capacidad: {tank.capacity} L
                </Typography>
                <Typography variant="body2">
                  Ubicación: {tank.location || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
