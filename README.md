# 📚 Biblioteca Digital — Arquitectura MVC

Sistema de gestión de biblioteca digital con arquitectura MVC, POO y API REST.

## 📦 Instalación

```bash
npm install
npm start          # producción
npm run dev        # desarrollo con nodemon (auto-reload)
```

Abre **http://localhost:3000**

---

## 🏗️ Arquitectura del Proyecto

```
biblioteca-digital/
│
├── app.js                         # Entrada principal: Express, middlewares, rutas
│
├── src/
│   ├── config/
│   │   └── database.js            # Rutas y configuración de la DB por entorno
│   │
│   ├── database/
│   │   └── db.json                # Base de datos JSON (editable directamente)
│   │
│   ├── models/                    ← POO: Entidades del dominio
│   │   ├── BaseModel.js           # Clase base abstracta (id, timestamps, validate, toJSON)
│   │   ├── Document.js            # Modelo Documento (fileTypeMeta, previewUrl, downloadUrl...)
│   │   ├── Folder.js              # Modelo Carpeta (árbol jerárquico, breadcrumb)
│   │   └── Category.js            # Modelo Categoría (color, icon, documentCount)
│   │
│   ├── repositories/              ← Capa de acceso a datos (patrón Repository)
│   │   ├── BaseRepository.js      # CRUD genérico: findAll, findById, create, update, delete
│   │   ├── DocumentRepository.js  # search(), findByCategory(), findFeatured(), getStats()
│   │   ├── FolderRepository.js    # buildTree(), findChildren(), findRoots()
│   │   └── CategoryRepository.js  # createCategory()
│   │
│   ├── controllers/               ← Lógica de negocio y orquestación
│   │   ├── DocumentController.js  # index, show, new, create, edit, update, archive, download
│   │   ├── FolderController.js    # index, show, create, update, delete
│   │   └── SearchController.js    # SearchController + CategoryController
│   │
│   ├── routes/                    ← Definición de rutas HTTP
│   │   ├── index.js               # GET /  (dashboard)
│   │   ├── documentRoutes.js      # CRUD /documents
│   │   ├── folderRoutes.js        # CRUD /folders
│   │   ├── categoryRoutes.js      # CRUD /categories
│   │   ├── searchRoutes.js        # GET /search
│   │   └── apiRoutes.js           # REST API /api/...
│   │
│   ├── middleware/
│   │   ├── errorHandler.js        # Manejo global de errores (500)
│   │   └── notFound.js            # 404
│   │
│   └── services/                  # (para lógica extra futura)
│
├── views/                         ← Templates EJS (View en MVC)
│   ├── layouts/
│   │   └── main.ejs               # Layout principal: sidebar, topbar, nav
│   ├── index.ejs                  # Dashboard: hero, categorías, destacados, recientes
│   ├── documents/
│   │   ├── _card.ejs              # Partial: tarjeta de documento (reutilizable)
│   │   ├── index.ejs              # Listado con filtros
│   │   ├── show.ejs               # Vista detalle + iframe preview
│   │   └── form.ejs               # Formulario crear/editar
│   ├── folders/
│   │   ├── index.ejs              # Árbol de carpetas
│   │   └── show.ejs               # Contenido de carpeta
│   ├── categories/
│   │   ├── index.ejs              # Grilla de categorías
│   │   └── show.ejs               # Documentos por categoría
│   ├── search/
│   │   └── results.ejs            # Resultados de búsqueda
│   └── errors/
│       ├── 404.ejs
│       └── 500.ejs
│
└── public/
    ├── css/main.css               # Estilos (dark theme, tipografía, responsive)
    └── js/main.js                 # Interacciones: sidebar, animaciones, confirmar

```

---

## 🔗 Rutas disponibles

| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/`                           | Dashboard principal                |
| GET    | `/documents`                  | Listado con filtros                |
| GET    | `/documents/new`              | Formulario nuevo documento         |
| POST   | `/documents`                  | Crear documento                    |
| GET    | `/documents/:id`              | Vista detalle + preview            |
| GET    | `/documents/:id/edit`         | Formulario edición                 |
| PUT    | `/documents/:id`              | Actualizar documento               |
| DELETE | `/documents/:id`              | Archivar documento                 |
| GET    | `/documents/:id/download`     | Registrar descarga y redirigir     |
| GET    | `/folders`                    | Árbol de carpetas                  |
| GET    | `/folders/:id`                | Documentos de una carpeta          |
| GET    | `/categories`                 | Listado de categorías              |
| GET    | `/categories/:id`             | Documentos de una categoría        |
| GET    | `/search?q=...`               | Búsqueda con filtros               |
| GET    | `/api/documents`              | API REST — todos los documentos    |
| GET    | `/api/documents/:id`          | API REST — documento por ID        |
| POST   | `/api/documents`              | API REST — crear                   |
| PUT    | `/api/documents/:id`          | API REST — actualizar              |
| DELETE | `/api/documents/:id`          | API REST — eliminar                |
| GET    | `/api/categories`             | API REST — categorías              |
| GET    | `/api/folders`                | API REST — árbol de carpetas       |

---

## 🗄️ Cómo actualizar la base de datos

Abre `src/database/db.json` y editá directamente el array `documents`:

```json
{
  "id": "doc-010",
  "title": "Mi nuevo documento",
  "slug": "mi-nuevo-documento",
  "description": "Descripción del documento.",
  "categoryId": "cat-001",
  "folderId": "fld-002",
  "fileType": "PDF",
  "driveId": "PEGAR_EL_ID_DE_DRIVE_AQUI",
  "driveUrl": "https://drive.google.com/file/d/PEGAR_EL_ID_DE_DRIVE_AQUI/view",
  "tags": ["etiqueta1", "etiqueta2"],
  "status": "active",
  "featured": false,
  "downloadCount": 0,
  "createdAt": "2024-06-01T00:00:00.000Z",
  "updatedAt": "2024-06-01T00:00:00.000Z"
}
```

**¿Cómo obtengo el driveId?**  
En el link de Drive: `drive.google.com/file/d/`**`1BxiMVs0XRA5nFMdK`**`/view`  
Ese código entre `/d/` y `/view` es el ID.

**Importante:** El archivo en Drive debe tener permisos de "Cualquier persona con el enlace puede ver" para que el iframe de preview funcione.

---

## 🧩 Cómo agregar una nueva entidad

1. Crear el modelo en `src/models/MiEntidad.js` extendiendo `BaseModel`
2. Crear el repositorio en `src/repositories/MiEntidadRepository.js` extendiendo `BaseRepository`
3. Crear el controlador en `src/controllers/MiEntidadController.js`
4. Registrar las rutas en `src/routes/miEntidadRoutes.js` y en `app.js`
5. Crear las vistas en `views/mi-entidad/`
6. Agregar la colección en `src/database/db.json`

---

## ⚙️ Variables de entorno (.env)

```env
PORT=3000
NODE_ENV=development
```
