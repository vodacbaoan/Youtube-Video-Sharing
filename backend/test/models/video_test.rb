require "test_helper"

class VideoTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email: "person@example.com", password: "password123")
  end

  test "requires user url video id and title" do
    video = Video.new

    assert_not video.valid?
    assert_includes video.errors[:user], "must exist"
    assert_includes video.errors[:youtube_url], "can't be blank"
    assert_includes video.errors[:youtube_video_id], "can't be blank"
    assert_includes video.errors[:title], "can't be blank"
  end

  test "requires valid youtube video id format" do
    video = @user.videos.new(
      youtube_url: "https://www.youtube.com/watch?v=bad",
      youtube_video_id: "bad",
      title: "Bad video"
    )

    assert_not video.valid?
    assert_includes video.errors[:youtube_video_id], "is invalid"
  end

  test "returns embed url" do
    video = @user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtube_video_id: "dQw4w9WgXcQ",
      title: "Test video"
    )

    assert_equal "https://www.youtube.com/embed/dQw4w9WgXcQ", video.embed_url
  end
end
