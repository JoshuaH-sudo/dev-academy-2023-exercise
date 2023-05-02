import mongoose from "mongoose";

// This will remove the need to clear the database every time the server is restarted and the importing can continue where is left off.
const file_tracker_schema = new mongoose.Schema({
  file_name: {
    type: String,
    required: true,
  },
  current_line: {
    type: Number,
    default: 1,
    required: true,
  },
})

const File_tracker = mongoose.model("file_tracker", file_tracker_schema)

// Assumes that there the files in the dataset directory will be static, so no delete methods are provided.

export default File_tracker