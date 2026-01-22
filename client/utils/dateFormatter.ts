export const formatDate = (date: string | Date | number | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};
