import {
  clear_stations,
  create_file_tracker,
  get_config,
  get_index_for_file,
  import_stations_csv_to_database,
  read_csv_station_data,
  save_station_data,
} from "../../controllers/station"
import { dummy_station_A } from "../../../__mocks__/data"
import Station from "../../models/station"
import path from "path"
import File_tracker from "../../models/file_tracker"
import Config from "../../models/config"

const mock_datasets_path = path.join(__dirname, "../../../", "__mocks__", "stations")
const good_stations_csv_file = path.join(mock_datasets_path, "good_stations.csv")
const bad_stations_csv_file = path.join(mock_datasets_path, "bad_stations.csv")

//These test focus on the Station Collection, such as adding and removing documents
describe("Station Collection", () => {
  describe("Station CRUD", () => {
    it("Should save station data", async () => {
      //store station data without _id
      const station = { ...dummy_station_A, _id: undefined }
      await save_station_data(station)

      const saved_station = await Station.findOne({
        _id: station._id,
      })

      expect(saved_station).toBeDefined()
    })

    it("Should delete all station data", async () => {
      await clear_stations()

      const new_document_count = await Station.countDocuments()

      expect(new_document_count).toBe(0)
    })

    it("Should parse valid station data from csv file", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_stations_csv_file,
        save: jest.fn(),
      })

      await create_file_tracker(good_stations_csv_file)
      await read_csv_station_data(good_stations_csv_file)

      const stored_station = await Station.findOne({
        nimi: dummy_station_A.nimi,
      })

      expect(stored_station).toBeDefined()
    })

    it("Should not store station data with duration of less than 10 seconds", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_stations_csv_file,
        save: jest.fn(),
      })
      await create_file_tracker(good_stations_csv_file)
      await read_csv_station_data(good_stations_csv_file)
      //Find a station with a duration less than 10 seconds
      const stored_station = await Station.findOne({
        duration: { $lt: 10 },
      })

      expect(stored_station).toBeNull()
    })
  })

  describe("Config", () => {
    it("Should create a config document if it does not exist", async () => {
      await get_config()

      const config = await Config.findOne({ data_type: "station" })
      expect(config).toBeDefined()
    })

    it("Should return a config document if it does exist", async () => {
      const new_config = new Config({
        data_type: "station",
        loaded: true,
        file_index_trackers: [],
      })
      await new_config.save()

      const returned_config = await get_config()

      expect(returned_config).toBeDefined()
      expect(returned_config._id.toString() === new_config._id.toString()).toBe(true)
      expect(returned_config?.loaded).toBe(true)
    })
  })

  describe("File Tracker", () => {
    it("Should be appended to file_trackers in config", async () => {
      await new Config({
        data_type: "station",
        loaded: true,
        file_index_trackers: [],
      }).save()

      await create_file_tracker(good_stations_csv_file)

      const station_config = await Config.findOne({ data_type: "station" })
      expect(station_config?.file_index_trackers.length).toBe(1)
    })

    it("Should return file tracker for file", async () => {
      await new Config({
        data_type: "station",
        loaded: true,
        file_index_trackers: [],
      }).save()
      await create_file_tracker(good_stations_csv_file)

      const file_tracker = await get_index_for_file(good_stations_csv_file)

      expect(file_tracker).toBeDefined()
    })

    it("Should throw error if cannot find file tracker for file", async () => {
      expect(get_index_for_file("test.csv")).rejects.toThrowError(
        "File tracker for test.csv not found"
      )
    })
  })

  describe("Station CSV Import", () => {
    it("Should not import if stations are loaded", async () => {
      await new Config({
        data_type: "station",
        loaded: true,
        file_index_trackers: [],
      }).save()

      await import_stations_csv_to_database()

      const station_count = await Station.countDocuments()
      expect(station_count).toBe(0)
    })

    it("file tracker should be created if it does not exist", async () => {
      await create_file_tracker(good_stations_csv_file)

      const file_tracker = await File_tracker.findOne({
        file_name: good_stations_csv_file,
      })

      expect(file_tracker).toBeDefined()
      expect(file_tracker?.current_line).toBe(1)
    })

    it("Should not store station data with cover distance of less than 10 meters", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_stations_csv_file,
        save: jest.fn(),
      })

      await read_csv_station_data(good_stations_csv_file)
      //Find a station with a duration less than 10 seconds
      const stored_station = await Station.findOne({
        covered_distance: { $lt: 10 },
      })

      expect(stored_station).toBeNull()
    })

    it("Should not parse invalid station data from csv file", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: bad_stations_csv_file,
        save: jest.fn(),
      })
      const document_count = await Station.countDocuments()
      expect(document_count).toBe(0)

      await create_file_tracker(bad_stations_csv_file)
      //No valid station data is stored within this csv file
      await read_csv_station_data(bad_stations_csv_file)

      const new_document_count = await Station.countDocuments()
      expect(new_document_count).toBe(0)
    })
  })
})
