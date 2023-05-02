import express from "express"
import path from "path"
import cookieParser from "cookie-parser"
import logger from "morgan"
import mongoose from "mongoose"
import expressStaticGzip from "express-static-gzip"
import fs from "fs"

import app_router from "./routes/app"
import journey_router from "./routes/journey"
import station_router from "./routes/station"
import { import_journey_csv_to_database } from "./controllers/journey"
import { import_stations_csv_to_database } from "./controllers/station"

const { config } = require("dotenv")
config()

import debug from "debug"
const debugLog = debug("app:server:log")
const errorLog = debug("app:server:error")

const app = express()
debugLog("Starting the server")

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "..", "..", "public")))
app.use(
  "/files",
  expressStaticGzip(path.join(__dirname, "..", "..", "public"), {
    enableBrotli: true,
  })
)

app.use("/", app_router)
app.use("/journeys", journey_router)
app.use("/stations", station_router)

//Initialize the database and import csv data if it has not been imported yet.
//The datasets will be saved within the repo to ensure that the app will always have data to work with.
//Incase the HSL server is down or the data is not available, the app will still work.`
async function start_database() {
  debugLog("Connecting to database")

  const mongo_uri = await get_mongo_uri()

  await mongoose.connect(mongo_uri)

  try {
    debugLog("Initializing the database")

    const journey_import = import_journey_csv_to_database()
    const station_import = import_stations_csv_to_database()

    // Don't want to hold up the server from starting while the csv files are being imported
    Promise.all([journey_import, station_import]).then(() => {
      debugLog("Database initialization complete")
    })

  } catch (error) {
    errorLog(error)
  }
}

/**
 * Will try and retrieve the database URI from the MONGO_URI environment variable if it is defined, 
 * otherwise it will try to read the MONGO_URI_FILE environment variable and return the contents of the file.
 *
 * @returns The database URI
 */
export const get_mongo_uri = async (): Promise<string> => {
  if (process.env.MONGO_URI !== undefined) {
    //If the MONGO_URI is defined, return it
    return process.env.MONGO_URI
  } else {
    debugLog(
      "MONGO_URI is not defined, trying to read it from the MONGO_URI_FILE environment variable"
    )
    //If the MONGO_URI is not defined, try to read it from the MONGO_URI_FILE environment variable
    if (process.env.MONGO_URI_FILE !== undefined) {
      try {
        return await fs.promises.readFile(process.env.MONGO_URI_FILE, {
          encoding: "utf-8",
        })
      } catch (error) {
        errorLog(
          "MONGO_URI_FILE is defined but the file could not be read, please check that the file exists and that the user has read permissions"
        )
        process.exit(1)
      }
    } else {
      //If the MONGO_URI_FILE is not defined, exit the program
      errorLog(
        "MONGO_URI_FILE and MONGO_URI are not defined, please define it via the MONGO_URI environment variable, in the .env file or provide a path to the variable via the MONGO_URI_FILE environment variable"
      )
      process.exit(1)
    }
  }
}

if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === undefined) {
  debugLog("Running in test mode, prevent app from connecting to database")
} else {
  start_database()
}

//Has to be exported like this to allow the bin/www to import app correctly
module.exports.app = app
module.exports.start_database = start_database
