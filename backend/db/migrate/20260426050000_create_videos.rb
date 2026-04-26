class CreateVideos < ActiveRecord::Migration[8.1]
  def change
    create_table :videos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :youtube_url, null: false
      t.string :youtube_video_id, null: false
      t.string :title, null: false
      t.string :thumbnail_url

      t.timestamps
    end

    add_index :videos, :created_at
    add_index :videos, :youtube_video_id
  end
end
