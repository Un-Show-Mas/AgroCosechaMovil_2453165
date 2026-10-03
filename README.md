# Agroservicio La Cosecha - Catálogo móvil (Tarea 6)

**Estudiante:** TU NOMBRE COMPLETO - Carné TU-CARNE

## Descripción

Prototipo de aplicación web móvil (PWA) para Agroservicio La Cosecha. Permite consultar insumos agrícolas, filtrar por categoría, buscar por nombre, agregar productos a una cotización y solicitar el calculo al servidor. El servidor aplica un 5 % de descuento cuando el subtotal es igual o mayor a Q1,000.00.

## Cómo ejecutar

Desde la carpeta principal del proyecto:

```bash
dotnet run --urls "http://localhost:5090"
```

Luego abrir en el navegador:

http://localhost:5090

## Endpoints

| Verbo | Ruta | Descripción |
|---|---|---|
| GET | `/api/insumos` | Lista todos los insumos y acepta `?categoría=...` |
| GET | `/api/insumos/{id}` | Devuelve un insumo o 404 si no existe |
| POST | `/api/cotizaciónes` | Valida y crea una cotización |
| GET | `/api/cotizaciónes` | Lista las cotizaciónes creadas |

## Repositorio

REEMPLAZAR CON EL ENLACE PUBLICO DE GITHUB
