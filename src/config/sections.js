/**
 * src/config/sections.js
 *
 * Mapa de secciones → ID de carpeta raíz en Google Drive.
 * Para obtener el folderId: abrir la carpeta en Drive y copiar
 * el ID del final de la URL:
 *   drive.google.com/drive/folders/ ► ESTE_ES_EL_ID ◄
 *
 * Reemplazar los valores "FOLDER_ID_AQUI" con los IDs reales.
 */

const SECTIONS = [
  {
    id:       "actividades",
    label:    "Actividades",
    emoji:    "🏃",
    folderId: "1ZwvUjRoJBoaeDx-_dHlQOnxwJlLVLa4b",   // ← reemplazar
    color:    "#4CAF50",
  },
  {
    id:       "area-adultos",
    label:    "Área Adultos",
    emoji:    "👨",
    folderId: "1VD1i4QjAHUzzD2n8r1fg2yzWGMjq4y3d",
    color:    "#9E9E9E",
  },
  {
    id:       "area-aspirantes",
    label:    "Área Aspirantes",
    emoji:    "🌱",
    folderId: "1fWtHDhD-s-r_YoPAFHq5pAsa1Sh9ftqy",
    color:    "#66BB6A",
  },
  {
    id:       "area-joven",
    label:    "Área Joven",
    emoji:    "🧑",
    folderId: "1wE7eN-P2ZL29mBOmZRtlahwHEAzXztNj",
    color:    "#42A5F5",
  },
  {
    id:       "area-sectores",
    label:    "Área Sectores",
    emoji:    "🗂️",
    folderId: "1sqbnX5EBnBrmkgBWw1kZbyDwu3YWKDmK",
    color:    "#EF5350",
  },
  {
    id:       "formacion",
    label:    "Formación",
    emoji:    "📚",
    folderId: "1RX-zLsJhqAycG-hu0UUrvjEGZGnvIv2y",
    color:    "#FF7043",
  },
  {
    id:       "recreacion",
    label:    "Recreación",
    emoji:    "🎨",
    folderId: "1M3km94qOWu4ZiStGkUmoBdYEP_qHtVFQ",
    color:    "#AB47BC",
  },
  {
    id:       "semana-santa",
    label:    "Semana Santa",
    emoji:    "✝️",
    folderId: "1wk-POF_3mS_7LkHsvh5_ChML-QTmfwdW",
    color:    "#FFA726",
  },
];

/**
 * Helpers
 */
const getSectionById   = (id)       => SECTIONS.find(s => s.id === id) || null;
const getSectionByFolder = (fid)    => SECTIONS.find(s => s.folderId === fid) || null;
const getAllFolderIds   = ()        => SECTIONS.map(s => s.folderId);

module.exports = { SECTIONS, getSectionById, getSectionByFolder, getAllFolderIds };
