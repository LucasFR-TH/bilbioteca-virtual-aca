// Program.cs
using bilbioteca_virtual_aca.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Servicios ─────────────────────────────────────────────────
builder.Services.AddControllersWithViews();

// HttpClient + DriveService (Singleton: comparte caché en toda la app)
builder.Services.AddHttpClient<DriveService>();
builder.Services.AddSingleton<DriveService>(sp =>
{
    var http   = sp.GetRequiredService<IHttpClientFactory>().CreateClient();
    var config = sp.GetRequiredService<IConfiguration>();
    var env    = sp.GetRequiredService<IWebHostEnvironment>();
    return new DriveService(http, config, env);
});

var app = builder.Build();

// ── Pipeline ──────────────────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
