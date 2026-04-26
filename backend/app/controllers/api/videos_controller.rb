module Api
  class VideosController < ApplicationController
    before_action :authenticate_user!, only: :create

    def index
      videos = Video.includes(:user).order(created_at: :desc)

      render json: { videos: videos.map { |video| video_json(video) } }
    end

    def create
      metadata = YoutubeMetadata.fetch(params[:youtube_url])
      video = current_user.videos.new(metadata)

      if video.save
        render json: { video: video_json(video) }, status: :created
      else
        render json: { errors: video.errors.full_messages }, status: :unprocessable_entity
      end
    rescue YoutubeMetadata::Error => e
      render json: { errors: [ e.message ] }, status: :unprocessable_entity
    end

    private

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
