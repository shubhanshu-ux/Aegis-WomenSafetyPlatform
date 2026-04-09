/**
 * Builds absolute URL for an uploaded file path like /uploads/faces/abc.jpg
 */
function filePublicUrl(req, relativePath) {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const pathPart = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base.replace(/\/$/, '')}${pathPart}`;
}

module.exports = { filePublicUrl };
