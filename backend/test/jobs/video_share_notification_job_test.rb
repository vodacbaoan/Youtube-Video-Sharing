require "test_helper"

class VideoShareNotificationJobTest < ActiveJob::TestCase
  include ActionCable::TestHelper

  test "broadcasts notification payload for shared video" do
    user = User.create!(email: "person@example.com", password: "password123")
    video = user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtube_video_id: "dQw4w9WgXcQ",
      title: "Test video"
    )

    assert_broadcast_on "video_shares", {
      title: "Test video",
      shared_by: "person@example.com"
    } do
      VideoShareNotificationJob.perform_now(video)
    end
  end
end
