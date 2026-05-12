/**
 * Utility to parse backend error responses and extract a human-readable message.
 * Handles both the main message and detailed validation errors.
 */
export const parseBackendError = (error: any): string => {
  const data = error?.response?.data;
  
  if (!data) {
    return error.message || 'Terjadi kesalahan sistem.';
  }

  let mainMessage = data.message || 'Gagal memproses permintaan.';
  
  // If there are detailed errors (e.g. validation errors)
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const detailMessages = data.errors
      .map((err: any) => {
        // Coba ambil dari schema.error atau schema.description jika ada (dari Elysia validation)
        if (err.schema) {
          if (err.schema.error) return err.schema.error;
          if (err.schema.description) return err.schema.description;
        }
        // Fallback ke summary atau message bawaan
        return err.summary || err.message;
      })
      .filter(Boolean)
      .map((msg: string) => `\n• ${msg}`)
      .join('');
    
    if (detailMessages) {
      return `${mainMessage}${detailMessages}`;
    }
  }

  return mainMessage;
};
