class CreateCollections < ActiveRecord::Migration[8.1]
  def change
    create_table :collections do |t|
      t.string :title, null: false
      t.references :user, null: false, foreign_key: true, index: false
      t.timestamps
    end

    add_index :collections, [ :user_id, :created_at ]
  end
end
