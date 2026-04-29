require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "requires email" do
    user = User.new(password: "password123")

    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "normalizes email before save" do
    user = User.create!(email: "  PERSON@Example.COM ", password: "password123")

    assert_equal "person@example.com", user.email
  end

  test "requires unique email case insensitively" do
    User.create!(email: "person@example.com", password: "password123")
    duplicate = User.new(email: "PERSON@example.com", password: "password123")

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email], "has already been taken"
  end

  test "authenticates password" do
    user = User.create!(email: "person@example.com", password: "password123")

    assert user.authenticate("password123")
    assert_not user.authenticate("wrong-password")
  end

  test "requires password on create" do
    user = User.new(email: "person@example.com")

    assert_not user.valid?
    assert_includes user.errors[:password], "can't be blank"
  end

  test "requires password to be at least 8 characters" do
    user = User.new(email: "person@example.com", password: "short")

    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 8 characters)"
  end
end
