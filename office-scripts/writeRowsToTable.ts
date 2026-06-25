function main(
  workbook: ExcelScript.Workbook,
  rowsJson: string,
  sheetName: string = "Seguimiento",
  tableName: string = "tblGarantias"
): { ok: boolean; rowsWritten: number; columnsWritten: number; message: string } {
  const rows = JSON.parse(rowsJson || "[]") as Record<string, string | number | boolean | null>[];
  let sheet = workbook.getWorksheet(sheetName);
  if (!sheet) sheet = workbook.addWorksheet(sheetName);

  const used = sheet.getUsedRange();
  if (used) used.clear(ExcelScript.ClearApplyTo.all);

  if (!rows.length) {
    sheet.getRange("A1").setValue("Sin filas devueltas por DAX");
    return { ok: true, rowsWritten: 0, columnsWritten: 0, message: "Sin filas devueltas por DAX" };
  }

  const headers = Object.keys(rows[0]);
  const values = rows.map(row => headers.map(header => row[header] ?? ""));

  sheet.getRangeByIndexes(0, 0, 1, headers.length).setValues([headers]);
  sheet.getRangeByIndexes(1, 0, values.length, headers.length).setValues(values);

  const allRange = sheet.getRangeByIndexes(0, 0, values.length + 1, headers.length);

  for (const table of sheet.getTables()) {
    if (table.getName() === tableName) table.delete();
  }

  const table = sheet.addTable(allRange, true);
  table.setName(tableName);
  table.setPredefinedTableStyle("TableStyleMedium2");

  sheet.getUsedRange()?.getFormat().autofitColumns();
  sheet.getFreezePanes().freezeRows(1);

  return {
    ok: true,
    rowsWritten: rows.length,
    columnsWritten: headers.length,
    message: `Se escribieron ${rows.length} filas en ${sheetName}/${tableName}`
  };
}
