// 1. INICIALIZACIÓN Y CONFIGURACIÓN VIA CONFIG.JS
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. REFERENCIAS DEL DOM (Elementos de la Interfaz)
const modal = document.getElementById("modal-detalle");
const btnClose = document.querySelector(".close-button");
const contenedor = document.getElementById('contenedor-productos');
const tituloApp = document.getElementById('titulo-app');
const btnLike = document.getElementById("btn-like");
const buscador = document.getElementById('input-buscador-inventario');
const contenedorDestacados = document.getElementById('contenedor-destacados');
const btnAnadirCarrito = document.querySelector("#modal-detalle .btn-comprar");
const modalAgregar = document.getElementById('modal-agregar');

// Variables de control de estado (State Management)
let productoActualId = null;
let todosLosProductos = []; 
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let firebaseListener = null; 
let categoriaActual = null;

// 3. CONTROL DE VISTAS (Navegación SPA) - CORREGIDA PARA FIGMA
function cambiarPantalla(pantalla) {
    const vistas = ['inicio', 'productos', 'carrito'];
    vistas.forEach(v => {
        const viewEl = document.getElementById(`view-${v}`);
        if (viewEl) viewEl.style.display = 'none';
    });
    
    const btnAgregar = document.getElementById('btn-agregar-flotante');
    if (btnAgregar) btnAgregar.style.display = 'none';
    
    const vistaActiva = document.getElementById(`view-${pantalla === 'favoritos' ? 'productos' : pantalla}`);
    if (vistaActiva) vistaActiva.style.display = 'block';

    switch (pantalla) {
        case 'inicio':
            if (tituloApp) tituloApp.innerText = "Reina Stock";
            break;
        case 'productos':
            if (btnAgregar) btnAgregar.style.display = 'flex'; 
            cargarProductos(); 
            break;
        case 'favoritos':
            cargarProductos("favoritos");
            break;
        case 'carrito':
            if (typeof actualizarVistaCarrito === "function") actualizarVistaCarrito();
            break;
    }

    // Cambiar clase active en el menú inferior
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const itemsNav = document.querySelectorAll('.bottom-nav .nav-item');
    if (pantalla === 'inicio' && itemsNav[0]) itemsNav[0].classList.add('active');
    if (pantalla === 'productos' && itemsNav[1]) itemsNav[1].classList.add('active');
    if (pantalla === 'favoritos' && itemsNav[2]) itemsNav[2].classList.add('active');
}
// 4. LOGICA DE PRODUCTOS (Firestore Integration)
// 4. LOGICA DE PRODUCTOS (Firestore Integration) - CORREGIDA
function cargarProductos(tipo = null) {
    if (firebaseListener) firebaseListener(); // Desvincular listener anterior para optimizar memoria

    let consulta = db.collection("productos");
    
    if (tipo === "favoritos") {
        consulta = consulta.where("likes", ">", 0).orderBy("likes", "desc");
    } else if (tipo) {
        consulta = consulta.where("categoria", "==", tipo);
        
        // CAMBIO PROTEGIDO: Solo cambia el texto si existe 'tituloApp' en la pantalla
        if (tituloApp) {
            tituloApp.innerText = "Categoría: " + tipo.charAt(0).toUpperCase() + tipo.slice(1);
        }
    }

    firebaseListener = consulta.onSnapshot((snapshot) => {
        if (contenedor) contenedor.innerHTML = '';
        if (snapshot.empty) {
            if (contenedor) contenedor.innerHTML = '<p class="sin-datos">No hay productos disponibles en esta sección.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            
            if (!todosLosProductos.find(p => p.id === id)) {
                todosLosProductos.push({ id, ...data });
            }
            renderizarCard(id, data);
        });
    }, error => console.error("Error en tiempo real: ", error));
}

function cargarDestacados() {
    if (!contenedorDestacados) return;

    db.collection("productos")
        .where("likes", ">", 0)
        .orderBy("likes", "desc")
        .limit(5)
        .onSnapshot((snapshot) => {
            contenedorDestacados.innerHTML = '';

            if (snapshot.empty) {
                contenedorDestacados.innerHTML = '<p class="destacados-vacios">Interactúa con los productos para ver tendencias.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                const card = document.createElement('div');
                card.className = 'card';
                card.onclick = () => verDetalle(id, data.nombre, data.precio, data.foto_url, data.descripcion, data.likes);

                card.innerHTML = `
                    <img src="${data.foto_url || 'https://via.placeholder.com/200'}" alt="${data.nombre}">
                    <div class="card-info">
                        <div class="card-info-header">
                            <h3>${data.nombre}</h3>
                            <span class="badge-likes">❤️ ${data.likes}</span>
                        </div>
                        <p class="precio">$${data.precio}</p>
                    </div>
                `;
                contenedorDestacados.appendChild(card);
            });
        });
}

