/**
 * src/services/DriveService.js
 *
 * Accede a Google Drive API v3 usando una API Key pública.
 * Los archivos/carpetas en Drive deben estar compartidos como
 * "Cualquier persona con el enlace puede ver".
 *
 * Estrategia de caché:
 *  - Cada carpeta se cachea por TTL (default 5 min en dev, 10 min en prod).
 *  - Se puede invalidar manualmente con clearCache().
 *
 * Cuota: la API Key gratuita permite ~10.000 req/día. Con caché
 *  el consumo real es mínimo.
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";

// ── Tipos de archivo que nos interesan ────────────────────────
const MIME_LABELS = {
  "application/pdf":                                          "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       "XLSX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":"PPTX",
  "application/msword":                                       "DOC",
  "application/vnd.ms-excel":                                "XLS",
  "application/vnd.google-apps.document":                    "Google Doc",
  "application/vnd.google-apps.spreadsheet":                 "Google Sheet",
  "application/vnd.google-apps.presentation":                "Google Slides",
  "image/jpeg":                                              "JPG",
  "image/png":                                               "PNG",
};

const MIME_ICONS = {
  "PDF": "📄", "DOCX": "📝", "XLSX": "📊", "PPTX": "📑",
  "DOC": "📝", "XLS": "📊", "Google Doc": "📄",
  "Google Sheet": "📊", "Google Slides": "📑",
  "JPG": "🖼️", "PNG": "🖼️",
};

const MIME_COLORS = {
  "PDF": "#EF5350", "DOCX": "#42A5F5", "XLSX": "#66BB6A",
  "PPTX": "#FFA726", "DOC": "#42A5F5", "XLS": "#66BB6A",
  "Google Doc": "#42A5F5", "Google Sheet": "#66BB6A",
  "Google Slides": "#FFA726", "JPG": "#AB47BC", "PNG": "#AB47BC",
};

class DriveService {
  constructor() {
    this.apiKey  = process.env.GOOGLE_API_KEY;
    this.ttl     = process.env.NODE_ENV === "production" ? 10 * 60 * 1000 : 5 * 60 * 1000;
    this._cache  = new Map(); // key → { data, expiresAt }
  }

  // ── Caché helpers ──────────────────────────────────────────

  _get(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this._cache.delete(key); return null; }
    return entry.data;
  }

  _set(key, data) {
    this._cache.set(key, { data, expiresAt: Date.now() + this.ttl });
  }

  clearCache(folderId = null) {
    if (folderId) {
      // borra todas las entradas que empiezan con ese folderId
      for (const k of this._cache.keys()) {
        if (k.startsWith(folderId)) this._cache.delete(k);
      }
    } else {
      this._cache.clear();
    }
  }

  // ── Fetch helper ──────────────────────────────────────────

  async _fetch(path, params = {}) {
    if (!this.apiKey) throw new Error("GOOGLE_API_KEY no configurada en .env");

    const url = new URL(`${DRIVE_API}${path}`);
    url.searchParams.set("key", this.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Drive API ${res.status}: ${err?.error?.message || res.statusText}`);
    }
    return res.json();
  }

  // ── Listar archivos de una carpeta (1 nivel) ──────────────

  async listFiles(folderId) {
    const cacheKey = `files:${folderId}`;
    const cached   = this._get(cacheKey);
    if (cached) return cached;

    const fields = "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents)";
    const query  = `'${folderId}' in parents and trashed=false`;
    let   files  = [];
    let   pageToken;

    do {
      const params = {
        q:           query,
        fields,
        pageSize:    1000,
        orderBy:     "name",
      };
      if (pageToken) params.pageToken = pageToken;

      const data = await this._fetch("/files", params);
      files = files.concat(data.files || []);
      pageToken = data.nextPageToken;
    } while (pageToken);

    const result = files.map(f => this._normalizeFile(f));
    this._set(cacheKey, result);
    return result;
  }

  // ── Listar subcarpetas de una carpeta ─────────────────────

  async listSubfolders(folderId) {
    const cacheKey = `folders:${folderId}`;
    const cached   = this._get(cacheKey);
    if (cached) return cached;

    const all    = await this.listFiles(folderId);
    const result = all.filter(f => f.isFolder);
    this._set(cacheKey, result);
    return result;
  }

  // ── Listar solo documentos (no carpetas) de una carpeta ───

  async listDocuments(folderId) {
    const all = await this.listFiles(folderId);
    return all.filter(f => !f.isFolder);
  }

  // ── Recorrer toda la sección recursivamente ───────────────
  // Devuelve { folders: [...], documents: [...] }
  // con breadcrumb completo en cada documento.

  async listSectionRecursive(rootFolderId, sectionLabel) {
    const cacheKey = `section:${rootFolderId}`;
    const cached   = this._get(cacheKey);
    if (cached) return cached;

    const result = { folders: [], documents: [] };

    const walk = async (folderId, breadcrumb) => {
      const items = await this.listFiles(folderId);

      for (const item of items) {
        if (item.isFolder) {
          const folderEntry = {
            ...item,
            section:    sectionLabel,
            breadcrumb: [...breadcrumb, item.name],
          };
          result.folders.push(folderEntry);
          await walk(item.id, [...breadcrumb, item.name]);
        } else {
          result.documents.push({
            ...item,
            section:    sectionLabel,
            breadcrumb: [...breadcrumb],
            folder:     breadcrumb.length ? breadcrumb[breadcrumb.length - 1] : sectionLabel,
          });
        }
      }
    };

    await walk(rootFolderId, [sectionLabel]);
    this._set(cacheKey, result);
    return result;
  }

  // ── Normalizar archivo de Drive ────────────────────────────

  _normalizeFile(f) {
    const isFolder   = f.mimeType === "application/vnd.google-apps.folder";
    const typeLabel  = MIME_LABELS[f.mimeType] || f.mimeType.split("/").pop().toUpperCase();

    return {
      id:           f.id,
      name:         f.name,
      mimeType:     f.mimeType,
      isFolder,
      typeLabel:    isFolder ? "Carpeta" : typeLabel,
      typeIcon:     isFolder ? "📁" : (MIME_ICONS[typeLabel] || "📄"),
      typeColor:    isFolder ? "#FFA726" : (MIME_COLORS[typeLabel] || "#9E9E9E"),
      size:         f.size ? this._formatSize(parseInt(f.size)) : null,
      modifiedTime: f.modifiedTime,
      modifiedLabel:new Date(f.modifiedTime).toLocaleDateString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
      }),
      viewUrl:      f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      previewUrl:   isFolder ? null : `https://drive.google.com/file/d/${f.id}/preview`,
      downloadUrl:  isFolder ? null : `https://drive.google.com/uc?export=download&id=${f.id}`,
      thumbnail:    f.thumbnailLink || null,
    };
  }

  _formatSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  // ── Buscar en múltiples secciones ─────────────────────────

  async searchAcrossSections(sections, query, filters = {}) {
    const q    = (query || "").toLowerCase().trim();
    const { sectionId, subfolder, fileType } = filters;

    // Determinar qué secciones recorrer
    const targets = sectionId
      ? sections.filter(s => s.id === sectionId)
      : sections;

    const allDocs = [];

    for (const section of targets) {
      if (!section.folderId || section.folderId === "FOLDER_ID_AQUI") continue;
      try {
        const { documents } = await this.listSectionRecursive(section.folderId, section.label);
        allDocs.push(...documents.map(d => ({ ...d, sectionId: section.id, sectionLabel: section.label, sectionColor: section.color, sectionEmoji: section.emoji })));
      } catch (e) {
        console.warn(`[DriveService] Error en sección ${section.id}:`, e.message);
      }
    }

    // Filtros
    return allDocs.filter(doc => {
      if (q         && !doc.name.toLowerCase().includes(q))       return false;
      if (subfolder && doc.folder.toLowerCase() !== subfolder.toLowerCase()) return false;
      if (fileType  && doc.typeLabel !== fileType)                 return false;
      return true;
    });
  }
}

// Singleton — una instancia compartida en toda la app
module.exports = new DriveService();
