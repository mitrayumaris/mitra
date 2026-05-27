/**
 * Utility to convert various Google Drive file links into direct-renderable image links.
 */
export function getDirectDriveUrl(url: string | null | undefined): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // Match standard Google Drive share links
  // E.g. https://drive.google.com/file/d/1A2B3C_4D5E6F/view?usp=sharing
  // or https://drive.google.com/open?id=1A2B3C_4D5E6F
  // or https://docs.google.com/file/d/1A2B3C_4D5E6F/edit
  let fileId = '';

  const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    const idParamMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (idParamMatch && idParamMatch[1]) {
      fileId = idParamMatch[1];
    } else {
      // Direct path format: /d/1A2B3C_4D5E6F
      const dPathMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/i);
      if (dPathMatch && dPathMatch[1]) {
        fileId = dPathMatch[1];
      }
    }
  }

  if (fileId) {
    // lh3.googleusercontent.com/d/FILE_ID is the most robust and doesn't get blocked by cross-cookie / secure iframe constraints
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return cleanUrl;
}
