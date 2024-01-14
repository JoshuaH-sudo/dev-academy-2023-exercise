import path from "path"
import { parse } from "csv-parse"
import fs from "fs"
import { csv_station_schema } from "../models/station"
import Station from "../models/station"
import Journey from "../models/journey"
import { Station_csv_data, Station_data, Stored_station_data } from "../../common"
import { Request, Response } from "express"

import Joi from "joi"
import Config from "../models/config"
import File_tracker from "../models/file_tracker"

import debug from "debug"
import { rudder_stack_client } from ".."
const debug_log = debug("app:Station_controller:log")
const error_log = debug("app:Station_controller:error")

const datasets_path = path.join(__dirname, "../../../", "datasets", "stations")

/**
 * Clear all the stations from the database
 */
export const clear_stations = async () => {
  debug_log("Clearing Stations from the database")
  return Station.deleteMany({})
}

/**
 * Import all the stations from the csv files to the database
 */
export const import_stations_csv_to_database = async () => {
  const station_config = await get_config()

  if (station_config.loaded) {
    debug_log("Stations have already been loaded, continuing")
    return
  }

  try {
    const csv_files = fs.readdirSync(datasets_path)

    //Each file will be imported in parallel
    const read_csv_promises: Promise<void>[] = []
    //loop through all the csv files in the datasets folder
    for (const file of csv_files) {
      debug_log(`Importing ${file} to the database`)
      const csv_file_path = path.join(datasets_path, file)

      // Add a file tracker to the config for each file that is being imported so the current line can be tracked.
      await create_file_tracker(csv_file_path)

      read_csv_promises.push(read_csv_station_data(csv_file_path))
    }

    //Once all the files have been imported, update the config to reflect this
    await Promise.all(read_csv_promises)
    station_config.loaded = true
    await station_config.save()

    debug_log("All station csv files imported to the database")
  } catch (error) {
    error_log("Failed to import csv datasets to database :", error)
    throw error
  }
}

/**
 * Create a file tracker for the given file if it does not exist already.
 *  
 * @param file_name The file to track
 * @returns The created file tracker or the existing one if it already exists.
 */
export const create_file_tracker = async (file_name: string) => {
  try {
    const found_tracker = await File_tracker.findOne({ file_name })
    if (found_tracker) return found_tracker

    const new_file_tracker = new File_tracker({
      file_name,
      current_line: 1,
    })
    const file_tracker = await new_file_tracker.save()

    const config = await get_config()
    config.file_index_trackers.push(file_tracker._id)
    config.markModified("file_index_trackers")
    
    return config.save()
  } catch (error) {
    error_log("Failed to create station config file tracker :", error)
    throw error
  }
}

/**
 * Parse and validate the csv data and save it to the database.
 *  
 * @param file_path The path to the csv file to read
 */
