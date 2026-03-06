// Controllers/SectionsController.cs
using Microsoft.AspNetCore.Mvc;
using bilbioteca_virtual_aca.Models;
using bilbioteca_virtual_aca.Models.ViewModels;
using bilbioteca_virtual_aca.Services;

namespace bilbioteca_virtual_aca.Controllers;

public class SectionsController : Controller
{
    private readonly DriveService _drive;

    public SectionsController(DriveService drive)
    {
        _drive = drive;
    }

    // ── GET /Sections ─────────────────────────────────────────
    // Grilla con las 8 secciones
    public IActionResult Index()
    {
        var model = new SectionsIndexViewModel
        {
            Sections = Sections.All
        };
        ViewData["Title"] = "Secciones";
        return View(model);
    }

    // ── GET /Sections/Show/{id} ───────────────────────────────
    // Contenido raíz de una sección: subcarpetas + archivos
    public async Task<IActionResult> Show(string id)
    {
        var section = Sections.FindById(id);
        if (section is null) return NotFound();

        ViewData["Title"] = section.Label;

        // Sección sin FolderId configurado
        if (section.FolderId == "FOLDER_ID_AQUI")
        {
            return View(new SectionShowViewModel
            {
                Section       = section,
                NotConfigured = true,
                Breadcrumb    = [new() { Label = section.Label }],
            });
        }

        try
        {
            var files = await _drive.ListFilesAsync(section.FolderId);
            return View(new SectionShowViewModel
            {
                Section         = section,
                Subfolders      = files.Where(f => f.IsFolder).ToList(),
                Documents       = files.Where(f => !f.IsFolder).ToList(),
                CurrentFolderId = section.FolderId,
                Breadcrumb      = [new() { Label = section.Label }],
            });
        }
        catch (Exception ex)
        {
            ViewBag.DriveError = ex.Message;
            return View(new SectionShowViewModel
            {
                Section    = section,
                Breadcrumb = [new() { Label = section.Label }],
            });
        }
    }

    // ── GET /Sections/Subfolder/{id}/{folderId}?name=... ──────
    // Contenido de una subcarpeta dentro de una sección
    public async Task<IActionResult> Subfolder(string id, string folderId, string? name = null)
    {
        var section = Sections.FindById(id);
        if (section is null) return NotFound();

        var folderName = name ?? "Carpeta";
        ViewData["Title"] = $"{folderName} — {section.Label}";

        try
        {
            var files = await _drive.ListFilesAsync(folderId);
            return View("Show", new SectionShowViewModel
            {
                Section         = section,
                Subfolders      = files.Where(f => f.IsFolder).ToList(),
                Documents       = files.Where(f => !f.IsFolder).ToList(),
                CurrentFolderId = folderId,
                Breadcrumb =
                [
                    new() { Label = section.Label, Url = Url.Action("Show", new { id }) },
                    new() { Label = folderName },
                ],
            });
        }
        catch (Exception ex)
        {
            ViewBag.DriveError = ex.Message;
            return View("Show", new SectionShowViewModel
            {
                Section    = section,
                Breadcrumb =
                [
                    new() { Label = section.Label, Url = Url.Action("Show", new { id }) },
                    new() { Label = folderName },
                ],
            });
        }
    }

    // ── POST /Sections/RefreshCache/{id} ──────────────────────
    // Invalida caché de una sección (llamado por el botón 🔄)
    [HttpPost]
    public IActionResult RefreshCache(string id)
    {
        var section = Sections.FindById(id);
        if (section is null) return NotFound(new { error = "Sección no encontrada" });

        _drive.ClearCache($"section:{section.FolderId}");
        _drive.ClearCache($"files:{section.FolderId}");

        return Ok(new { success = true, message = $"Caché de \"{section.Label}\" invalidada" });
    }
}