function renderizarCard(id, data) {
    if (!contenedor) return; // Protección por si no encuentra el contenedor
    
    const card = document.createElement('div');
    card.className = 'card-inventario'; 
    
    const talle = data.talle || "Único";
    const stock = data.stock !== undefined ? data.stock : 0;
    
    // Configuración exacta de alertas visuales según tu prototipo
    let colorEstado = "#34a853"; // Verde por defecto: Stock cómodo
    
    if (stock <= 3) {
        colorEstado = "#ea4335"; // Rojo: Alerta crítica
    } else if (stock <= 5) {
        colorEstado = "#fbbc05"; // Amarillo: Alerta moderada
    }

    card.innerHTML = `
        <div class="card-inventario-izquierda">
            <span class="circulo-estado" style="background-color: ${colorEstado};"></span>
            <div class="card-inventario-info">
                <h3>${data.nombre}</h3>
                <p>Talle: <strong>${talle}</strong></p>
                <p>Stock: <strong>${stock}</strong></p>
            </div>
        </div>
        <div class="card-inventario-derecha">
            <img src="${data.foto_url || 'https://via.placeholder.com/200'}" alt="${data.nombre}">
            <button class="btn-borrar-db-flotante" onclick="eliminarProducto('${id}', event)">🗑️</button>
        </div>
    `;
    
    contenedor.appendChild(card);
}


// 5. MODAL DETALLE Y ACCIONES SOCIALES (Social Commerce)
function verDetalle(id, nombre, precio, foto_url, descripcion, likes) {
    productoActualId = id;
    document.getElementById("modal-titulo").innerText = nombre;
    document.getElementById("modal-precio").innerText = "$" + precio;
    document.getElementById("modal-img").src = foto_url || 'https://via.placeholder.com/200';
    
    const descElement = document.querySelector(".descripcion");
    if (descElement) descElement.innerText = descripcion || "Sin descripción disponible.";

    if (btnLike) btnLike.innerText = (likes > 0) ? "❤️ " + likes : "🤍";
    modal.style.display = "flex";
}

if (btnLike) {
    btnLike.onclick = () => {
        if (productoActualId) {
            db.collection("productos").doc(productoActualId).update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            btnLike.innerText = "❤️";
        }
    };
}

if (btnClose) btnClose.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// 6. FLUJO DE COMPRA (Conversion Funnel)
function agregarAlCarrito() {
    const producto = todosLosProductos.find(p => p.id === productoActualId);
    if (producto) {
        carrito.push(producto);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarVistaCarrito(); 
        modal.style.display = "none";
    }
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalElemento = document.getElementById('precio-total');
    if (!lista || !totalElemento) return;

    lista.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<div class="carrito-vacio-msg"><p>Tu carrito está vacío 🛒</p></div>';
        totalElemento.innerText = '$0';
        return;
    }

    carrito.forEach((prod, index) => {
        total += Number(prod.precio);
        const item = document.createElement('div');
        item.className = 'item-carrito';
        item.innerHTML = `
            <img src="${prod.foto_url || 'https://via.placeholder.com/200'}">
            <div class="item-carrito-desc">
                <h4>${prod.nombre}</h4>
                <p>$${prod.precio}</p>
            </div>
            <button onclick="eliminarDelCarrito(${index})" class="btn-eliminar-item">🗑️</button>
        `;
        lista.appendChild(item);
    });
    totalElemento.innerText = `$${total}`;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarVistaCarrito();
}

function finalizarCompra() {
    if (carrito.length === 0) {
        alert("El carrito no contiene productos activos para procesar.");
        return;
    }
    alert("¡Orden procesada con éxito! Gracias por tu compra.");
    carrito = [];
    localStorage.removeItem('carrito');
    actualizarVistaCarrito();
    cambiarPantalla('inicio');
}

// 7. MOTOR DE BUSQUEDA INTERNO (Internal Search Optimization)
if (buscador) {
    buscador.oninput = (e) => {
        const texto = e.target.value.toLowerCase();
        if (texto.length > 0) {
            document.getElementById('view-inicio').style.display = 'none';
            document.getElementById('view-productos').style.display = 'block';
        }
        const filtrados = todosLosProductos.filter(p => p.nombre.toLowerCase().includes(texto));
        contenedor.innerHTML = '';
        filtrados.forEach(p => renderizarCard(p.id, p));
    };
}

// 8. GESTIÓN DE CATÁLOGO (Funciones de Administrador)
function abrirModalAgregar() {
    modalAgregar.style.display = 'flex';
    if (categoriaActual) {
        document.getElementById('add-categoria').value = categoriaActual;
    }
}

function cerrarModalAgregar() {
    modalAgregar.style.display = 'none';
    document.getElementById('add-nombre').value = '';
    document.getElementById('add-talle').value = '';
    document.getElementById('add-stock').value = '';
    document.getElementById('add-foto').value = '';
}

function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const talle = document.getElementById('add-talle').value;
    const stock = document.getElementById('add-stock').value;
    const categoria = document.getElementById('add-categoria').value;
    const foto = document.getElementById('add-foto').value;

    if (!nombre || stock === "") {
        alert("Por favor, complete los campos mandatorios (Nombre y Stock).");
        return;
    }

    // Guarda en Firebase usando los nuevos campos de tu Figma
    db.collection("productos").add({
        nombre: nombre,
        talle: talle || "Único",
        stock: Number(stock), 
        categoria: categoria,
        foto_url: foto || 'https://via.placeholder.com/200'
    })
    .then(() => {
        cerrarModalAgregar();
    })
    .catch((error) => console.error("Error al guardar el producto:", error));
}

function eliminarProducto(id, event) {
    event.stopPropagation(); // Evita el efecto burbuja en la UX

    const confirmacion = confirm("¿Está seguro de eliminar definitivamente este ítem del catálogo general?");
    if (confirmacion) {
        db.collection("productos").doc(id).delete()
        .catch((error) => console.error("Error de eliminación en base de datos:", error));
    }
}

// INICIALIZACIÓN GLOBAL
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarDestacados();
});