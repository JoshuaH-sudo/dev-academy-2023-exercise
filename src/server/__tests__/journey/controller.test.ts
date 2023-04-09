import {
  clear_journeys,
  import_journey_csv_to_database,
  read_csv_journey_data,
  save_journey_data,
} from "../../controllers/journey"
import { dummy_journey_A } from "../../../__mocks__/data"
import Journey from "../../models/journey"
import path from "path"
import fs from "fs"

const mock_datasets_path = path.join(__dirname, "../../../", "__mocks__", "journeys")
const good_journeys_csv_file = path.join(mock_datasets_path, "good_journeys.csv")
const bad_journeys_csv_file = path.join(mock_datasets_path, "bad_journeys.csv")

const save_test_journey = async (): Promise<void> => {
  const journey = { ...dummy_journey_A, _id: undefined }
  await save_journey_data(journey)

  const saved_journey = await Journey.findOne({
    _id: journey._id,
  })

  expect(saved_journey).toBeDefined()
}

//These test focus on the Journey Collection, such as adding and removing documents
describe("Journey Collection", () => {
  describe("Journey CRUD", () => {
    it("Should save journey data", async () => {
      await save_test_journey()
    })

    it("Should delete all journey data", async () => {
      await save_test_journey()
      await clear_journeys()

      const new_document_count = await Journey.countDocuments()
      expect(new_document_count).toBe(0)
    })

    it("Should throw an error if clear_journeys fails", async () => {
      await save_test_journey()
      //mocking the collection method deleteMany to see if clear_journeys throws an error correctly
      jest.spyOn(Journey, "deleteMany").mockImplementationOnce(() => {
        throw new Error("Error")
      })

      await expect(clear_journeys()).rejects.toThrow("Error")
    })
  })

  describe("Journey CSV Import", () => {
    it("Should throw an error if csv files can not be read", async () => {
      jest.spyOn(fs, "readdirSync").mockImplementationOnce(() => {
        throw new Error("Error")
      })

      await expect(import_journey_csv_to_database()).rejects.toThrow("Error")
    })

    it("Should parse valid journey data from csv file", async () => {
      await read_csv_journey_data(good_journeys_csv_file)

      const stored_journey = await Journey.findOne({
        departure_station_name: dummy_journey_A.departure_station_name,
      })

      expect(stored_journey).toBeDefined()
    })

    it("Should not store journey data with duration of less than 10 seconds", async () => {
      await read_csv_journey_data(good_journeys_csv_file)
      //Find a journey with a duration less than 10 seconds
      const stored_journey = await Journey.findOne({
        duration: { $lt: 10 },
      })

      expect(stored_journey).toBeNull()
    })

    it("Should not store journey data with cover distance of less than 10 meters", async () => {
      await read_csv_journey_data(good_journeys_csv_file)
      //Find a journey with a duration less than 10 seconds
      const stored_journey = await Journey.findOne({
        covered_distance: { $lt: 10 },
      })

      expect(stored_journey).toBeNull()
    })

    it("Should not parse invalid journey data from csv file", async () => {
      //No valid journey data is stored within this csv file
      await read_csv_journey_data(bad_journeys_csv_file)

      const new_document_count = await Journey.countDocuments()
      expect(new_document_count).toBe(0)
    })
  })
})
