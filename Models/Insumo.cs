namespace AgroCosechaMovil.Models;

// Un insumo agricola del catalogo de Agroservicio La Cosecha
public record Insumo(
    int Id,
    string Nombre,
    string Categoria,
    string Unidad,
    decimal Precio,
    int Existencias);
