class Video < ApplicationRecord
  YOUTUBE_VIDEO_ID_FORMAT = /\A[A-Za-z0-9_-]{11}\z/

  belongs_to :user
  has_many :video_collections, dependent: :destroy
  has_many :collections, through: :video_collections

  validates :youtube_url, presence: true
  validates :youtube_video_id, presence: true, format: { with: YOUTUBE_VIDEO_ID_FORMAT }
  validates :title, presence: true

  def embed_url
    "https://www.youtube.com/embed/#{youtube_video_id}"
  end
end
