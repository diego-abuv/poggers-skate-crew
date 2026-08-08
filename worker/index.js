export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/media') {
      return handleMediaList(env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

const EXCLUDE = ['banner-pgrs', 'favicon-180', 'favicon-32'];

async function handleMediaList(env) {
  const bucket = env.R2_BUCKET;
  const items = [];

  const prefixes = ['images/', 'videos/'];
  for (const prefix of prefixes) {
    let cursor = undefined;
    do {
      const listed = await bucket.list({ prefix, cursor, limit: 100 });
      for (const obj of listed.objects) {
        const key = obj.key;
        const name = key.split('/').pop().replace(/\.[^.]+$/, '');
        const ext = key.split('.').pop().toLowerCase();
        const isVideo = ext === 'mp4' || ext === 'webm';
        const isImage = ext === 'webp' || ext === 'jpg' || ext === 'jpeg' || ext === 'png';

        if (!isVideo && !isImage) continue;
        if (EXCLUDE.includes(name)) continue;

        const baseUrl = 'https://pub-492dfc52bf1c49a8b28debf94323c213.r2.dev';

        items.push({
          type: isVideo ? 'video' : 'image',
          src: `${baseUrl}/${key}`,
          alt: nameToCaption(name),
          caption: nameToCaption(name),
          ...(isVideo ? { thumb: `${baseUrl}/thumbs/${name}.webp` } : {}),
        });
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }

  return new Response(JSON.stringify({ media: items }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function nameToCaption(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
