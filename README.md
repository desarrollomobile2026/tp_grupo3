# Proyecto Base: Catálogo Mobile-First con Firebase

Este repositorio funciona como modelo de referencia para clases y trabajos prácticos.
El objetivo es que puedan tomar una base técnica ya funcional y adaptarla a la identidad visual y funcional de su propio proyecto.

La aplicación implementa un catálogo dinámico conectado a Firebase Firestore, con una experiencia centrada en dispositivos móviles.

## Objetivo pedagógico

Este proyecto permite practicar, en un caso real y simple, los siguientes contenidos:

- Estructura de interfaz en HTML y CSS con enfoque mobile-first.
- Lógica de interacción en JavaScript vanilla.
- Integración con base de datos NoSQL en tiempo real (Firestore).
- Persistencia local de estado de compra con LocalStorage.
- Adaptación de una base técnica a un diseño de producto definido en Figma.

## Funcionalidades implementadas

- Visualización de productos por categorías.
- Búsqueda por nombre en tiempo real.
- Sistema de likes para destacar contenido.
- Sección de destacados ordenada por interacción.
- Carrito con almacenamiento local.
- Alta y baja de elementos en Firestore.

## Stack tecnológico

- HTML5
- CSS3
- JavaScript vanilla
- Firebase Firestore (SDK compat)

## Requisitos

- Navegador moderno (Chrome, Edge o Firefox).
- Proyecto de Firebase creado.
- Firestore Database habilitado.

## Configuración inicial

1. Crear o usar un proyecto en Firebase.
2. Habilitar Firestore Database.
3. Completar los datos de configuración en config.js con el objeto firebaseConfig.
4. Verificar que index.html cargue los scripts de Firebase compat:
  - https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
  - https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js

## Estructura del proyecto

```text
.
|- index.html   # Vistas, navegación y modales
|- style.css    # Estilos de interfaz mobile-first
|- app.js       # Lógica de UI, carrito y operaciones Firestore
|- config.js    # Configuración local de Firebase
|- README.md
```

## Modelo de datos sugerido

Colección principal: productos

Ejemplo de documento:

```js
{
  nombre: string,
  precio: number,
  categoria: string,
  foto_url: string,
  descripcion: string,
  likes: number
}
```

## Consigna de adaptación (Figma + implementación)

Usen este repositorio como plantilla base para su proyecto final.

Cada equipo debe:

1. Tomar este modelo y acercarlo al diseño que ya tienen definido en Figma.
2. Adaptar los productos de ejemplo a sus propios productos.
3. Si su proyecto es de servicios, reemplazar los productos por sus servicios.
4. Ajustar textos, imágenes, categorías y nombres según su propuesta.
5. Mantener coherencia visual entre lo diseñado en Figma y lo implementado en la app.

Nota: esta actividad se enfoca en la adaptación del diseño y del contenido del proyecto, no en una complejidad técnica adicional.

## Uso rápido

1. Abrir index.html en el navegador.
2. Navegar por inicio, productos, favoritos y carrito.
3. Crear, visualizar y eliminar ítems para validar el flujo completo.
4. Verificar que los cambios de Firestore se reflejen en tiempo real.

## Criterios recomendados de evaluación

- Coherencia entre diseño (Figma) y desarrollo.
- Funcionamiento general del prototipo en la app.
- Calidad de experiencia de usuario en mobile.
- Claridad de estructura y mantenibilidad del código.
- Adaptación correcta al dominio elegido (productos o servicios).
