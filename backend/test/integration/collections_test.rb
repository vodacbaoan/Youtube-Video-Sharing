require "test_helper"

class CollectionsTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email: "person@example.com", password: "password123")
  end

  test "list requires authentication" do
    get "/api/collections", as: :json

    assert_response :unauthorized
    assert_equal "Unauthorized", response.parsed_body["error"]
  end

  test "list returns only current users collections with videos" do
    other_user = User.create!(email: "other@example.com", password: "password123")
    own_video = @user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      youtube_video_id: "aaaaaaaaaaa",
      title: "Own video"
    )
    other_video = other_user.videos.create!(
      youtube_url: "https://www.youtube.com/watch?v=bbbbbbbbbbb",
      youtube_video_id: "bbbbbbbbbbb",
      title: "Other video"
    )
    collection = @user.collections.create!(title: "Favorites")
    collection.video_collections.create!(video: own_video, created_at: 1.minute.ago)
    collection.video_collections.create!(video: other_video)
    other_user.collections.create!(title: "Private")

    login
    get "/api/collections", as: :json

    assert_response :success
    collections = response.parsed_body["collections"]
    assert_equal 1, collections.size
    assert_equal collection.id, collections.first["id"]
    assert_equal "Favorites", collections.first["title"]
    assert_equal [ other_video.id, own_video.id ], collections.first["videos"].map { |video| video["id"] }
    assert_equal "other@example.com", collections.first["videos"].first["shared_by"]
  end

  private

  def login
    post "/api/login", params: { email: @user.email, password: "password123" }, as: :json
    assert_response :success
  end
end
