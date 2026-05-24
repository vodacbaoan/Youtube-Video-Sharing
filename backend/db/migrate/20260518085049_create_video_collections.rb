class CreateVideoCollections < ActiveRecord::Migration[8.1]
  def change
    create_table :video_collections do |t|
      t.references :video, null: false, foreign_key: true
      t.references :collection, null: false, foreign_key: true, index: false
      t.timestamps
    end

    add_index :video_collections, [ :collection_id, :video_id ], unique: true
  end
end
