
function firstValue(...values) {
  return values.find(
    value => value !== undefined &&
             value !== null &&
             value !== ''
  ) ?? null;
}

function normalizeAnime(item = {}) {
  return {
    id: firstValue(item.id, item.mal_id, item.animeId),
    title: firstValue(item.title, item.name, item.englishTitle),
    description: firstValue(
      item.description,
      item.synopsis,
      item.overview
    ),
    posterUrl: firstValue(
      item.posterUrl,
      item.poster,
      item.image,
      item.image_url,
      item.coverImage
    ),
    genres: Array.isArray(item.genres) ? item.genres : [],
    episodes: [],
    source: firstValue(item.source, item.provider, 'external-api')
  };
}

function normalizeEpisode(item = {}) {
  return {
    id: firstValue(item.id, item.episodeId),
    number: firstValue(
      item.number,
      item.episodeNumber,
      item.episode_number
    ),
    title: firstValue(item.title, item.name),
    videoUrl: firstValue(
      item.videoUrl,
      item.video_url,
      item.streamUrl,
      item.url
    ),
    subtitlesUrl: firstValue(
      item.subtitlesUrl,
      item.subtitleUrl,
      item.subtitles_url
    )
  };
}

module.exports = {
  normalizeAnime,
  normalizeEpisode
};
