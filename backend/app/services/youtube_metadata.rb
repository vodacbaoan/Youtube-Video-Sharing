require "json"
require "net/http"
require "uri"

class YoutubeMetadata
  class Error < StandardError; end

  OEMBED_ENDPOINT = "https://www.youtube.com/oembed"
  VIDEO_ID_FORMAT = /\A[A-Za-z0-9_-]{11}\z/

  def self.fetch(url)
    new(url).fetch
  end

  def self.extract_video_id(url)
    new(url).extract_video_id
  end

  def initialize(url)
    @url = url.to_s.strip
  end

  def fetch
    video_id = extract_video_id
    youtube_url = normalized_watch_url(video_id)
    data = fetch_oembed(youtube_url)
    title = data["title"].to_s.strip

    raise Error, "Could not fetch YouTube video metadata" if title.blank?

    {
      youtube_url: youtube_url,
      youtube_video_id: video_id,
      title: title,
      thumbnail_url: data["thumbnail_url"].presence
    }
  end

  def extract_video_id
    uri = URI.parse(@url)
    video_id = video_id_from_uri(uri)

    raise Error, "Invalid YouTube URL" unless video_id&.match?(VIDEO_ID_FORMAT)

    video_id
  rescue URI::InvalidURIError
    raise Error, "Invalid YouTube URL"
  end

  private

  def video_id_from_uri(uri)
    host = uri.host.to_s.downcase
    path_segments = uri.path.to_s.split("/").reject(&:blank?)

    return path_segments.first if host == "youtu.be"
    return unless host == "youtube.com" || host.end_with?(".youtube.com")

    if uri.path == "/watch"
      URI.decode_www_form(uri.query.to_s).to_h["v"]
    elsif %w[shorts embed].include?(path_segments.first)
      path_segments.second
    end
  end

  def normalized_watch_url(video_id)
    "https://www.youtube.com/watch?v=#{video_id}"
  end

  def fetch_oembed(youtube_url)
    uri = URI.parse(OEMBED_ENDPOINT)
    uri.query = URI.encode_www_form(format: "json", url: youtube_url)

    response = Net::HTTP.start(
      uri.hostname,
      uri.port,
      use_ssl: true,
      open_timeout: 5,
      read_timeout: 5
    ) do |http|
      http.get(uri.request_uri)
    end

    raise Error, "Could not fetch YouTube video metadata" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue JSON::ParserError, Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError
    raise Error, "Could not fetch YouTube video metadata"
  end
end
