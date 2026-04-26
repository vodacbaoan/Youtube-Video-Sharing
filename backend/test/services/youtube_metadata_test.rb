require "test_helper"

class YoutubeMetadataTest < ActiveSupport::TestCase
  test "extracts video id from watch url" do
    assert_equal "dQw4w9WgXcQ",
      YoutubeMetadata.extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  end

  test "extracts video id from youtu be url" do
    assert_equal "dQw4w9WgXcQ",
      YoutubeMetadata.extract_video_id("https://youtu.be/dQw4w9WgXcQ")
  end

  test "extracts video id from shorts url" do
    assert_equal "dQw4w9WgXcQ",
      YoutubeMetadata.extract_video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ")
  end

  test "extracts video id from embed url" do
    assert_equal "dQw4w9WgXcQ",
      YoutubeMetadata.extract_video_id("https://www.youtube.com/embed/dQw4w9WgXcQ")
  end

  test "rejects non youtube url" do
    error = assert_raises(YoutubeMetadata::Error) do
      YoutubeMetadata.extract_video_id("https://example.com/watch?v=dQw4w9WgXcQ")
    end

    assert_equal "Invalid YouTube URL", error.message
  end

  test "rejects malformed video id" do
    error = assert_raises(YoutubeMetadata::Error) do
      YoutubeMetadata.extract_video_id("https://www.youtube.com/watch?v=bad")
    end

    assert_equal "Invalid YouTube URL", error.message
  end
end
