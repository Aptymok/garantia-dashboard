# Flow recomendado para sincronizar DAX con Excel SharePoint

Este dashboard es estático. No debe guardar tokens ni credenciales. La ejecución real debe pasar por Power Automate o una API interna protegida.

## Flujo mínimo

1. Crear flujo automatizado con trigger: **When an HTTP request is received**.
2. Pegar el esquema de `request-schema.json`.
3. Agregar validación simple:
   - Si `action` no es `RUN_DAX_EXPORT_TO_SHAREPOINT_EXCEL`, responder 400.
   - Opcional: validar encabezado `X-Dashboard-Key`.
4. Agregar acción de Power BI: **Run a query against a dataset**.
   - Workspace: el workspace real.
   - Dataset/Semantic model: el modelo real.
   - Query: `daxQuery` del body.
5. Agregar acción de Excel Online Business: **Run script**.
   - Location: SharePoint Site.
   - Document Library: Documents o la biblioteca real.
   - File: `Reporte_Mantenimiento.xlsx`.
   - Script: `office-scripts/writeRowsToTable.ts`.
   - Parámetros:
     - `rowsJson`: `string(body('Run_a_query_against_a_dataset')?['results'][0]?['tables'][0]?['rows'])`
     - `sheetName`: `targetSheetName` del body.
     - `tableName`: `targetTableName` del body.
6. Responder al dashboard con JSON:

```json
{
  "ok": true,
  "rowsWritten": 100,
  "target": "Reporte_Mantenimiento.xlsx",
  "sheet": "Seguimiento"
}
```

## Regla importante

No pegues la URL del trigger HTTP dentro de archivos que se suben a GitHub. Pégala en la pantalla Config del dashboard; se guarda solo en el navegador.
