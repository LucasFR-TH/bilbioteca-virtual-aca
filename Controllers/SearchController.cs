// Controllers/SearchController.cs
using Microsoft.AspNetCore.Mvc;
using bilbioteca_virtual_aca.Models;
using bilbioteca_virtual_aca.Models.ViewModels;
using bilbioteca_virtual_aca.Services;

namespace bilbioteca_virtual_aca.Controllers;

public class SearchController : Controller
{
    private readonly DriveService _drive;

    public SearchController(DriveService drive)
    {
        _drive = drive;
    }

    // ── GET /Search?q=...&section=...&subfolder=...&type=... ──
    public async Task<IActionResult> Index(
        string? q,
        string? section,
        string? subfolder,
        string? type)
    {
        ViewData["Title"]       = string.IsNullOrEmpty(q) ? "Buscar documentos" : $"Resultados: \"{q}\"";
        ViewBag.SearchQuery     = q;

        var hasQuery = !string.IsNullOrEmpty(q) || !string.IsNullOrEmpty(section)
                    || !string.IsNullOrEmpty(subfolder) || !string.IsNullOrEmpty(type);

        var model = new DriveSearchViewModel
        {
            Query           = q        ?? "",
            FilterSection   = section  ?? "",
            FilterSubfolder = subfolder ?? "",
            FilterType      = type     ?? "",
            Sections        = Sections.All,
            HasQuery        = hasQuery,
        };

        if (hasQuery)
        {
            try
            {
                model.Results = await _drive.SearchAsync(
                    Sections.All, q, section, subfolder, type);

                model.Total      = model.Results.Count;
                model.AllTypes   = model.Results.Select(r => r.TypeLabel).Distinct().OrderBy(t => t).ToList();
                model.AllFolders = model.Results
                    .Where(r => r.FolderName is not null)
                    .Select(r => r.FolderName!)
                    .Distinct().OrderBy(f => f).ToList();
            }
            catch (Exception ex)
            {
                ViewBag.SearchError = ex.Message;
            }
        }

        return View(model);
    }
}
