class VideoShareNotificationJob < ApplicationJob
  queue_as :default

  def perform(video)
    notification_payload(video)
  end

  private

  def notification_payload(video)
    {
      title: video.title,
      shared_by: video.user.email
    }
  end
end
