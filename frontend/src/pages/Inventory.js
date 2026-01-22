import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { inventoryAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Inventory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await inventoryAPI.getItems();
      setItems(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Error al cargar inventario');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inventario</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Stock Actual</TableCell>
              <TableCell>Stock Mínimo</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category_name || 'N/A'}</TableCell>
                <TableCell>{item.current_stock}</TableCell>
                <TableCell>{item.min_stock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  {item.current_stock <= item.min_stock ? (
                    <Chip label="Stock Bajo" color="error" size="small" />
                  ) : (
                    <Chip label="OK" color="success" size="small" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