export const read_csv_station_data = async (file_path: string): Promise<void> => {
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
      let record: Station_csv_data
      while ((record = parser.read()) !== null) {
        //Validating the data from the csv file.
        const Station_csv_data_validation = csv_station_schema.validate(record)
        if (Station_csv_data_validation.error) {
          //If the data is not valid, then log the error and continue.
          error_log(`Invalid station data found, skipping it`)

          await increment_file_tracker_index(file_path)
          continue
        }

        //Translating the data from the csv file to the data format that is easier to use and store in the application.
        const results: Station_data = {
          fid: record.FID,
          station_id: record.ID,
          nimi: record.Nimi,
          namn: record.Namn,
          name: record.Name,
          osoite: record.Osoite,
          adress: record.Adress,
          kaupunki: record.Kaupunki,
          stad: record.Stad,
          operaattor: record.Operaattor,
          kapasiteet: record.Kapasiteet,
          x: Number(record.x),
          y: Number(record.y),
        }

        //save the data to the database
        await save_station_data(results)
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
 * Gets the index of the file tracker for the given file. 
 *  
 * @param file_name The file to get the index for
 * @returns The index 
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
 * Increments the index of the file tracker for the given file.
 *  
 * @param file_name The file to increment the index for
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
 * Returns the station config or creates a new one if it does not exist.
 *  
 * @returns The station config
 */
export const get_config = async () => {
  try {
    const config = await Config.findOne({ data_type: "station" })

    if (!config) {
      debug_log("Creating new station config")
      const station_config = new Config({
        data_type: "station",
        loaded: false,
        file_index_tracker: [],
      })

      return await station_config.save()
    }

    return config
  } catch (error) {
    error_log("Failed to get station config :", error)
    throw error
  }
}

/**
 * Saves the given station data to the database.
 *  
 * @param data The station data to save 
 * @returns The new station document 
 */
export function save_station_data(data: Station_data) {
  const new_station = new Station(data)
  return new_station.save()
}

/**
 * The return data from journey table pagination query
 */
export interface Station_query_result {
  /**
   * The journeys that were found
   */
  stations: Stored_station_data[]
  /**
   * The total number of journeys in the collection
   */
  total_stations: number
  /**
   * The total number of pages in the collection defined by the limit
   */
  total_pages: number
}

const get_stations_params_schema = Joi.object({
  page: Joi.number().min(0).required(),
  limit: Joi.number().min(1).required(),
  order: Joi.string().valid("asc", "desc").required(),
  sort: Joi.string().valid("nimi", "namn", "osoite", "kapasiteet").required(),
})

export interface Pagination_query_params {
  page: string | number
  limit: string | number
  order: "asc" | "desc"
  sort: keyof Stored_station_data
}
//Get all stations with pagination
export const get_stations = async (
  req: Request<{}, {}, {}, Pagination_query_params>,
  res: Response
) => {
  try {
    let { page, limit, order, sort } = req.query

    //Query params are always strings, so we need to convert them to numbers
    page = parseInt(page as string)
    limit = parseInt(limit as string)

    const params_validation = get_stations_params_schema.validate({
      page,
      limit,
      order,
      sort,
    })

    rudder_stack_client.track({
      userId: "test-user",
      event: "get_stations",
      properties: {
        page,
        limit,
        order,
        sort,
      },
    })

    if (params_validation.error) {
      error_log("Invalid params :", params_validation.error)
      return res.status(400).json({
        message: "Invalid query params : " + params_validation.error.message,
      })
    }

    const skip = page * limit
    const stations = await Station.find().skip(skip).limit(limit)
    //sort journeys by the given sort parameter manually,
    //as mongoose sort() applies to all documents in the collection,
    //not just the ones that are returned by the query.
    stations.sort((a, b) => {
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

    const total_stations = await Station.countDocuments()
    const total_pages = Math.ceil(total_stations / limit)

    res.status(200).json({ stations, total_stations, total_pages })
  } catch (error) {
    error_log("Failed to get stations :", error)
    res.status(500).json({
      message: "Failed to get stations",
    })
  }
}

export const get_station = async (req: Request<{ _id: string }>, res: Response) => {
  try {
    const station = await Station.findById(req.params._id).lean()
    if (!station) {
      return res.status(404).json({
        message: "Station not found",
      })
    }
    res.status(200).json(station)
  } catch (error) {
    error_log("Failed to get station :", error)
    res.status(500).json({
      message: "Failed to get station",
    })
  }
}

export interface Station_stats {
  //Total number of journeys starting from the station
  total_journeys_started: number
  //Total number of journeys ending at the station
  total_journeys_ended: number
  // //The average distance of a journey starting from the station
  average_distance_started: number
  // //The average distance of a journey ending at the station
  average_distance_ended: number
  //Top 5 most popular return stations for journeys starting from the station
  top_5_return_stations: Stored_station_data[]
  //Top 5 most popular departure stations for journeys ending at the station
  top_5_departure_stations: Stored_station_data[]
}

export interface Get_station_stats_query_params extends Partial<Time_filter> {}

export const get_station_stats = async (
  req: Request<{ _id: string }, {}, {}, Time_filter | undefined>,
  res: Response<Station_stats | { message: string }>
) => {
  const { _id } = req.params
  const time_filter = req.query
  //check that time filter query is defined
  if (!time_filter?.start_date || !time_filter?.end_date) {
    return res.status(400).json({
      message: "Start_date and end_date query parameters are required",
    })
  }

  //check that start_date is after end_date
  if (time_filter.start_date > time_filter.end_date) {
    return res.status(400).json({
      message: "Start_date must be before end_date",
    })
  }

  //check that start_date and end_date are valid dates
  if (
    isNaN(Date.parse(time_filter.start_date)) ||
    isNaN(Date.parse(time_filter.end_date))
  ) {
    return res.status(400).json({
      message: "Start_date and end_date must be valid dates",
    })
  }

  const station = await Station.findById(_id).lean()
  if (!station || !station.station_id) {
    return res.status(404).json({
      message: "Station not found",
    })
  }

  const total_journeys_started = await Journey.find({
    departure_date: {
      $gte: time_filter.start_date,
      $lte: time_filter.end_date,
    },
  }).countDocuments({
    departure_station_id: station.station_id,
  })
  const total_journeys_ended = await Journey.find({
    departure_date: {
      $gte: time_filter.start_date,
      $lte: time_filter.end_date,
    },
  }).countDocuments({
    return_station_id: station.station_id,
  })

  const average_distance_started = await get_average_distance_started(
    station.station_id,
    time_filter
  )
  const average_distance_ended = await get_average_distance_ended(
    station.station_id,
    time_filter
  )

  const top_5_return_stations = await get_top_5_return_stations(
    station.station_id,
    time_filter
  )

  const top_5_departure_stations = await get_top_5_departure_stations(
    station.station_id,
    time_filter
  )

  const response_data: Station_stats = {
    total_journeys_started,
    total_journeys_ended,
    average_distance_started: average_distance_started[0]?.average_distance ?? 0,
    average_distance_ended: average_distance_ended[0]?.average_distance ?? 0,
    top_5_return_stations: top_5_return_stations.map(
      (station) => station.station_data[0]
    ),
    top_5_departure_stations: top_5_departure_stations.map(
      (station) => station.station_data[0]
    ),
  }

  return res.status(200).json(response_data)
}

export interface Top_stations {
  _id: string
  count: number
  station_data: Stored_station_data[]
}

export interface Time_filter {
  start_date: string
  end_date: string
}

//Top 5 most popular return stations for journeys starting from the station
export const get_top_5_return_stations = async (
  station_doc_id: string,
  time_filter: Time_filter
) => {
  debug_log("Getting top 5 return stations for station :", station_doc_id)
  return Journey.aggregate<Top_stations>([
    {
      //Find all journeys that have the same departure station id as the given station id
      $match: {
        departure_station_id: station_doc_id,
        departure_date: {
          $gte: new Date(time_filter.start_date),
          $lte: new Date(time_filter.end_date),
        },
      },
    },
    {
      //Group journeys by their return station id and get a count
      $group: {
        _id: "$return_station_id",
        count: { $sum: 1 },
      },
    },
    {
      //Sort that group by the count in descending order
      $sort: {
        count: -1,
      },
    },
    {
      //The Journeys with the highest count will be at the top of the array
      $limit: 5,
    },
    {
      //Get the return station data for each of the top 5 return stations
      $lookup: {
        from: "stations",
        localField: "_id",
        foreignField: "station_id",
        as: "station_data",
      },
    },
  ])
}

//Top 5 most popular departure stations for journeys ending at the station
export const get_top_5_departure_stations = async (
  station_doc_id: string,
  time_filter: Time_filter
) => {
  debug_log("Getting top 5 departure stations for station :", station_doc_id)
  return Journey.aggregate<Top_stations>([
    {
      $match: {
        return_station_id: station_doc_id,
        departure_date: {
          $gte: new Date(time_filter.start_date),
          $lte: new Date(time_filter.end_date),
        },
      },
    },
    {
      $group: {
        _id: "$departure_station_id",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: "stations",
        localField: "_id",
        foreignField: "station_id",
        as: "station_data",
      },
    },
  ])
}

//The average distance of a journey starting from the station
type average_distance = { average_distance: number }
export const get_average_distance_started = async (
  station_doc_id: string,
  time_filter: Time_filter
) => {
  debug_log("Getting average distance started for station :", station_doc_id)
  return Journey.aggregate<average_distance>([
    {
      $match: {
        departure_station_id: station_doc_id,
        departure_date: {
          $gte: new Date(time_filter.start_date),
          $lte: new Date(time_filter.end_date),
        },
      },
    },
    {
      $group: {
        _id: null,
        average_distance: { $avg: "$covered_distance" },
      },
    },
  ])
}

//The average distance of a journey ending at the station
export const get_average_distance_ended = async (
  station_doc_id: string,
  time_filter: Time_filter
) => {
  debug_log("Getting average distance ended for station :", station_doc_id)
  return Journey.aggregate<average_distance>([
    {
      $match: {
        return_station_id: station_doc_id,
        departure_date: {
          $gte: new Date(time_filter.start_date),
          $lte: new Date(time_filter.end_date),
        },
      },
    },
    {
      $group: {
        _id: null,
        average_distance: { $avg: "$covered_distance" },
      },
    },
  ])
}
