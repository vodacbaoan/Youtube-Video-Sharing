module Api
  class CollectionsController < ApplicationController
    before_action :authenticate_user!

    def index
      collections = current_user
        .collections
        .includes(video_collections: { video: :user })
        .order(created_at: :desc)

      render json: { collections: collections.map { |collection| collection_json(collection) } }
    end

    private

    def collection_json(collection)
      {
        id: collection.id,
        title: collection.title,
        created_at: collection.created_at.iso8601,
        videos: collection.video_collections.map { |item| video_json(item.video) }
      }
    end

    def video_json(video)
      {
        id: video.id,
        title: video.title,
        youtube_url: video.youtube_url,
        youtube_video_id: video.youtube_video_id,
        embed_url: video.embed_url,
        thumbnail_url: video.thumbnail_url,
        shared_by: video.user.email,
        created_at: video.created_at.iso8601
      }
    end
  end
end
