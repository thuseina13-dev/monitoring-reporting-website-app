import { SQL, eq, ilike, or, and, getTableColumns } from 'drizzle-orm';

/**
 * Membangun filter Drizzle secara rekursif untuk mendukung kondisi kompleks (AND/OR bersarang).
 * 
 * @param table Objek tabel Drizzle
 * @param query Objek query yang berisi kriteria filter
 * @param allowedFilters Daftar kolom yang aman untuk difilter
 * @returns SQL expression atau undefined
 */
export const buildFilters = (
  table: any,
  query: Record<string, any>,
  allowedFilters: string[]
): SQL[] => {
  const columns = getTableColumns(table);

  /**
   * Fungsi internal untuk memproses satu unit filter secara rekursif
   */
  const processFilter = (data: any, defaultOperator: 'and' | 'or' = 'and'): SQL | undefined => {
    if (!data || typeof data !== 'object') return undefined;

    const conditions: SQL[] = [];

    // Jika data adalah Array (biasanya di dalam grup or: [{}, {}])
    if (Array.isArray(data)) {
      data.forEach(item => {
        const result = processFilter(item);
        if (result) conditions.push(result);
      });
    } else {
      // Proses setiap key dalam objek
      for (const key in data) {
        const value = data[key];

        // 1. Handle Grup AND Rekursif
        if (key === 'and') {
          const res = processFilter(value, 'and');
          if (res) conditions.push(res);
          continue;
        }

        // 2. Handle Grup OR Rekursif
        if (key === 'or') {
          const res = processFilter(value, 'or');
          if (res) conditions.push(res);
          continue;
        }

        // 3. Handle Global Search (Legacy Support)
        if (key === 'search' && typeof value === 'string') {
          const searchConditions: SQL[] = [];
          allowedFilters.forEach(colKey => {
            const col = columns[colKey];
            if (col && (col.columnType === 'PgVarchar' || col.columnType === 'PgText')) {
                searchConditions.push(ilike(col as any, `%${value}%`));
            }
          });
          if (searchConditions.length > 0) conditions.push(or(...searchConditions)!);
          continue;
        }

        // 4. Handle Kolom Tunggal (Cek Whitelist)
        if (allowedFilters.includes(key)) {
          const column = columns[key];
          if (!column) continue;

          if (column.columnType === 'PgVarchar' || column.columnType === 'PgText') {
            conditions.push(ilike(column as any, `%${value}%`));
          } else if (column.columnType === 'PgBoolean') {
            conditions.push(eq(column as any, value === 'true' || value === true));
          } else {
            conditions.push(eq(column as any, value));
          }
        }
      }
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    
    return defaultOperator === 'or' ? or(...conditions) : and(...conditions);
  };

  // Mulai proses dari root query
  const finalResult = processFilter(query);
  return finalResult ? [finalResult] : [];
};
