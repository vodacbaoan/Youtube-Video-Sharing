class VideoShareNotificationJob < ApplicationJob
  queue_as :default

  def perform(video)
    ActionCable.server.broadcast("video_shares", notification_payload(video))
  end

  private

  def notification_payload(video)
    {
      title: video.title,
      shared_by: video.user.email
    }
  end
end
