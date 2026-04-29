class ApplicationController < ActionController::API
  include ActionController::Cookies

  AUTH_COOKIE_NAME = :youtube_share_auth
  AUTH_TOKEN_EXPIRY = 7.days

  private

  def current_user
    @current_user ||= begin
      payload = decoded_auth_token
      User.find_by(id: payload["user_id"]) if payload
    end
  end

  def authenticate_user!
    return if current_user

    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def set_auth_cookie(user)
    cookies[AUTH_COOKIE_NAME] = auth_cookie_options.merge(
      value: encode_auth_token(user),
      expires: AUTH_TOKEN_EXPIRY.from_now
    )
  end

  def clear_auth_cookie
    cookies.delete(
      AUTH_COOKIE_NAME,
      same_site: auth_cookie_options[:same_site],
      secure: auth_cookie_options[:secure]
    )
  end

  def user_json(user)
    { id: user.id, email: user.email }
  end

  def encode_auth_token(user)
    JWT.encode(
      { user_id: user.id, exp: AUTH_TOKEN_EXPIRY.from_now.to_i },
      Rails.application.secret_key_base,
      "HS256"
    )
  end

  def decoded_auth_token
    token = cookies[AUTH_COOKIE_NAME]
    return if token.blank?

    JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256").first
  rescue JWT::DecodeError
    nil
  end

  def auth_cookie_options
    secure_cookie = ActiveModel::Type::Boolean.new.cast(
      ENV.fetch("AUTH_COOKIE_SECURE", Rails.env.production?)
    )

    {
      httponly: true,
      secure: secure_cookie,
      same_site: secure_cookie ? :none : :lax
    }
  end
end
