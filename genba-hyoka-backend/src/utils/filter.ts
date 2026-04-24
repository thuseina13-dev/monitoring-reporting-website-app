import { SQL, eq, ilike, or, and, getTableColumns } from 'drizzle-orm';

/**
 * [LEGACY] Membangun filter Drizzle Core (db.select)
 */
export const buildFilters = (
  table: any,
  query: Record<string, any>,
  allowedFilters: string[]
): SQL[] => {
  const columns = getTableColumns(table);

  const processFilter = (data: any, defaultOperator: 'and' | 'or' = 'and'): SQL | undefined => {
    if (!data || typeof data !== 'object') return undefined;

    const conditions: SQL[] = [];

    if (Array.isArray(data)) {
      data.forEach(item => {
        const result = processFilter(item);
        if (result) conditions.push(result);
      });
    } else {
      for (const key in data) {
        const value = data[key];

        if (key === 'and') {
          const res = processFilter(value, 'and');
          if (res) conditions.push(res);
          continue;
        }

        if (key === 'or') {
          const res = processFilter(value, 'or');
          if (res) conditions.push(res);
          continue;
        }

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

  const finalResult = processFilter(query);
  return finalResult ? [finalResult] : [];
};

/**
 * [NEW] Membangun filter untuk Drizzle Relational Query Builder (RQB)
 * Sangat dinamis dan mendukung mapping otomatis berdasarkan schema.
 */
export const buildRQBWhere = (
  fields: any,
  ops: any,
  query: Record<string, any>,
  options: {
    searchFields?: string[];
    exactFields?: string[];
    excludeFields?: string[];
    customConditions?: any[];
  } = {}
) => {
  const { and, or, eq, ilike, gt } = ops;
  const conditions: any[] = options.customConditions || [];

  // 1. Global Search
  if (query.search && options.searchFields) {
    const searchConditions = options.searchFields
      .filter(key => fields[key])
      .map(key => ilike(fields[key], `%${query.search}%`));
    if (searchConditions.length > 0) conditions.push(or(...searchConditions));
  }

  // 2. Auto-mapping berdasarkan Query Params
  for (const key in query) {
    // Lewati parameter internal paginasi/include
    if (['page', 'limit', 'cursor', 'include', 'search'].includes(key)) continue;
    if (options.excludeFields?.includes(key)) continue;

    const value = query[key];
    const column = fields[key];
    
    if (!column || value === undefined || value === '') continue;

    // Tentukan Operator
    if (options.exactFields?.includes(key) || typeof value === 'boolean') {
      const finalVal = (value === 'true') ? true : (value === 'false') ? false : value;
      conditions.push(eq(column, finalVal));
    } else {
      conditions.push(ilike(column, `%${value}%`));
    }
  }

  // 3. Pagination Cursor
  if (query.cursor && fields.id) {
    conditions.push(gt(fields.id, query.cursor));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};
