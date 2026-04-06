export const buildDriveLink = (fileId: string): string => {
  if (!fileId) return '';
  if (fileId.startsWith('http')) return fileId;
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
};
