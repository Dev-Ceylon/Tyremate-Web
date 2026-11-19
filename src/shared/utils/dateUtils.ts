export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return "—";
  }
};