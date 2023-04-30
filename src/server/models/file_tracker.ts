import mongoose from "mongoose";

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

export default File_tracker