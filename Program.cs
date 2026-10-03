using AgroCosechaMovil.Models;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Permite servir index.html, CSS, JavaScript, manifest e iconos desde wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();

// Catalogo en memoria solicitado por la tarea.
var insumos = new List<Insumo>
{
    new(1, "Semilla de maíz ICTA HB-83", "Semillas", "bolsa 10 lb", 185.00m, 40),
    new(2, "Semilla de frijol negro ICTA", "Semillas", "libra", 12.50m, 120),
    new(3, "Fertilizante 15-15-15", "Fertilizantes", "saco 45 kg", 295.00m, 25),
    new(4, "Urea 46 %", "Fertilizantes", "saco 45 kg", 310.00m, 8),
    new(5, "Abono orgánico (bocashi)", "Fertilizantes", "saco 25 kg", 65.00m, 60),
    new(6, "Machete 22 pulgadas", "Herramientas", "unidad", 55.00m, 30),
    new(7, "Bomba de mochila 16 L", "Herramientas", "unidad", 425.00m, 5),
    new(8, "Fungicida a base de cobre", "Protección", "kilogramo", 98.00m, 18)
};

// Lista donde se guardan las cotizaciones.
var cotizaciones = new List<Cotizacion>();


// GET /api/insumos?categoria=Semillas
// Si no se envia categoria, devuelve todo el catalogo.
app.MapGet("/api/insumos", (string? categoria) =>
    string.IsNullOrWhiteSpace(categoria)
        ? insumos
        : insumos
            .Where(i => i.Categoria.Equals(
                categoria,
                StringComparison.OrdinalIgnoreCase))
            .ToList()
);


// GET /api/insumos/3
app.MapGet("/api/insumos/{id:int}", (int id) =>
    insumos.FirstOrDefault(i => i.Id == id) is Insumo encontrado
        ? Results.Ok(encontrado)
        : Results.NotFound(new
        {
            mensaje = $"No existe el insumo {id}"
        })
);


// POST /api/cotizaciones
app.MapPost("/api/cotizaciones", (CotizacionNueva datos) =>
{
    // 1. Validar nombre del cliente.
    if (string.IsNullOrWhiteSpace(datos.Cliente))
    {
        return Results.BadRequest(new
        {
            mensaje = "El nombre del cliente es obligatorio."
        });
    }


    // 2. Validar telefono: exactamente 8 digitos numericos.
    if (string.IsNullOrWhiteSpace(datos.Telefono) ||
        datos.Telefono.Length != 8 ||
        !datos.Telefono.All(char.IsDigit))
    {
        return Results.BadRequest(new
        {
            mensaje = "El teléfono debe tener exactamente 8 dígitos numéricos."
        });
    }


    // 3. Debe existir al menos un item.
    if (datos.Items is null || datos.Items.Count == 0)
    {
        return Results.BadRequest(new
        {
            mensaje = "Debe agregar al menos un insumo a la cotización."
        });
    }


    decimal subtotal = 0m;


    foreach (var item in datos.Items)
    {
        var insumo = insumos.FirstOrDefault(
            i => i.Id == item.InsumoId
        );


        // 4. Validar que el insumo exista.
        if (insumo is null)
        {
            return Results.BadRequest(new
            {
                mensaje = $"No existe el insumo {item.InsumoId}."
            });
        }


        // Validar que la cantidad sea mayor que cero.
        if (item.Cantidad <= 0)
        {
            return Results.BadRequest(new
            {
                mensaje = $"La cantidad de {insumo.Nombre} debe ser mayor que 0."
            });
        }


        // 5. Validar que haya suficientes existencias.
        if (item.Cantidad > insumo.Existencias)
        {
            return Results.BadRequest(new
            {
                mensaje = $"Solo hay {insumo.Existencias} de {insumo.Nombre}"
            });
        }


        // Sumar al subtotal.
        subtotal += insumo.Precio * item.Cantidad;
    }


    // Redondear subtotal.
    subtotal = Math.Round(subtotal, 2);


    // Aplicar 5 % de descuento cuando el subtotal sea Q1,000 o mas.
    decimal descuento =
        subtotal >= 1000m
            ? Math.Round(subtotal * 0.05m, 2)
            : 0m;


    // Calcular total.
    decimal total =
        Math.Round(subtotal - descuento, 2);


    // Crear la cotizacion.
    var cotizacion = new Cotizacion(
        cotizaciones.Count + 1,
        datos.Cliente.Trim(),
        datos.Telefono,
        datos.Items,
        subtotal,
        descuento,
        total,
        DateTime.Now
    );


    // Guardar la cotizacion.
    cotizaciones.Add(cotizacion);


    // Responder 201 Created.
    return Results.Created(
        $"/api/cotizaciones/{cotizacion.Id}",
        cotizacion
    );
});


// GET /api/cotizaciones
app.MapGet(
    "/api/cotizaciones",
    () => cotizaciones
);


app.Run();