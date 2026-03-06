// Models/ViewModels/SectionViewModels.cs
using bilbioteca_virtual_aca.Models;
using bilbioteca_virtual_aca.Services;

namespace bilbioteca_virtual_aca.Models.ViewModels;

public class SectionsIndexViewModel
{
    public List<SectionConfig> Sections { get; set; } = new();
}

public class SectionShowViewModel
{
    public SectionConfig             Section         { get; set; } = new();
    public List<DriveFileItem>       Subfolders      { get; set; } = new();
    public List<DriveFileItem>       Documents       { get; set; } = new();
    public List<BreadcrumbItem>      Breadcrumb      { get; set; } = new();
    public bool                      NotConfigured   { get; set; }
    public string                    CurrentFolderId { get; set; } = "";
}

public class DriveSearchViewModel
{
    public string                Query           { get; set; } = "";
    public string                FilterSection   { get; set; } = "";
    public string                FilterSubfolder { get; set; } = "";
    public string                FilterType      { get; set; } = "";
    public List<DriveFileItem>   Results         { get; set; } = new();
    public int                   Total           { get; set; }
    public List<SectionConfig>   Sections        { get; set; } = new();
    public List<string>          AllTypes        { get; set; } = new();
    public List<string>          AllFolders      { get; set; } = new();
    public bool                  HasQuery        { get; set; }
}

public class BreadcrumbItem
{
    public string  Label { get; set; } = "";
    public string? Url   { get; set; }
}
