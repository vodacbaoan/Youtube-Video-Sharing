import { apiRequest } from './client'
import type { Video } from './videos'

export type Collection = {
  id: number
  title: string
  created_at: string
  videos: Video[]
}

type CollectionsResponse = {
  collections: Collection[]
}

type CollectionResponse = {
  collection: Collection
}

export function listCollections(): Promise<CollectionsResponse> {
  return apiRequest<CollectionsResponse>('/api/collections')
}

export function createCollection(title: string): Promise<CollectionResponse> {
  return apiRequest<CollectionResponse>('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function addVideoToCollection(
  collectionId: number,
  videoId: number,
): Promise<CollectionResponse> {
  return apiRequest<CollectionResponse>(`/api/collections/${collectionId}/videos`, {
    method: 'POST',
    body: JSON.stringify({ video_id: videoId }),
  })
}

export function removeVideoFromCollection(collectionId: number, videoId: number): Promise<void> {
  return apiRequest<void>(`/api/collections/${collectionId}/videos/${videoId}`, {
    method: 'DELETE',
  })
}
