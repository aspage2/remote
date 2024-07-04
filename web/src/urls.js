export default {
  albumArtUrl: ({ albumartist, album }) =>
    `/go/art/${encodeURIComponent(albumartist)}/${encodeURIComponent(album)}`,

  // pages
  albumPage: ({ albumartist, album }) =>
    `/web/albumartist/${encodeURIComponent(
      albumartist
    )}/album/${encodeURIComponent(album)}`,
  artistPage: ({ artist }) => `/web/artist/${encodeURIComponent(artist)}`,
  browsePage: ({ by }) => `/web/browse/${encodeURIComponent(by || "genre")}`,
  browseGenrePage: ({ genre }) =>
    `/web/browse/genre/${encodeURIComponent(genre)}`,
  channelPage: () => "/web/channels",
  consolePage: () => "/web/console",
  queuePage: () => "/web/queue",
  searchPage: () => "/web/search",
  statsPage: () => "/web/stats",
};
