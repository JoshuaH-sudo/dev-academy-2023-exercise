import mongoose from "mongoose"

//Handles the management of the database

const config_schema = new mongoose.Schema({
  data_type: {
    type: String,
    required: true,
  },
  loaded: {
    type: Boolean,
    default: false,
    required: true,
  },
  // This will track the index for each csv file that is imported/ This will allow the app to continue from where it left off if the server is restarted.
  // And for each file to be imported in parallel.
  file_index_trackers: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "File_tracker" }],
    default: [],
  },
})

const Config = mongoose.model("Config", config_schema)

export default Config
