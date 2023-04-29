import Joi from "joi"
import mongoose from "mongoose"

//Handles the management of the database

const config_schema = new mongoose.Schema({
  journeys_loaded: Boolean,
  stations_loaded: Boolean,
})

const Config = mongoose.model("Config", config_schema)

//Initialize the config collection if it does not exist
export async function initialize_config_collection() {
    const config = await Config.findOne({})
    if (!config) {
      const new_config = new Config({ journeys_loaded: false, stations_loaded: false })
      return await new_config.save()
    }
    return config
}

export default Config
