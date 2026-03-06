// Models/ViewModels/HomeViewModel.cs
namespace bilbioteca_virtual_aca.Models.ViewModels;

public class HomeViewModel
{
    public StatsViewModel Stats { get; set; } = new();
    public List<CategoryViewModel> Categories { get; set; } = new();
    public List<DocumentViewModel> Featured { get; set; } = new();
    public List<DocumentViewModel> Recent { get; set; } = new();
}

public class StatsViewModel
{
    public int Active { get; set; }
    public int TotalDownloads { get; set; }
    public int Archived { get; set; }
    public int Draft { get; set; }
}

public class DocumentViewModel
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Description { get; set; } = "";
    public string FileType { get; set; } = "PDF";
    public string DriveId { get; set; } = "";
    public string DriveUrl { get; set; } = "";
    public List<string> Tags { get; set; } = new();
    public bool Featured { get; set; }
    public int DownloadCount { get; set; }
    public DateTime CreatedAt { get; set; }

    // Relaciones
    public string? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryColor { get; set; }
    public string? CategoryIcon { get; set; }
    public string? FolderId { get; set; }
    public string? FolderName { get; set; }
    public string? FolderIcon { get; set; }

    // Computados
    public string PreviewUrl => $"https://drive.google.com/file/d/{DriveId}/preview";
    public string DownloadUrl => $"https://drive.google.com/uc?export=download&id={DriveId}";

    public string Excerpt => Description.Length > 120
        ? Description[..120] + "…"
        : Description;

    public string FormattedDate => CreatedAt.ToString("d 'de' MMMM 'de' yyyy",
        new System.Globalization.CultureInfo("es-AR"));

    public string FileTypeIcon => FileType switch
    {
        "PDF"  => "📄",
        "DOCX" => "📝",
        "DOC"  => "📝",
        "XLSX" => "📊",
        "XLS"  => "📊",
        "PPTX" => "📑",
        _      => "📄"
    };

    public string FileTypeColor => FileType switch
    {
        "PDF"  => "#e74c3c",
        "DOCX" => "#2980b9",
        "DOC"  => "#2980b9",
        "XLSX" => "#27ae60",
        "XLS"  => "#27ae60",
        "PPTX" => "#e67e22",
        _      => "#7a7068"
    };
}

public class CategoryViewModel
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Color { get; set; } = "#7a7068";
    public string Icon { get; set; } = "🏷️";
    public int DocumentCount { get; set; }
}

public class FolderViewModel
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Color { get; set; } = "#7a7068";
    public string Icon { get; set; } = "📁";
    public string? ParentId { get; set; }
    public string? ParentName { get; set; }
    public List<FolderViewModel> Children { get; set; } = new();
    public List<DocumentViewModel> Documents { get; set; } = new();

    public string BreadcrumbPath => string.IsNullOrEmpty(ParentName)
        ? Name
        : $"{ParentName} › {Name}";
}

public class DocumentsIndexViewModel
{
    public List<DocumentViewModel> Documents { get; set; } = new();
    public List<CategoryViewModel> Categories { get; set; } = new();
    public string? FilterQ { get; set; }
    public string? FilterCategory { get; set; }
    public string? FilterType { get; set; }
    public List<string> FileTypes { get; set; } = new() { "PDF", "DOCX", "XLSX", "PPTX", "DOC", "XLS" };
}

public class SearchViewModel
{
    public string Query { get; set; } = "";
    public List<DocumentViewModel> Results { get; set; } = new();
    public List<CategoryViewModel> Categories { get; set; } = new();
    public string? FilterCategory { get; set; }
    public string? FilterType { get; set; }
}
