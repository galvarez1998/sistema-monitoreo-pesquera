# Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Monitoreo Pesquera! 🐟

## 🤝 Cómo Contribuir

### Reportar Bugs

1. Verificar que el bug no haya sido reportado antes en [Issues](https://github.com/galvarez1998/sistema-monitoreo-pesquera/issues)
2. Crear un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir el bug
   - Comportamiento esperado vs. actual
   - Screenshots si aplica
   - Información del sistema (OS, Node version, etc.)

### Sugerir Mejoras

1. Crear un issue con la etiqueta "enhancement"
2. Describir claramente:
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas
   - Impacto en el sistema actual

### Pull Requests

1. **Fork** el repositorio
2. **Crear rama** desde `main`:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Hacer cambios** siguiendo las guías de estilo
4. **Testear** los cambios localmente
5. **Commit** con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar sensor de turbidez"
   ```
6. **Push** a tu fork:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
7. **Crear Pull Request** en GitHub

## 📝 Guías de Estilo

### Código JavaScript/Node.js

- Usar ES6+ features
- Indentación: 2 espacios
- Punto y coma al final de líneas
- Nombres descriptivos para variables y funciones
- Comentarios para lógica compleja

```javascript
// ✅ Bien
const calculateAverageTemperature = (readings) => {
  if (!readings || readings.length === 0) return 0;
  
  const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
  return sum / readings.length;
};

// ❌ Mal
function calc(r) {
  return r.reduce((a,b)=>a+b.v,0)/r.length
}
```

### Código Python (IoT Clients)

- Seguir PEP 8
- Indentación: 4 espacios
- Docstrings para funciones
- Type hints cuando sea posible

```python
# ✅ Bien
def read_temperature(pin: int) -> float:
    """
    Lee la temperatura del sensor conectado al pin especificado.
    
    Args:
        pin: Número de pin GPIO
        
    Returns:
        Temperatura en grados Celsius
    """
    raw_value = adc.read(pin)
    return convert_to_celsius(raw_value)

# ❌ Mal
def rt(p):
    return c(adc.read(p))
```

### SQL

- Keywords en MAYÚSCULAS
- Nombres de tablas y columnas en snake_case
- Indentación clara

```sql
-- ✅ Bien
SELECT 
    t.name,
    t.location,
    COUNT(s.id) as sensor_count
FROM tanks t
LEFT JOIN sensors s ON t.id = s.tank_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.location
ORDER BY sensor_count DESC;

-- ❌ Mal
select t.name,t.location,count(s.id) from tanks t left join sensors s on t.id=s.tank_id where t.is_active=true group by t.id;
```

### React/JSX

- Componentes en PascalCase
- Props descriptivas
- Hooks al inicio del componente
- PropTypes o TypeScript

```jsx
// ✅ Bien
const SensorCard = ({ sensorType, value, unit, timestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Efecto secundario
  }, [value]);
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{sensorType}</Typography>
        <Typography variant="h4">{value} {unit}</Typography>
      </CardContent>
    </Card>
  );
};

// ❌ Mal
function Card1(props) {
  return <div>{props.v}</div>
}
```

## 🧪 Testing

- Agregar tests para nuevas funcionalidades
- Mantener cobertura >80%
- Tests unitarios para lógica de negocio
- Tests de integración para APIs

```javascript
// Ejemplo de test
describe('Temperature Sensor', () => {
  it('should convert raw value to celsius', () => {
    const raw = 2048;
    const celsius = convertToCelsius(raw);
    expect(celsius).toBeCloseTo(25.0, 1);
  });
  
  it('should handle invalid input', () => {
    expect(() => convertToCelsius(null)).toThrow();
  });
});
```

## 📚 Documentación

- Actualizar README si cambias funcionalidad
- Documentar nuevos endpoints en API.md
- Agregar comentarios JSDoc/docstrings
- Actualizar CHANGELOG

```javascript
/**
 * Calcula el promedio de lecturas de sensor
 * @param {Array<Reading>} readings - Array de lecturas
 * @param {string} sensorType - Tipo de sensor a filtrar
 * @returns {number} Promedio de valores
 */
function calculateAverage(readings, sensorType) {
  // ...
}
```

## 🔍 Code Review

Tu código será revisado para:
- Calidad y legibilidad
- Performance
- Seguridad
- Tests adecuados
- Documentación actualizada

## 🌳 Estructura de Branches

- `main` - Código en producción
- `develop` - Integración de features
- `feature/*` - Nuevas funcionalidades
- `bugfix/*` - Correcciones de bugs
- `hotfix/*` - Correcciones urgentes

## 📦 Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar sensor de turbidez
fix: corregir cálculo de pH
docs: actualizar guía de instalación
style: formatear código backend
refactor: mejorar estructura de componentes
test: agregar tests de integración
chore: actualizar dependencias
```

## 🚀 Proceso de Release

1. Actualizar versión en `package.json`
2. Actualizar CHANGELOG.md
3. Crear tag de versión
4. Deploy a producción

## 📋 Checklist para Pull Request

- [ ] El código sigue las guías de estilo
- [ ] He realizado una auto-revisión del código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Tests nuevos y existentes pasan localmente
- [ ] He verificado que no hay conflictos

## 🎯 Áreas de Contribución

### Alta Prioridad
- [ ] Tests adicionales
- [ ] Mejoras de performance
- [ ] Optimización de queries SQL
- [ ] Mejoras en UI/UX
- [ ] Documentación de uso

### Media Prioridad
- [ ] Nuevos tipos de sensores
- [ ] Integración con más proveedores de notificaciones
- [ ] Dashboard móvil mejorado
- [ ] Exportación de datos en más formatos

### Fase 2 (Automatización)
- [ ] Control automático de aireadores
- [ ] Dosificación inteligente
- [ ] Modelos de ML para predicción
- [ ] Optimización energética

## 💬 Comunicación

- **GitHub Issues** - Bugs y features
- **Pull Requests** - Discusión de código
- **Discussions** - Preguntas generales

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones estarán bajo la misma licencia MIT del proyecto.

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el README y CONTRIBUTORS.md

---

¡Gracias por hacer mejor este proyecto! 🎉
