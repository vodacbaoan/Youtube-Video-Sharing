require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  test "register creates a user and sets auth cookie" do
    assert_difference "User.count", 1 do
      post "/api/register", params: { email: "new@example.com", password: "password123" }, as: :json
    end

    assert_response :created
    assert_equal "new@example.com", response.parsed_body.dig("user", "email")
    assert cookies["youtube_share_auth"].present?
  end

  test "register rejects duplicate email" do
    User.create!(email: "dupe@example.com", password: "password123")

    assert_no_difference "User.count" do
      post "/api/register", params: { email: "DUPE@example.com", password: "password123" }, as: :json
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Email has already been taken"
  end

  test "register rejects mismatched password confirmation" do
    assert_no_difference "User.count" do
      post "/api/register",
        params: {
          email: "new@example.com",
          password: "password123",
          password_confirmation: "different123"
        },
        as: :json
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Password confirmation doesn't match Password"
  end

  test "login succeeds with valid credentials" do
    User.create!(email: "person@example.com", password: "password123")

    post "/api/login", params: { email: "person@example.com", password: "password123" }, as: :json

    assert_response :success
    assert_equal "person@example.com", response.parsed_body.dig("user", "email")
    assert cookies["youtube_share_auth"].present?
  end

  test "login trims and normalizes email before authentication" do
    User.create!(email: "person@example.com", password: "password123")

    post "/api/login",
      params: { email: "  PERSON@example.com  ", password: "password123" },
      as: :json

    assert_response :success
    assert_equal "person@example.com", response.parsed_body.dig("user", "email")
    assert cookies["youtube_share_auth"].present?
  end

  test "login rejects invalid credentials" do
    User.create!(email: "person@example.com", password: "password123")

    post "/api/login", params: { email: "person@example.com", password: "wrong-password" }, as: :json

    assert_response :unauthorized
    assert_equal "Invalid email or password", response.parsed_body["error"]
    assert cookies["youtube_share_auth"].blank?
  end

  test "me returns current user with valid cookie" do
    post "/api/register", params: { email: "person@example.com", password: "password123" }, as: :json

    get "/api/me", as: :json

    assert_response :success
    assert_equal "person@example.com", response.parsed_body.dig("user", "email")
  end

  test "me returns unauthorized without cookie" do
    get "/api/me", as: :json

    assert_response :unauthorized
    assert_equal "Unauthorized", response.parsed_body["error"]
  end

  test "logout clears auth cookie" do
    post "/api/register", params: { email: "person@example.com", password: "password123" }, as: :json
    delete "/api/logout", as: :json

    assert_response :no_content

    get "/api/me", as: :json
    assert_response :unauthorized
  end
end
