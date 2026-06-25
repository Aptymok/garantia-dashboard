param(
  [Parameter(Mandatory=$true)][string]$RepoUrl
)
$ErrorActionPreference = "Stop"
git init
git add .
git commit -m "Initial garantías dashboard"
git branch -M main
git remote add origin $RepoUrl
git push -u origin main
Write-Host "Ahora activa GitHub Pages: Settings > Pages > Deploy from branch > main / root."
