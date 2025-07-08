```javascript

'use strict';

require('module-alias/register');

const CHANNEL_ID = 'UCXPBsjgKKG2HqsKBhWA4uQw';
const FEED_PATH = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const Feed = require('rss-to-json');
const log = require('@lib/utils/log')('Import YouTube Channel');

async function importYouTubeChannel(value, callback) {
  let channel;
  try {
    channel = await Feed.parse(FEED_PATH);
  } catch (err) {
    log.error('Fetching YouTube Channel failed:', err);
    callback(null, []);
    return;
  }

  const posts = channel.items.map((post) => {
    return {
      title: post.title,
      id: post.id.split(':')[2],
    };
  });

  callback(null, posts);
}

module.exports = {
  importYouTubeChannel,
};
```