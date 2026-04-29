require "test_helper"

class VideosTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

  setup do
    @user = User.create!(email: "person@example.com", password: "password123")
  end

  test "list returns shared videos newest first" do
    older = @user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      youtube_video_id: "aaaaaaaaaaa",
      title: "Older video",
      created_at: 2.days.ago,
      updated_at: 2.days.ago
    )
    newer = @user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
      youtube_video_id: "bbbbbbbbbbb",
      title: "Newer video",
      created_at: 1.day.ago,
      updated_at: 1.day.ago
    )

    get "/api/videos", as: :json

    assert_response :success
    ids = response.parsed_body["videos"].map { |video| video["id"] }
    assert_equal [ newer.id, older.id ], ids
    assert_equal "person@example.com", response.parsed_body.dig("videos", 0, "shared_by")
  end

  test "share requires authentication" do
    assert_no_difference "Video.count" do
      post "/api/videos", params: { youtube_url: "https://youtu.be/dQw4w9WgXcQ" }, as: :json
    end

    assert_response :unauthorized
    assert_equal "Unauthorized", response.parsed_body["error"]
  end

  test "authenticated user can share video" do
    login

    metadata = {
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtube_video_id: "dQw4w9WgXcQ",
      title: "Test video",
      thumbnail_url: "https://img.youtube.com/test.jpg"
    }

    assert_enqueued_with(job: VideoShareNotificationJob) do
      with_youtube_metadata(metadata) do
        assert_difference "Video.count", 1 do
          post "/api/videos", params: { youtube_url: "https://youtu.be/dQw4w9WgXcQ" }, as: :json
        end
      end
    end

    assert_response :created
    body = response.parsed_body["video"]
    assert_equal "Test video", body["title"]
    assert_equal "dQw4w9WgXcQ", body["youtube_video_id"]
    assert_equal "https://www.youtube.com/embed/dQw4w9WgXcQ", body["embed_url"]
    assert_equal "person@example.com", body["shared_by"]
  end

  test "share rejects invalid youtube url" do
    login

    with_youtube_metadata(->(_url) { raise YoutubeMetadata::Error, "Invalid YouTube URL" }) do
      assert_no_enqueued_jobs do
        assert_no_difference "Video.count" do
          post "/api/videos", params: { youtube_url: "https://example.com" }, as: :json
        end
      end
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Invalid YouTube URL"
  end

  test "share rejects oembed failure" do
    login

    with_youtube_metadata(->(_url) { raise YoutubeMetadata::Error, "Could not fetch YouTube video metadata" }) do
      assert_no_difference "Video.count" do
        post "/api/videos", params: { youtube_url: "https://youtu.be/dQw4w9WgXcQ" }, as: :json
      end
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Could not fetch YouTube video metadata"
  end

  private

  def login
    post "/api/login", params: { email: @user.email, password: "password123" }, as: :json
    assert_response :success
  end

  def with_youtube_metadata(result)
    original_fetch = YoutubeMetadata.method(:fetch)

    YoutubeMetadata.define_singleton_method(:fetch) do |url|
      result.respond_to?(:call) ? result.call(url) : result
    end

    yield
  ensure
    YoutubeMetadata.define_singleton_method(:fetch) do |url|
      original_fetch.call(url)
    end
  end
end
