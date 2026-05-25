class Collection < ApplicationRecord
  belongs_to :user
  has_many :video_collections, -> { order(created_at: :desc) }, dependent: :destroy
  has_many :videos, through: :video_collections

  validates :title, presence: true
end
