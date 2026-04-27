require "test_helper"

class VideoSharesChannelTest < ActionCable::Channel::TestCase
  test "subscribes to video shares stream" do
    subscribe

    assert subscription.confirmed?
    assert_has_stream "video_shares"
  end
end
