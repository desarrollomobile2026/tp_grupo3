// 1. INICIALIZACIÓN Y CONFIGURACIÓN VIA CONFIG.JS
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. REFERENCIAS DEL DOM (Elementos de la Interfaz)
const modal = document.getElementById("modal-detalle");
const btnClose = document.querySelector(".close-button");
const contenedor = document.getElementById('contenedor-productos');
const tituloApp = document.getElementById('titulo-app');
const btnLike = document.getElementById("btn-like");
const buscador = document.getElementById('input-buscador');
const contenedorDestacados = document.getElementById('contenedor-destacados');
const btnAnadirCarrito = document.querySelector("#modal-detalle .btn-comprar");
const modalAgregar = document.getElementById('modal-agregar');

// Variables de control de estado (State Management)
let productoActualId = null;
let todosLosProductos = []; 
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let firebaseListener = null; 
let categoriaActual = null;

// 3. CONTROL DE VISTAS (Navegación SPA)
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
            tituloApp.innerText = "Mi Tienda";
            if (buscador) buscador.value = "";
            break;
        case 'productos':
            tituloApp.innerText = "Todos los productos";
            cargarProductos(); 
            break;
        case 'favoritos':
            tituloApp.innerText = "Mis Favoritos ❤️";
            cargarProductos("favoritos");
            break;
        case 'carrito':
            tituloApp.innerText = "Mi Carrito";
            actualizarVistaCarrito();
            break;
    }
}

function filtrarCategoria(cat) {
    categoriaActual = cat;
    cambiarPantalla('productos');
    
    const btnAgregar = document.getElementById('btn-agregar-flotante');
    if (btnAgregar) btnAgregar.style.display = 'flex';
    
    cargarProductos(cat); 
}

// 4. LOGICA DE PRODUCTOS (Firestore Integration)
function cargarProductos(tipo = null) {
    if (firebaseListener) firebaseListener(); // Desvincular listener anterior para optimizar memoria

    let consulta = db.collection("productos");
    
    if (tipo === "favoritos") {
        consulta = consulta.where("likes", ">", 0).orderBy("likes", "desc");
    } else if (tipo) {
        consulta = consulta.where("categoria", "==", tipo);
        tituloApp.innerText = "Categoría: " + tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }

    firebaseListener = consulta.onSnapshot((snapshot) => {
        contenedor.innerHTML = '';
        if (snapshot.empty) {
            contenedor.innerHTML = '<p class="sin-datos">No hay productos disponibles en esta sección.</p>';
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
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => verDetalle(id, data.nombre, data.precio, data.foto_url, data.descripcion, data.likes);
    
    card.innerHTML = `
        <div class="card-img-container">
            <img src="${data.foto_url || 'https://via.placeholder.com/200'}" alt="${data.nombre}">
            <button class="btn-borrar-db" onclick="eliminarProducto('${id}', event)">🗑️</button>
        </div>
        <div class="card-info">
            <div class="card-info-header">
                <h3>${data.nombre}</h3>
                <span>${data.likes > 0 ? '❤️ ' + data.likes : ''}</span>
            </div>
            <p class="precio">$${data.precio}</p>
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
    document.getElementById('add-precio').value = '';
    document.getElementById('add-foto').value = '';
    document.getElementById('add-desc').value = '';
}

function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const foto = document.getElementById('add-foto').value;
    const desc = document.getElementById('add-desc').value;

    if (!nombre || !precio) {
        alert("Por favor, complete los campos mandatorios (Nombre y Precio).");
        return;
    }

    db.collection("productos").add({
        nombre: nombre,
        precio: Number(precio), 
        categoria: categoria,
        foto_url: foto || 'https://via.placeholder.com/200', 
        descripcion: desc,
        likes: 0 
    })
    .then(() => {
        cerrarModalAgregar();
    })
    .catch((error) => console.error("Error al persistir el alta de producto:", error));
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