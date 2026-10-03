// app.js - cliente movil que consume el servicio REST del mismo proyecto.
const API = '/api';
let insumos = [];
let categoríaActual = '';
const carrito = new Map();

async function cargarInsumos(categoría = '') {
  categoríaActual = categoría;
  const url = categoría
    ? `${API}/insumos?categoría=${encodeURIComponent(categoría)}`
    : `${API}/insumos`;

  ocultarMensaje();

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    insumos = await resp.json();
    aplicarBusqueda();
  } catch (error) {
    mostrarMensaje(`No se pudo cargar el catálogo: ${error.message}`);
  }
}

function dibujar(datos) {
  const lista = document.getElementById('lista');
  lista.innerHTML = '';

  if (datos.length === 0) {
    lista.innerHTML = '<p>No se encontraron insumos.</p>';
    return;
  }

  datos.forEach(i => {
    const alerta = i.existencias < 10
      ? '<span class="alerta">Pocas existencias</span>'
      : '';

    lista.insertAdjacentHTML('beforeend', `
      <article class="tarjeta">
        <h2>${i.nombre}</h2>
        <small>${i.categoría} · ${i.unidad}</small>
        <p class="precio"><strong>Q${i.precio.toFixed(2)}</strong></p>
        <p>${i.existencias} disponibles ${alerta}</p>
        <div class="acciones">
          <input class="cantidad" id="cantidad-${i.id}" type="number" min="1" max="${i.existencias}" value="1" aria-label="Cantidad de ${i.nombre}">
          <button class="boton-agregar" type="button" onclick="agregar(${i.id})">Agregar</button>
        </div>
      </article>
    `);
  });
}

function aplicarBusqueda() {
  const texto = document.getElementById('buscar').value.toLowerCase().trim();
  const filtrados = insumos.filter(i => i.nombre.toLowerCase().includes(texto));
  dibujar(filtrados);
}

function agregar(id) {
  const insumo = insumos.find(i => i.id === id);
  const campo = document.getElementById(`cantidad-${id}`);
  const cantidad = Number(campo.value);

  if (!insumo || !Number.isInteger(cantidad) || cantidad <= 0) {
    mostrarMensaje('Ingresa una cantidad válida.');
    return;
  }

  carrito.set(id, { insumo, cantidad });
  ocultarMensaje();
  dibujarResumen();
}

function dibujarResumen() {
  const resumen = document.getElementById('resumen');
  const contador = document.getElementById('contador');
  const items = [...carrito.values()];
  const totalUnidades = items.reduce((suma, item) => suma + item.cantidad, 0);

  contador.textContent = `${items.length} insumo${items.length === 1 ? '' : 's'} · ${totalUnidades} unidad${totalUnidades === 1 ? '' : 'es'}`;

  if (items.length === 0) {
    resumen.className = 'resumen-vacio';
    resumen.textContent = 'Todavía no has agregado insumos.';
    return;
  }

  resumen.className = '';
  resumen.innerHTML = items.map(item => `
    <div class="resumen-item">
      <strong>${item.insumo.nombre}</strong><br>
      ${item.cantidad} × Q${item.insumo.precio.toFixed(2)}
    </div>
  `).join('');
}

async function solicitarCotización(evento) {
  evento.preventDefault();

  const cliente = document.getElementById('cliente').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const items = [...carrito.values()].map(item => ({
    insumoId: item.insumo.id,
    cantidad: item.cantidad
  }));

  const resultado = document.getElementById('resultado');
  resultado.hidden = true;
  resultado.className = 'resultado';

  try {
    const resp = await fetch(`${API}/cotizaciónes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente, telefono, items })
    });

    const datos = await resp.json();

    if (resp.status === 201) {
      resultado.innerHTML = `
        <strong>Cotización #${datos.id}</strong><br>
        Subtotal: Q${datos.subtotal.toFixed(2)}<br>
        Descuento: Q${datos.descuento.toFixed(2)}<br>
        <strong>Total: Q${datos.total.toFixed(2)}</strong>
      `;
      resultado.hidden = false;
      carrito.clear();
      dibujarResumen();
      document.getElementById('formCotización').reset();
      return;
    }

    resultado.textContent = datos.mensaje || 'No se pudo crear la cotización.';
    resultado.className = 'resultado error';
    resultado.hidden = false;
  } catch (error) {
    resultado.textContent = `No se pudo conectar con el servidor: ${error.message}`;
    resultado.className = 'resultado error';
    resultado.hidden = false;
  }
}

function mostrarMensaje(texto) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.hidden = false;
}

function ocultarMensaje() {
  document.getElementById('mensaje').hidden = true;
}

// Filtro por categoría: cada boton vuelve a consultar al servidor.
document.querySelectorAll('.chip').forEach(boton => {
  boton.addEventListener('click', async () => {
    document.querySelectorAll('.chip').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    await cargarInsumos(boton.dataset.categoría || '');
  });
});

// Busqueda en vivo por nombre sobre la categoría cargada.
document.getElementById('buscar').addEventListener('input', aplicarBusqueda);
document.getElementById('formCotización').addEventListener('submit', solicitarCotización);

// Registrar el service worker para convertir el sitio en PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('No se pudo registrar el service worker:', error);
    });
  });
}

cargarInsumos();
dibujarResumen();
