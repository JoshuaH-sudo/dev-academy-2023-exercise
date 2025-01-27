import path from "path"
import { Journey_csv_data, Journey_data, Stored_journey_data } from "../../common"
import { parse } from "csv-parse"
import fs from "fs"
import { csv_journey_schema } from "../models/journey"
import Journey from "../models/journey"
import { Request, Response } from "express"

import Joi from "joi"
import Config from "../models/config"
import File_tracker from "../models/file_tracker"

import debug from "debug"
const debug_log = debug("app:journey_controller:log")
const error_log = debug("app:journey_controller:error")

const datasets_path = path.join(__dirname, "../../../", "datasets")
const journey_datasets_path = path.join(datasets_path, "journeys")

/**
 * Clears all journey data from the database
 */
export const clear_journeys = async () => {
  try {
    debug_log("Clearing journeys from the database")
    return Journey.deleteMany({})
  } catch (error) {
    error_log("Failed to clear journeys :", error)
    throw error
  }
}

/**
 * Import journey data from csv files to the database
 */
export const import_journey_csv_to_database = async () => {
  const journey_config = await get_config()

  if (journey_config.loaded) {
    debug_log("Journeys have already been loaded, continuing")
    return
  }

  try {
    // Find all the csv files in the datasets folder
    const csv_files = fs.readdirSync(journey_datasets_path)

    const read_csv_promises: Promise<void>[] = []
    // Loop through all the csv files in the datasets folder
    for (const file of csv_files) {
      debug_log(`Importing ${file} to the database`)
      const csv_file_path = path.join(journey_datasets_path, file)

      await create_file_tracker(csv_file_path)

      read_csv_promises.push(read_csv_journey_data(csv_file_path))
    }

    await Promise.all(read_csv_promises)
    journey_config.loaded = true
    await journey_config.save()

    debug_log("All journey csv files imported to the database")
  } catch (error) {
    error_log("Failed to import csv datasets to database :", error)
    throw error
  }
}

/**
 * Creates a file tracker for the given file if it does not exist already. 
 * Will push the file tracker to the config file index trackers array.
 *  
 * @param file_name The path to the file to track
 * @returns The newly created / returned file tracker document 
 */
export const create_file_tracker = async (file_name: string) => {
  try {
    const found_tracker = await File_tracker.findOne({ file_name })
    if (found_tracker) return found_tracker

    const file_tracker = await new File_tracker({
      file_name,
      current_line: 1,
    }).save()

    const config = await get_config()
    config.file_index_trackers.push(file_tracker._id)
    // This will ensure that the file_index_trackers array is saved to the database.
    config.markModified("file_index_trackers")
    await config.save()

    return file_tracker
  } catch (error) {
    error_log("Failed to create station config file tracker :", error)
    throw error
  }
}

/**
 * Read and parse the data from the csv file and save it to the database.
 *  
 * @param file_path The path to the file to get the index for
 */
export const read_csv_journey_data = async (file_path: string): Promise<void> => {
  const start_line = await get_index_for_file(file_path)

  return new Promise((resolve, reject) => {
    //BOM is a byte order mark, which is a special character that is used to indicate the endianness of a file.
    //This is needed to ensure that the parser can read the file correctly.
    const parser = parse({
      from_line: start_line,
      bom: true,
      delimiter: ",",
      columns: true,
      skip_empty_lines: true,
      skip_records_with_error: true,
    })

    //Feature: Validate data before importing
    parser.on("readable", async () => {
      let record: Journey_csv_data
      // Tracks the line that is currently being read from the csv file

      while ((record = parser.read()) !== null) {
        //Validating the data from the csv file.
        const journey_csv_data_validation = csv_journey_schema.validate(record)
        if (journey_csv_data_validation.error) {
          //If the data is not valid, skip this record
          error_log(
            "Invalid journey data found, skipping it",
            journey_csv_data_validation.error
          )
          await increment_file_tracker_index(file_path)
          continue
        }
        //Check that journey is longer than 10 seconds
        if (parseInt(record["Duration (sec.)"]) < 10) {
          //skip this record
          await increment_file_tracker_index(file_path)
          continue
        }
        //Check that journey is longer than 10 meters
        if (parseInt(record["Covered distance (m)"]) < 10) {
          //skip this record
          await increment_file_tracker_index(file_path)
          continue
        }
        //Translating the data from the csv file to the data format that is easier to use and store in the application.
        const results: Journey_data = {
          departure_date: record.Departure,
          return_date: record.Return,
          departure_station_id: record["Departure station id"],
          departure_station_name: record["Departure station name"],
          return_station_id: record["Return station id"],
          return_station_name: record["Return station name"],
          covered_distance: parseInt(record["Covered distance (m)"]),
          duration: parseInt(record["Duration (sec.)"]),
        }

        //save the data to the database
        await save_journey_data(results)
        await increment_file_tracker_index(file_path)
      }
    })

    parser.on("end", () => {
      resolve()
    })

    parser.on("skip", async (error) => {
      await increment_file_tracker_index(file_path)
    })

    parser.on("error", (error: any) => {
      error_log("Error while reading station csv file", error.message)
      reject(error)
    })

    //Read the csv file and pipe it to the parser.
    fs.createReadStream(file_path).pipe(parser)
  })
}

