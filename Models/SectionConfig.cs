// Models/SectionConfig.cs
namespace bilbioteca_virtual_aca.Models;

/// <summary>
/// Define una sección de la biblioteca con su carpeta raíz en Google Drive.
/// Editá los FolderId con los IDs reales de tus carpetas de Drive.
/// </summary>
public class SectionConfig
{
    public string Id       { get; set; } = "";
    public string Label    { get; set; } = "";
    public string Emoji    { get; set; } = "📁";
    public string FolderId { get; set; } = "FOLDER_ID_AQUI";
    public string Color    { get; set; } = "#9E9E9E";
}

/// <summary>
/// Lista estática de las 8 secciones.
/// Solo modificar los valores de FolderId.
/// </summary>
public static class Sections
{
    public static readonly List<SectionConfig> All = new()
    {
        new() { Id = "actividades",    Label = "Actividades",    Emoji = "🏃",  Color = "#4CAF50", FolderId = "1ZwvUjRoJBoaeDx-_dHlQOnxwJlLVLa4b" },
        new() { Id = "area-adultos",   Label = "Área Adultos",   Emoji = "👨",  Color = "#9E9E9E", FolderId = "1VD1i4QjAHUzzD2n8r1fg2yzWGMjq4y3d" },
        new() { Id = "area-aspirantes",Label = "Área Aspirantes",Emoji = "🌱",  Color = "#66BB6A", FolderId = "1fWtHDhD-s-r_YoPAFHq5pAsa1Sh9ftqy" },
        new() { Id = "area-joven",     Label = "Área Joven",     Emoji = "🧑",  Color = "#42A5F5", FolderId = "1wE7eN-P2ZL29mBOmZRtlahwHEAzXztNj" },
        new() { Id = "area-sectores",  Label = "Área Sectores",  Emoji = "🗂️", Color = "#EF5350", FolderId = "1sqbnX5EBnBrmkgBWw1kZbyDwu3YWKDmK" },
        new() { Id = "formacion",      Label = "Formación",      Emoji = "📚",  Color = "#FF7043", FolderId = "1RX-zLsJhqAycG-hu0UUrvjEGZGnvIv2y" },
        new() { Id = "recreacion",     Label = "Recreación",     Emoji = "🎨",  Color = "#AB47BC", FolderId = "1M3km94qOWu4ZiStGkUmoBdYEP_qHtVFQ" },
        new() { Id = "semana-santa",   Label = "Semana Santa",   Emoji = "✝️",  Color = "#FFA726", FolderId = "1wk-POF_3mS_7LkHsvh5_ChML-QTmfwdW" },
    };

    public static SectionConfig? FindById(string id) =>
        All.FirstOrDefault(s => s.Id == id);
}
