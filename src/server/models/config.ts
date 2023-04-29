import Joi from "joi"
import mongoose from "mongoose"

//Handles the management of the database

const config_schema = new mongoose.Schema({
  data_type: String,
  loaded: Boolean,
  current_line: {
    type: Number,
    default: 1,
  },
  // journeys_loaded: Boolean,
  // stations_loaded: Boolean,
})

const Config = mongoose.model("Config", config_schema)

//Initialize the config collection if it does not exist
export async function initialize_config_collection() {
  const config = await Config.findOne({ data_type: "station" })
  if (!config) {
    const station_config = new Config({
      data_type: "station",
      loaded: false,
      current_line: 1,
    })
    return station_config.save()
  }
  return config
}

export default Config
