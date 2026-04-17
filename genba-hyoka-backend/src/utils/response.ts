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