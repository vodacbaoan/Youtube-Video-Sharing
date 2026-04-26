import { apiRequest } from './client'

export type Video = {
  id: number
  title: string
  youtube_url: string
  youtube_video_id: string
  embed_url: string
  thumbnail_url: string | null
  shared_by: string
  created_at: string
}

type VideosResponse = {
  videos: Video[]
}

type VideoResponse = {
  video: Video
}

export function listVideos(): Promise<VideosResponse> {
  return apiRequest<VideosResponse>('/api/videos')
}

export function shareVideo(youtubeUrl: string): Promise<VideoResponse> {
  return apiRequest<VideoResponse>('/api/videos', {
    method: 'POST',
    body: JSON.stringify({ youtube_url: youtubeUrl }),
  })
}
