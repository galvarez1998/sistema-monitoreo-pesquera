import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

export default function Reports() {
  const reportTypes = [
    { title: 'Reporte de Sensores', description: 'Datos históricos de sensores' },
    { title: 'Reporte de Inventario', description: 'Estado actual del inventario' },
    { title: 'Reporte de Alertas', description: 'Historial de alertas' },
    { title: 'Reporte Personalizado', description: 'Crea un reporte personalizado' },
  ];

  const handleGenerate = (type) => {
    toast.info(`Generando ${type}...`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reportes</Typography>
      
      <Grid container spacing={3}>
        {reportTypes.map((report, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {report.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => handleGenerate(report.title)}
                  >
                    Generar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
