
export const getErrorMessage = (error: unknown) => {
  if (typeof error == 'string') return error;
  if (error instanceof Error) return error.message;
  
  return String(error);
};