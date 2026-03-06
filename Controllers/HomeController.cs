// Controllers/HomeController.cs
using Microsoft.AspNetCore.Mvc;
using bilbioteca_virtual_aca.Models.ViewModels;
using System.Text.Json;

namespace bilbioteca_virtual_aca.Controllers;

public class HomeController : Controller
{
    private readonly IWebHostEnvironment _env;

    public HomeController(IWebHostEnvironment env)
    {
        _env = env;
    }

    public IActionResult Index()
    {
        var db = LoadDatabase();

        var model = new HomeViewModel
        {
            Stats = new StatsViewModel
            {
                Active         = db.Documents.Count(d => d.Status == "active"),
                TotalDownloads = db.Documents.Sum(d => d.DownloadCount),
                Archived       = db.Documents.Count(d => d.Status == "archived"),
                Draft          = db.Documents.Count(d => d.Status == "draft"),
            },
            Categories = db.Categories.Select(c => new CategoryViewModel
            {
                Id            = c.Id,
                Name          = c.Name,
                Description   = c.Description,
                Color         = c.Color,
                Icon          = c.Icon,
                DocumentCount = db.Documents.Count(d => d.CategoryId == c.Id && d.Status == "active"),
            }).ToList(),

            Featured = db.Documents
                .Where(d => d.Featured && d.Status == "active")
                .Take(6)
                .Select(d => MapDocument(d, db))
                .ToList(),

            Recent = db.Documents
                .Where(d => d.Status == "active")
                .OrderByDescending(d => d.CreatedAt)
                .Take(8)
                .Select(d => MapDocument(d, db))
                .ToList(),
        };

        // Árbol de carpetas para el sidebar
        ViewBag.FolderTree = db.Folders
            .Where(f => f.ParentId == null)
            .Select(f => new FolderViewModel
            {
                Id    = f.Id,
                Name  = f.Name,
                Icon  = f.Icon,
                Color = f.Color,
                Children = db.Folders
                    .Where(c => c.ParentId == f.Id)
                    .Select(c => new FolderViewModel { Id = c.Id, Name = c.Name, Icon = c.Icon })
                    .ToList()
            }).ToList();

        ViewBag.Stats = model.Stats;
        return View(model);
    }

    // ── Helpers ─────────────────────────────────────────────

    private static DocumentViewModel MapDocument(DocumentRecord d, DatabaseRoot db)
    {
        var cat = db.Categories.FirstOrDefault(c => c.Id == d.CategoryId);
        var fld = db.Folders.FirstOrDefault(f => f.Id == d.FolderId);
        return new DocumentViewModel
        {
            Id             = d.Id,
            Title          = d.Title,
            Description    = d.Description,
            FileType       = d.FileType,
            DriveId        = d.DriveId,
            DriveUrl       = d.DriveUrl,
            Tags           = d.Tags,
            Featured       = d.Featured,
            DownloadCount  = d.DownloadCount,
            CreatedAt      = d.CreatedAt,
            CategoryId     = cat?.Id,
            CategoryName   = cat?.Name,
            CategoryColor  = cat?.Color,
            CategoryIcon   = cat?.Icon,
            FolderId       = fld?.Id,
            FolderName     = fld?.Name,
            FolderIcon     = fld?.Icon,
        };
    }

    private DatabaseRoot LoadDatabase()
    {
        // Busca db.json: primero en src/database/, luego en la raíz
        var paths = new[]
        {
            Path.Combine(_env.ContentRootPath, "src", "database", "db.json"),
            Path.Combine(_env.ContentRootPath, "db.json"),
            Path.Combine(_env.ContentRootPath, "..", "biblioteca-digital", "src", "database", "db.json"),
        };

        foreach (var path in paths)
        {
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                return JsonSerializer.Deserialize<DatabaseRoot>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
            }
        }

        return new DatabaseRoot(); // DB vacía si no encuentra el archivo
    }
}

// ── Records internos para deserializar db.json ──────────────
public record DatabaseRoot
{
    public List<DocumentRecord> Documents { get; init; } = new();
    public List<CategoryRecord> Categories { get; init; } = new();
    public List<FolderRecord>   Folders    { get; init; } = new();
}

public record DocumentRecord
{
    public string Id            { get; init; } = "";
    public string Title         { get; init; } = "";
    public string Description   { get; init; } = "";
    public string FileType      { get; init; } = "PDF";
    public string DriveId       { get; init; } = "";
    public string DriveUrl      { get; init; } = "";
    public string Status        { get; init; } = "active";
    public string? CategoryId   { get; init; }
    public string? FolderId     { get; init; }
    public bool Featured        { get; init; }
    public int DownloadCount    { get; init; }
    public List<string> Tags    { get; init; } = new();
    public DateTime CreatedAt   { get; init; }
}

public record CategoryRecord
{
    public string Id          { get; init; } = "";
    public string Name        { get; init; } = "";
    public string Description { get; init; } = "";
    public string Color       { get; init; } = "#7a7068";
    public string Icon        { get; init; } = "🏷️";
}

public record FolderRecord
{
    public string Id          { get; init; } = "";
    public string Name        { get; init; } = "";
    public string Description { get; init; } = "";
    public string Color       { get; init; } = "#7a7068";
    public string Icon        { get; init; } = "📁";
    public string? ParentId   { get; init; }
}
