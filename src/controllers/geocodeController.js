const { asyncHandler } = require('../utils/asyncHandler');

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Authenticated proxy to Nominatim (browser cannot set a valid User-Agent; avoids CORS).
 * Query: lat, lon
 * Returns Nominatim JSON body for client-side formatting.
 */
const reverse = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    res.status(400).json({ message: 'lat and lon query params must be numbers' });
    return;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    res.status(400).json({ message: 'Coordinates out of range' });
    return;
  }

  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('addressdetails', '1');

  const r = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'BSafeWomensSafety/1.0 (https://github.com/bsafe; emergency safety app)',
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!r.ok) {
    res.status(502).json({ message: 'Geocoding service unavailable' });
    return;
  }

  const data = await r.json();
  res.json(data);
});

module.exports = { reverse };
