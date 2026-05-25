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

    def create
      collection = current_user.collections.new(collection_params)

      if collection.save
        render json: { collection: collection_json(collection) }, status: :created
      else
        render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def add_video
      collection = current_user.collections.find(params[:id])
      video = Video.find(params[:video_id])
      item = collection.video_collections.find_or_initialize_by(video: video)

      if item.persisted?
        render json: { collection: collection_json(collection_with_videos(collection)) }
      elsif item.save
        render json: { collection: collection_json(collection_with_videos(collection)) }, status: :created
      else
        render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def remove_video
      collection = current_user.collections.find(params[:id])
      item = collection.video_collections.find_by!(video_id: params[:video_id])

      item.destroy
      head :no_content
    end

    private

    def collection_params
      params.permit(:title)
    end

    def collection_with_videos(collection)
      current_user
        .collections
        .includes(video_collections: { video: :user })
        .find(collection.id)
    end

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
