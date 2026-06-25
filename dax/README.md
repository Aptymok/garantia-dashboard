# DAX operativo

Este folder contiene la consulta base para exportar el seguimiento de garantías.

El error `No se encuentra la columna PRIORIDAD_NUM` se corrige evitando tratar `PRIORIDAD_NUM` como columna física. En esta versión la prioridad se calcula como columna virtual `__ORDEN` dentro de `ADDCOLUMNS` y luego se exporta como `ORDEN`.

Antes de ejecutar:

1. Sustituye `NOMBRE_REAL_DE_TABLA` por el nombre real de la tabla en el modelo semántico.
2. Sustituye los nombres de columnas si tu modelo usa nombres diferentes.
3. Ejecuta primero en Power BI DAX Query View.
4. Si funciona, úsala desde Power Automate.

No ejecutes desde GitHub Pages directo contra Power BI con tokens en JavaScript.
