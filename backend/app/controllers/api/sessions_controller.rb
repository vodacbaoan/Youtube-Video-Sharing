module Api
  class SessionsController < ApplicationController
    before_action :authenticate_user!, only: :show

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase)

      if user&.authenticate(params[:password])
        set_auth_cookie(user)
        render json: { user: user_json(user) }
      else
        render json: { error: "Invalid email or password" }, status: :unauthorized
      end
    end

    def show
      render json: { user: user_json(current_user) }
    end

    def destroy
      clear_auth_cookie
      head :no_content
    end
  end
end
