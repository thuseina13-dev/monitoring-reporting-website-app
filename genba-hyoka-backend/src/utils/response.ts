/**
 * Standar respons sukses untuk operasi non-GET (POST, PUT, DELETE) 
 * atau GET data tunggal.
 */
export const sendSuccess = (data: any = null, message: string = 'Operasi berhasil') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Standar respons sukses untuk operasi GET yang membutuhkan pagination.
 * Mendukung format Offset-based dan Cursor-based.
 */
export const sendSuccessPagination = (
  data: any[], 
  meta: {
    // Untuk Offset-based
    total?: number;
    current_page?: number;
    last_page?: number;
    
    // Untuk Cursor-based
    next_cursor?: string | null;
    has_more?: boolean;
    
    // Umum
    limit: number;
  },
  message: string = 'Data retrieved successfully'
) => {
  return {
    success: true,
    message,
    data,
    meta,
  };
};

/**
 * Pagination Meta Builder: Offset-Based
 * Digunakan untuk tampilan tabel standar dengan nomor halaman.
 */
export const buildOffsetMeta = async (
  list: any[],
  limit: number,
  page: number,
  executeCount: () => Promise<number>
) => {
  const total = await executeCount();
  return {
    limit,
    total,
    current_page: page,
    last_page: Math.ceil(total / limit),
    has_more: page < Math.ceil(total / limit)
  };
};

/**
 * Pagination Meta Builder: Cursor-Based
 * Digunakan untuk Infinite Scroll / Dropdown feed.
 * Tidak menjalankan count query.
 */
export const buildCursorMeta = (
  list: any[],
  limit: number
) => {
  return {
    limit,
    next_cursor: list.length === limit ? list[list.length - 1].id : null,
    has_more: list.length === limit
  };
};