# 📚 Biblioteca Digital — MVC + Google Drive

Sistema de gestión de documentos institucionales con arquitectura **MVC**, **POO**, **API REST** y previsualización desde **Google Drive**.

---

## ⚡ Instalación rápida

```bash
npm install
npm run dev       # desarrollo (nodemon)
npm start         # producción
```

Abre **http://localhost:3000**

---

## 🗂️ Estructura de carpetas

```
biblioteca-digital/
│
├── app.js                              # Entrada principal · Express + middlewares + rutas
├── package.json
├── .env                                # PORT=3000 / NODE_ENV=development
│
├── src/                                # ← Backend (ya existente y funcional)
│   ├── config/
│   │   └── database.js                 # Configuración de la DB por entorno
│   │
│   ├── database/
│   │   └── db.json                     # Base de datos JSON (editable directamente)
│   │
│   ├── models/                         ← POO: Entidades del dominio
│   │   ├── BaseModel.js                # Clase base (id, timestamps, validate, toJSON)
│   │   ├── Document.js                 # driveId, previewUrl, downloadUrl, fileTypeMeta
│   │   ├── Folder.js                   # Árbol jerárquico, breadcrumb
│   │   └── Category.js                 # color, icon, documentCount
│   │
│   ├── repositories/                   ← Patrón Repository (acceso a datos)
│   │   ├── BaseRepository.js           # CRUD genérico
│   │   ├── DocumentRepository.js       # search, findFeatured, getStats
│   │   ├── FolderRepository.js         # buildTree, findChildren, findRoots
│   │   └── CategoryRepository.js
│   │
│   ├── controllers/                    ← Lógica de negocio
│   │   ├── DocumentController.js       # index, show, new, create, edit, update, archive, download
│   │   ├── FolderController.js         # index, show
│   │   └── SearchController.js         # search + CategoryController
│   │
│   ├── routes/                         ← Rutas HTTP
│   │   ├── index.js                    # GET /
│   │   ├── documentRoutes.js           # CRUD /documents
│   │   ├── folderRoutes.js             # /folders
│   │   ├── categoryRoutes.js           # /categories
│   │   ├── searchRoutes.js             # /search
│   │   └── apiRoutes.js                # REST API /api/...
│   │
│   └── middleware/
│       ├── errorHandler.js             # 500
│       └── notFound.js                 # 404
│
├── views/                              ← Templates EJS (capa View del MVC)
│   │
│   ├── layouts/
│   │   └── main.ejs                    # ★ Layout principal: sidebar, topbar, nav, árbol
│   │
│   ├── index.ejs                       # ★ Dashboard: hero, búsqueda, categorías, destacados, recientes
│   │
│   ├── documents/
│   │   ├── _card.ejs                   # ★ Partial: tarjeta de documento (reutilizable)
│   │   ├── index.ejs                   # ★ Listado con filtros (q, category, type)
│   │   ├── show.ejs                    # ★ Detalle + iframe preview Drive + descarga
│   │   └── form.ejs                    # ★ Formulario crear/editar (driveId autocomplete)
│   │
│   ├── folders/
│   │   ├── index.ejs                   # ★ Árbol de carpetas (grilla de cards)
│   │   └── show.ejs                    # ★ Contenido de carpeta + subcarpetas
│   │
│   ├── categories/
│   │   ├── index.ejs                   # ★ Grilla de categorías
│   │   └── show.ejs                    # ★ Documentos por categoría
│   │
│   ├── search/
│   │   └── results.ejs                 # ★ Resultados + filtros avanzados
│   │
│   └── errors/
│       ├── 404.ejs                     # ★ Página no encontrada
│       └── 500.ejs                     # ★ Error del servidor (con stack en dev)
│
└── public/
    ├── css/
    │   └── main.css                    # ★ Dark theme completo · responsive · animaciones
    └── js/
        └── main.js                     # ★ Sidebar, árbol, confirm, Drive autocomplete, toasts
```

> ★ = archivos actualizados/generados en esta iteración

---

## 🔗 Google Drive — Cómo funciona

Los documentos **no se alojan en el servidor**: solo se guarda el `driveId` en `db.json`.

| Acción | URL generada automáticamente |
|--------|------------------------------|
| **Vista previa** (iframe) | `https://drive.google.com/file/d/{driveId}/preview` |
| **Descarga directa** | `https://drive.google.com/uc?export=download&id={driveId}` |
| **Abrir en Drive** | `https://drive.google.com/file/d/{driveId}/view` |

### ¿Cómo obtengo el driveId?
En el link de Drive: `drive.google.com/file/d/`**`1BxiMVs0XRA5nFMdK`**`/view`  
El código entre `/d/` y `/view` es el ID.

### Permisos requeridos
El archivo en Drive debe tener configurado:  
> **"Cualquier persona con el enlace" → puede ver**

---

## 🗄️ Agregar un documento a db.json

```json
{
  "id": "doc-010",
  "title": "Reglamento interno 2024",
  "slug": "reglamento-interno-2024",
  "description": "Normativa vigente del establecimiento.",
  "categoryId": "cat-001",
  "folderId": "fld-002",
  "fileType": "PDF",
  "driveId": "1BxiMVs0XRA5nFMdKvw2Jk",
  "driveUrl": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvw2Jk/view",
  "tags": ["reglamento", "2024"],
  "status": "active",
  "featured": false,
  "downloadCount": 0,
  "createdAt": "2024-06-01T00:00:00.000Z",
  "updatedAt": "2024-06-01T00:00:00.000Z"
}
```

> El formulario en `/documents/new` completa `driveUrl` automáticamente al ingresar el `driveId`.

---

## 🔗 Rutas disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Dashboard principal |
| GET | `/documents` | Listado con filtros |
| GET | `/documents/new` | Formulario nuevo |
| POST | `/documents` | Crear documento |
| GET | `/documents/:id` | Preview Drive + metadatos |
| GET | `/documents/:id/edit` | Formulario edición |
| PUT | `/documents/:id` | Actualizar |
| DELETE | `/documents/:id` | Archivar |
| GET | `/documents/:id/download` | Registrar descarga → redirige a Drive |
| GET | `/folders` | Árbol de carpetas |
| GET | `/folders/:id` | Documentos de una carpeta |
| GET | `/categories` | Grilla de categorías |
| GET | `/categories/:id` | Documentos de una categoría |
| GET | `/search?q=...` | Búsqueda con filtros |
| GET | `/api/documents` | API REST · todos los docs |
| GET | `/api/documents/:id` | API REST · doc por ID |
| POST | `/api/documents` | API REST · crear |
| PUT | `/api/documents/:id` | API REST · actualizar |
| DELETE | `/api/documents/:id` | API REST · eliminar |
| GET | `/api/categories` | API REST · categorías |
| GET | `/api/folders` | API REST · árbol |

---

## ⚙️ Variables de entorno (.env)

```env
PORT=3000
NODE_ENV=development
```

---

## 🎨 Diseño

- **Tema**: Dark editorial con acentos dorados (`#f0c87a`)
- **Tipografía**: Lora (serif) + Space Mono (mono)
- **Responsive**: sidebar colapsable en mobile
- **Accesible**: `role="search"`, `aria-label`, navegación por teclado (`/` para buscar)
