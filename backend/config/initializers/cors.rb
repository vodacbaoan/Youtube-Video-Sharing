# Be sure to restart your server when you modify this file.

frontend_origins = ENV.fetch(
  "FRONTEND_ORIGIN",
  "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*frontend_origins)

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      credentials: true
  end
end