/**
 * Get the current index for the given file via the File_tracker collection.
 *  
 * @param file_name The path to the file to get the index for
 * @returns The current_line from the file tracker document 
 */
export const get_index_for_file = async (file_name: string): Promise<number> => {
  try {
    const file_tracker = await File_tracker.findOne({ file_name })

    if (!file_tracker) {
      throw new Error(`File tracker for ${file_name} not found`)
    }

    return file_tracker.current_line
  } catch (error) {
    error_log("Failed to get station config file index :", error)
    throw error
  }
}

/**
 * Increment the current index for the given file via the File_tracker collection.
 *  
 * @param file_name The path to the file to get the index for
 */
export const increment_file_tracker_index = async (file_name: string) => {
  try {
    const file_tracker = await File_tracker.findOne({ file_name })

    if (!file_tracker) {
      throw new Error(`File tracker for ${file_name} not found`)
    }

    file_tracker.current_line += 1
    await file_tracker.save()
  } catch (error) {
    error_log("Failed to update station config :", error)
    throw error
  }
}

/**
 * Get the config document for the journey data or create it if doesn't exist.
 *  
 * @returns The config document for the journey data
 */
export const get_config = async () => {
  try {
    const config = await Config.findOne({ data_type: "journey" })

    if (!config) {
      debug_log("Creating new journey config")
      
      return await new Config({
        data_type: "journey",
        loaded: false,
        file_index_tracker: [],
      }).save()
    }

    return config
  } catch (error) {
    error_log("Failed to get journey config :", error)
    throw error
  }
}

/**
 * Save the journey data to the database.
 *  
 * @param data The data to save to the journey collection.
 * @returns The new journey document 
 */
export const save_journey_data = async (data: Journey_data) => {
  const new_journey = new Journey(data)
  return new_journey.save()
}

/**
 * The return data from journey table pagination query
 */
export interface Journey_query_result {
  /**
   * The journeys that were found
   */
  journeys: Stored_journey_data[]
  /**
   * The total number of journeys in the collection
   */
  total_journeys: number
  /**
   * The total number of pages in the collection defined by the limit
   */
  total_pages: number
}

const get_journeys_params_schema = Joi.object({
  //Joi will accept a string that can be converted to a number
  page: Joi.number().min(0).required(),
  limit: Joi.number().min(1).required(),
  order: Joi.string().valid("asc", "desc").required(),
  sort: Joi.string()
    .valid(
      "departure_station_name",
      "return_station_name",
      "covered_distance",
      "duration"
    )
    .required(),
})

export interface Pagination_query_params {
  page: string | number
  limit: string | number
  order: "asc" | "desc"
  sort: keyof Stored_journey_data
}

//Get all journeys with pagination
export const get_journeys = async (
  req: Request<{}, {}, {}, Pagination_query_params>,
  res: Response
) => {
  try {
    let { page, limit, order, sort } = req.query

    //Query params are always strings, so we need to convert them to numbers
    page = parseInt(page as string)
    limit = parseInt(limit as string)

    const params_validation = get_journeys_params_schema.validate({
      page,
      limit,
      order,
      sort,
    })

    if (params_validation.error) {
      error_log("Invalid params :", params_validation.error)
      return res.status(400).json({
        message: "Invalid query params : " + params_validation.error.message,
      })
    }

    const skip = page * limit
    const journeys = await Journey.find().skip(skip).limit(limit).lean()
    //sort stations by the given sort parameter manually,
    //as mongoose sort() applies to all documents in the collection,
    //not just the ones that are returned by the query.
    journeys.sort((a, b) => {
      //@ts-ignore - sort will always be a valid key
      if (a[sort] < b[sort]) {
        return order === "asc" ? -1 : 1
      }
      //@ts-ignore
      if (a[sort] > b[sort]) {
        return order === "asc" ? 1 : -1
      }
      return 0
    })
    const total_journeys = await Journey.countDocuments()
    const total_pages = Math.ceil(total_journeys / limit)

    res.status(200).json({ journeys, total_journeys, total_pages })
  } catch (error) {
    error_log("Failed to get journeys :", error)
    res.status(500).json({
      message: "Failed to get journeys",
    })
  }
}
