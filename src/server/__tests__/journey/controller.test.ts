import {
  clear_journeys,
  create_file_tracker,
  import_journey_csv_to_database,
  read_csv_journey_data,
  save_journey_data,
} from "../../controllers/journey"
import { dummy_journey_A } from "../../../__mocks__/data"
import Journey from "../../models/journey"
import path from "path"
import File_tracker from "../../models/file_tracker"

import fs from 'fs';
jest.mock('fs');

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
    it("file_tracker should be created if it does not exist", async () => {
      //@ts-ignore - fs will be mocked
      jest.spyOn(fs, "readdirSync").mockReturnValueOnce([good_journeys_csv_file])
      //@ts-ignore - fs will be mocked
      jest.spyOn(fs,"createReadStream").mockReturnValueOnce({ pipe: jest.fn() })

      await import_journey_csv_to_database()

      const file_tracker = await File_tracker.findOne({
        file_name: good_journeys_csv_file,
      })

      expect(file_tracker).toBeDefined()
      expect(file_tracker?.current_line).toBe(1)
    })

    it("Should throw an error if csv files can not be read", async () => {
      jest.spyOn(fs, "readdirSync").mockImplementationOnce(() => {
        throw new Error("Error")
      })

      await expect(import_journey_csv_to_database()).rejects.toThrow("Error")
    })

    it("Should parse valid journey data from csv file", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_journeys_csv_file,
        save: jest.fn(),
      })
      await create_file_tracker(good_journeys_csv_file)
      await read_csv_journey_data(good_journeys_csv_file)

      const stored_journey = await Journey.findOne({
        departure_station_name: dummy_journey_A.departure_station_name,
      })

      expect(stored_journey).toBeDefined()
    })

    it("Should not store journey data with duration of less than 10 seconds", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_journeys_csv_file,
        save: jest.fn(),
      })
      await create_file_tracker(good_journeys_csv_file)
      await read_csv_journey_data(good_journeys_csv_file)
      //Find a journey with a duration less than 10 seconds
      const stored_journey = await Journey.findOne({
        duration: { $lt: 10 },
      })

      expect(stored_journey).toBeNull()
    })

    it("Should not store journey data with cover distance of less than 10 meters", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: good_journeys_csv_file,
        save: jest.fn(),
      })
      await create_file_tracker(good_journeys_csv_file)
      await read_csv_journey_data(good_journeys_csv_file)
      //Find a journey with a duration less than 10 seconds
      const stored_journey = await Journey.findOne({
        covered_distance: { $lt: 10 },
      })

      expect(stored_journey).toBeNull()
    })

    it("Should not parse invalid journey data from csv file", async () => {
      jest.spyOn(File_tracker, "findOne").mockResolvedValue({
        current_line: 1,
        file_name: bad_journeys_csv_file,
        save: jest.fn(),
      })
      await create_file_tracker(bad_journeys_csv_file)
      //No valid journey data is stored within this csv file
      await read_csv_journey_data(bad_journeys_csv_file)

      const new_document_count = await Journey.countDocuments()
      expect(new_document_count).toBe(0)
    })
  })
})
