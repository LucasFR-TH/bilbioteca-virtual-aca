// Services/DriveService.cs
using System.Net.Http.Json;
using System.Collections.Concurrent;
using bilbioteca_virtual_aca.Models;
using bilbioteca_virtual_aca.Models.ViewModels;

namespace bilbioteca_virtual_aca.Services;

// ── Modelos internos de respuesta Drive API ───────────────────

public record DriveFileRaw(
    string Id,
    string Name,
    string MimeType,
    string? Size,
    string? ModifiedTime,
    string? WebViewLink,
    string? ThumbnailLink
);

public record DriveListResponse(
    List<DriveFileRaw>? Files,
    string? NextPageToken
);

// ── Servicio ──────────────────────────────────────────────────

public class DriveService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly TimeSpan _ttl;

    // Caché: clave → (datos, expira)
    private readonly ConcurrentDictionary<string, (object Data, DateTime ExpiresAt)> _cache = new();

    // Mapa MIME → etiqueta legible
    private static readonly Dictionary<string, string> MimeLabels = new()
    {
        ["application/pdf"]                                                                    = "PDF",
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]           = "DOCX",
        ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]                 = "XLSX",
        ["application/vnd.openxmlformats-officedocument.presentationml.presentation"]         = "PPTX",
        ["application/msword"]                                                                 = "DOC",
        ["application/vnd.ms-excel"]                                                           = "XLS",
        ["application/vnd.google-apps.document"]                                               = "Google Doc",
        ["application/vnd.google-apps.spreadsheet"]                                            = "Google Sheet",
        ["application/vnd.google-apps.presentation"]                                           = "Google Slides",
        ["image/jpeg"]                                                                         = "JPG",
        ["image/png"]                                                                          = "PNG",
    };

    private static readonly Dictionary<string, string> TypeColors = new()
    {
        ["PDF"] = "#EF5350", ["DOCX"] = "#42A5F5", ["XLSX"] = "#66BB6A",
        ["PPTX"] = "#FFA726", ["DOC"] = "#42A5F5",  ["XLS"] = "#66BB6A",
        ["Google Doc"] = "#42A5F5", ["Google Sheet"] = "#66BB6A",
        ["Google Slides"] = "#FFA726", ["JPG"] = "#AB47BC", ["PNG"] = "#AB47BC",
    };

    private static readonly Dictionary<string, string> TypeIcons = new()
    {
        ["PDF"] = "📄", ["DOCX"] = "📝", ["XLSX"] = "📊", ["PPTX"] = "📑",
        ["DOC"] = "📝", ["XLS"] = "📊", ["Google Doc"] = "📄",
        ["Google Sheet"] = "📊", ["Google Slides"] = "📑",
        ["JPG"] = "🖼️", ["PNG"] = "🖼️",
    };

    public DriveService(HttpClient http, IConfiguration config, IWebHostEnvironment env)
    {
        _http   = http;
        _apiKey = config["GoogleApiKey"] ?? throw new InvalidOperationException("GoogleApiKey no configurada en appsettings.json");
        _ttl    = env.IsDevelopment() ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(10);
    }

    // ── Caché helpers ──────────────────────────────────────────

    private bool TryGetCache<T>(string key, out T? value)
    {
        if (_cache.TryGetValue(key, out var entry) && DateTime.UtcNow < entry.ExpiresAt)
        {
            value = (T)entry.Data;
            return true;
        }
        value = default;
        return false;
    }

    private void SetCache(string key, object data) =>
        _cache[key] = (data, DateTime.UtcNow.Add(_ttl));

    public void ClearCache(string? prefix = null)
    {
        if (prefix is null) { _cache.Clear(); return; }
        foreach (var k in _cache.Keys.Where(k => k.StartsWith(prefix)).ToList())
            _cache.TryRemove(k, out _);
    }

    // ── Llamada a Drive API ───────────────────────────────────

    private async Task<List<DriveFileItem>> FetchFilesAsync(string folderId)
    {
        var cacheKey = $"files:{folderId}";
        if (TryGetCache<List<DriveFileItem>>(cacheKey, out var cached)) return cached!;

        var allFiles = new List<DriveFileRaw>();
        string? pageToken = null;
        const string fields = "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)";

        do
        {
            var url = $"https://www.googleapis.com/drive/v3/files"
                    + $"?q='{folderId}'+in+parents+and+trashed%3Dfalse"
                    + $"&fields={Uri.EscapeDataString(fields)}"
                    + $"&pageSize=1000&orderBy=name"
                    + $"&key={_apiKey}";

            if (pageToken is not null) url += $"&pageToken={pageToken}";

            var response = await _http.GetFromJsonAsync<DriveListResponse>(url)
                ?? throw new Exception($"Drive API no devolvió datos para la carpeta {folderId}");

            allFiles.AddRange(response.Files ?? []);
            pageToken = response.NextPageToken;
        }
        while (pageToken is not null);

        var result = allFiles.Select(Normalize).ToList();
        SetCache(cacheKey, result);
        return result;
    }

    // ── API pública ────────────────────────────────────────────

    public Task<List<DriveFileItem>> ListFilesAsync(string folderId) =>
        FetchFilesAsync(folderId);

    public async Task<List<DriveFileItem>> ListSubfoldersAsync(string folderId)
    {
        var all = await FetchFilesAsync(folderId);
        return all.Where(f => f.IsFolder).ToList();
    }

    public async Task<List<DriveFileItem>> ListDocumentsAsync(string folderId)
    {
        var all = await FetchFilesAsync(folderId);
        return all.Where(f => !f.IsFolder).ToList();
    }

    /// <summary>
    /// Recorre recursivamente toda una sección de Drive.
    /// Devuelve subcarpetas y documentos con breadcrumb.
    /// </summary>
    public async Task<SectionContentResult> ListSectionRecursiveAsync(string rootFolderId, string sectionLabel)
    {
        var cacheKey = $"section:{rootFolderId}";
        if (TryGetCache<SectionContentResult>(cacheKey, out var cached)) return cached!;

        var result = new SectionContentResult();
        await WalkAsync(rootFolderId, new List<string> { sectionLabel }, result);

        SetCache(cacheKey, result);
        return result;
    }

    private async Task WalkAsync(string folderId, List<string> breadcrumb, SectionContentResult result)
    {
        var items = await FetchFilesAsync(folderId);
        foreach (var item in items)
        {
            if (item.IsFolder)
            {
                item.Breadcrumb = [.. breadcrumb, item.Name];
                result.Folders.Add(item);
                await WalkAsync(item.Id, item.Breadcrumb, result);
            }
            else
            {
                item.Breadcrumb = breadcrumb;
                item.FolderName = breadcrumb.Count > 0 ? breadcrumb[^1] : breadcrumb[0];
                result.Documents.Add(item);
            }
        }
    }

    /// <summary>
    /// Busca documentos en múltiples secciones con filtros opcionales.
    /// </summary>
    public async Task<List<DriveFileItem>> SearchAsync(
        IEnumerable<SectionConfig> sections,
        string? query,
        string? sectionId,
        string? subfolder,
        string? fileType)
    {
        var targets = sectionId is not null
            ? sections.Where(s => s.Id == sectionId)
            : sections;

        var allDocs = new List<DriveFileItem>();

        foreach (var section in targets)
        {
            if (section.FolderId == "FOLDER_ID_AQUI") continue;
            try
            {
                var content = await ListSectionRecursiveAsync(section.FolderId, section.Label);
                foreach (var doc in content.Documents)
                {
                    doc.SectionId    = section.Id;
                    doc.SectionLabel = section.Label;
                    doc.SectionColor = section.Color;
                    doc.SectionEmoji = section.Emoji;
                }
                allDocs.AddRange(content.Documents);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DriveService] Error en sección {section.Id}: {ex.Message}");
            }
        }

        // Aplicar filtros
        var q = query?.Trim().ToLowerInvariant();
        return allDocs.Where(doc =>
            (string.IsNullOrEmpty(q)         || doc.Name.ToLowerInvariant().Contains(q)) &&
            (string.IsNullOrEmpty(subfolder) || doc.FolderName?.ToLowerInvariant() == subfolder.ToLowerInvariant()) &&
            (string.IsNullOrEmpty(fileType)  || doc.TypeLabel == fileType)
        ).ToList();
    }

    // ── Normalización ──────────────────────────────────────────

    private static DriveFileItem Normalize(DriveFileRaw f)
    {
        var isFolder  = f.MimeType == "application/vnd.google-apps.folder";
        var typeLabel = isFolder ? "Carpeta"
            : (MimeLabels.TryGetValue(f.MimeType, out var lbl) ? lbl
            : f.MimeType.Split('/').LastOrDefault()?.ToUpperInvariant() ?? "FILE");

        return new DriveFileItem
        {
            Id            = f.Id,
            Name          = f.Name,
            MimeType      = f.MimeType,
            IsFolder      = isFolder,
            TypeLabel     = typeLabel,
            TypeIcon      = isFolder ? "📁" : (TypeIcons.GetValueOrDefault(typeLabel, "📄")),
            TypeColor     = isFolder ? "#FFA726" : (TypeColors.GetValueOrDefault(typeLabel, "#9E9E9E")),
            Size          = FormatSize(f.Size),
            ModifiedTime  = f.ModifiedTime,
            ModifiedLabel = f.ModifiedTime is not null
                ? DateTime.Parse(f.ModifiedTime).ToString("dd MMM yyyy",
                    new System.Globalization.CultureInfo("es-AR"))
                : null,
            ViewUrl       = f.WebViewLink ?? $"https://drive.google.com/file/d/{f.Id}/view",
            PreviewUrl    = isFolder ? null : $"https://drive.google.com/file/d/{f.Id}/preview",
            DownloadUrl   = isFolder ? null : $"https://drive.google.com/uc?export=download&id={f.Id}",
            Thumbnail     = f.ThumbnailLink,
        };
    }

    private static string? FormatSize(string? bytes)
    {
        if (!long.TryParse(bytes, out var b)) return null;
        return b switch
        {
            < 1024        => $"{b} B",
            < 1_048_576   => $"{b / 1024.0:F1} KB",
            _             => $"{b / 1_048_576.0:F1} MB",
        };
    }
}

// ── Modelos de resultado ───────────────────────────────────────

public class DriveFileItem
{
    public string   Id            { get; set; } = "";
    public string   Name          { get; set; } = "";
    public string   MimeType      { get; set; } = "";
    public bool     IsFolder      { get; set; }
    public string   TypeLabel     { get; set; } = "";
    public string   TypeIcon      { get; set; } = "📄";
    public string   TypeColor     { get; set; } = "#9E9E9E";
    public string?  Size          { get; set; }
    public string?  ModifiedTime  { get; set; }
    public string?  ModifiedLabel { get; set; }
    public string   ViewUrl       { get; set; } = "";
    public string?  PreviewUrl    { get; set; }
    public string?  DownloadUrl   { get; set; }
    public string?  Thumbnail     { get; set; }
    // Relleno al recorrer secciones
    public List<string> Breadcrumb { get; set; } = new();
    public string?  FolderName    { get; set; }
    public string?  SectionId     { get; set; }
    public string?  SectionLabel  { get; set; }
    public string?  SectionColor  { get; set; }
    public string?  SectionEmoji  { get; set; }
}

public class SectionContentResult
{
    public List<DriveFileItem> Folders   { get; } = new();
    public List<DriveFileItem> Documents { get; } = new();
}
