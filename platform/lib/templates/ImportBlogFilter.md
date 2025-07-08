```javascript

'use strict';

const {REMOTE_STATIC_MOUNT} = require('@lib/routers/thumbor.js');
const {createWriteStream, mkdirSync} = require('fs');
const {project} = require('@lib/utils');

const POST_COUNT = 6;
const BLOG_PATH = `https://blog.amp.dev/wp-json/wp/v2/posts?per_page=${POST_COUNT}&_embed`;
const DEFAULT_IMG = 'AMP_Blog_Square.jpg';
const fetch = require('node-fetch');
const log = require('@lib/utils/log')('Import Blog Filter');

async function importBlog(value, callback) {
  let response;

  try {
    response = await fetch(BLOG_PATH);
  } catch (err) {
    log.error('Fetching blog posts failed:', err);
    callback(null, []);
    return;
  }

  if (!response.ok) {
    callback(null, []);
    return;
  }

  const posts = [];
  for (const wpPost of await response.json()) {
    const featuredMedia = wpPost._embedded['wp:featuredmedia'];
    const mediaDetails = featuredMedia && featuredMedia[0].media_details;
    let imageUrl = '';
    if (mediaDetails && !mediaDetails.file.endsWith(DEFAULT_IMG)) {
      // Mount image URLs to the virtual static directory
      const imgPostURL = mediaDetails.sizes.medium_large.source_url;
      const encodedURL = encodeURIComponent(imgPostURL);

      const imgDir = `${project.paths.PAGES_DEST}${REMOTE_STATIC_MOUNT}`;
      imageUrl = `${REMOTE_STATIC_MOUNT}${encodeURIComponent(encodedURL)}`;

      try {
        mkdirSync(imgDir, {recursive: true});

        const writeStream = createWriteStream(`${imgDir}${encodedURL}`);
        const rawImg = await fetch(imgPostURL);

        await new Promise((resolve, reject) => {
          rawImg.body.pipe(writeStream);
          rawImg.body.on('error', reject);
          writeStream.on('finish', resolve);
        });
      } catch (err) {
        log.error(`Fetching/saving image ${imgPostURL} failed:`, err);
        callback(null, []);
        return;
      }
    }

    const post = {
      title: wpPost._embedded['wp:term'][0][0].name,
      headline: wpPost.title.rendered,
      date: new Date(wpPost.date).toLocaleString('en-us', {
        month: 'long',
        year: 'numeric',
        day: 'numeric',
      }),
      url: wpPost.link,
    };
    if (imageUrl) {
      post.image = imageUrl;
    }
    posts.push(post);
  }
  callback(null, posts);
}

module.exports = {
  importBlog,
};
```