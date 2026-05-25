class VideoCollection < ApplicationRecord
  belongs_to :video
  belongs_to :collection

  validates :video_id, uniqueness: { scope: :collection_id }
end
