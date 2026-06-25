# Garantías INEGI · Panel Operativo

Dashboard estático para GitHub Pages, embebible en SharePoint, con integración preparada para:

- Excel SharePoint Online.
- Power BI / modelo semántico mediante DAX.
- Power Automate como capa segura de ejecución.
- Copilot Agent en modo iframe con fallback a apertura directa.

## Qué trae

```text
garantias-dashboard/
  index.html
  assets/css/styles.css
  assets/js/app.js
  assets/js/config.js
  dax/garantias_operational_export.template.dax
  office-scripts/writeRowsToTable.ts
  power-automate/request-schema.json
  power-automate/README.md
  scripts/serve.ps1
  scripts/serve.sh
  scripts/publish-gh-pages.ps1
  .github/workflows/pages.yml
```

## Puesta en marcha rápida

1. Descomprime el ZIP.
2. Crea un repo en GitHub llamado `garantias-dashboard`.
3. Sube todos los archivos.
4. En GitHub entra a `Settings > Pages`.
5. Usa `GitHub Actions` o `Deploy from branch`, rama `main`, carpeta `/root`.
6. Abre la URL publicada.
7. En SharePoint agrega un webpart `Insertar / Embed` y pega:

```html
<iframe src="https://TU_USUARIO.github.io/garantias-dashboard/" width="100%" height="960" style="border:0;width:100%;min-height:960px;" allow="clipboard-read; clipboard-write; fullscreen; web-share" loading="lazy"></iframe>
```

## Prueba local

Windows PowerShell:

```powershell
cd garantias-dashboard
.\scripts\serve.ps1
```

Mac/Linux:

```bash
cd garantias-dashboard
./scripts/serve.sh
```

Luego abre:

```text
http://localhost:8080
```

## Operación real con Power Automate

GitHub Pages no debe ejecutar Power BI ni escribir Excel con tokens en el navegador. Para operación real:

1. Crea el Flow descrito en `power-automate/README.md`.
2. Sube el Office Script de `office-scripts/writeRowsToTable.ts` a Excel Online.
3. Copia la URL del trigger HTTP del Flow.
4. Abre el dashboard.
5. Entra a `Config`.
6. Pega la URL del Flow.
7. Guarda configuración local.
8. Ejecuta sincronización.

## DAX

El DAX está en:

```text
dax/garantias_operational_export.template.dax
```

No usa `PRIORIDAD_NUM` como columna física. Calcula la prioridad como columna virtual `__ORDEN` y exporta el resultado como `ORDEN`.

Antes de usarlo, cambia `NOMBRE_REAL_DE_TABLA` por el nombre real de la tabla en tu modelo semántico.

## Seguridad

No subas a GitHub:

- Tokens.
- Secretos.
- URL del trigger HTTP de Power Automate.
- Datos personales exportados.
- Archivos Excel con información sensible.

El dashboard guarda el endpoint del Flow solo en `localStorage` del navegador.
