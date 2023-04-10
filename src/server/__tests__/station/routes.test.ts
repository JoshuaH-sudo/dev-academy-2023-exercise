const app = require("../../index").app
import superTest from "supertest"
import { save_station_data } from "../../controllers/station"
import { dummy_journey_A, dummy_station_A } from "../../../__mocks__/data"
import Station from "../../models/station"
import { save_journey_data } from "../../controllers/journey"

const fake_station_id = "000000000000000000000000"

//Testing the routes from an external perspective
//This will ensure that the routes exist and return the correct status codes
describe("Station Routes", () => {
  describe("Stations List", () => {
    it("/stations should exist and return 200 when getting stations", async () => {
      //store station data without _id
      const new_station = { ...dummy_station_A, _id: undefined }
      const stored_station = await save_station_data(new_station)
      const found_station = await Station.findById(stored_station._id).lean()
      expect(found_station).toBeDefined()

      const response = await superTest(app).get("/stations").query({
        page: 0,
        limit: 10,
        order: "desc",
        sort: "nimi",
      })

      expect(response.status).toBe(200)
      //Not checking the contents of the response but just that it exists.
      //Other tests will handle the contents of the response
      expect(response.body.stations).toBeDefined()
      expect(response.body.total_stations).toBeDefined()
      expect(response.body.total_pages).toBeDefined()
    })

    it("Gives status 500 when get stations fails internally", async () => {
      jest.spyOn(Station, "find").mockImplementationOnce(() => {
        throw new Error("Internal error")
      })

      const response = await superTest(app).get("/stations").query({
        page: 0,
        limit: 10,
        order: "desc",
        sort: "nimi",
      })

      expect(response.status).toBe(500)
      expect(response.body).toStrictEqual({ message: "Failed to get stations" })
    })
  })

  describe("Station Stats", () => {
    it("Gives station stats", async () => {
      const new_station = { ...dummy_station_A, _id: undefined }
      const stored_station = await save_station_data(new_station)
      const new_journey = { ...dummy_journey_A, _id: undefined }
      await save_journey_data(new_journey)

      const response = await superTest(app)
        .get(`/stations/${stored_station._id}/stats`)
        .query({
          start_date: "2021-01-01",
          end_date: "2021-12-31",
        })

      const { body, status } = response
      expect(status).toBe(200)
      expect(body).toBeDefined()

      const {
        total_journeys_ended,
        total_journeys_started,
        average_distance_started,
        average_distance_ended,
        top_5_return_stations,
        top_5_departure_stations,
      } = body
      expect(total_journeys_ended).toBeDefined()
      expect(total_journeys_started).toBeDefined()
      expect(average_distance_started).toBeDefined()
      expect(average_distance_ended).toBeDefined()
      expect(top_5_return_stations).toBeDefined()
      expect(top_5_departure_stations).toBeDefined()
    })

    it("Gives error when station stats cant find station", async () => {
      const new_station = { ...dummy_station_A, _id: undefined }
      await save_station_data(new_station)
      const new_journey = { ...dummy_journey_A, _id: undefined }
      await save_journey_data(new_journey)

      const response = await superTest(app)
        .get(`/stations/${fake_station_id}/stats`)
        .query({
          start_date: "2021-01-01",
          end_date: "2021-12-31",
        })

      expect(response.status).toBe(404)
      expect(response.body).toStrictEqual({ message: "Station not found" })
    })
  })

  describe("Station by id", () => {
    it("Gives station by id", async () => {
      //store station data without _id
      const new_station = { ...dummy_station_A, _id: undefined }
      const stored_station = await save_station_data(new_station)
      const found_station = await Station.findById(stored_station._id)
      //To help with type checking and to make sure that the station was found
      if (!found_station) throw new Error("Station not found")

      const response = await superTest(app).get(
        `/stations/${found_station._id.toString()}`
      )

      expect(response.status).toBe(200)
      //Check if the response contains the station with the same id. Needs to be converted to string because the id is an object
      expect(response.body._id.toString()).toBe(found_station._id.toString())
    })

    it("Gives 500 error when internal error occurs", async () => {
      const new_station = { ...dummy_station_A, _id: undefined }
      await save_station_data(new_station)
      jest.spyOn(Station, "findById").mockImplementationOnce(() => {
        throw new Error("Internal error")
      })

      const response = await superTest(app).get(`/stations/${fake_station_id}`)

      expect(response.status).toBe(500)
      expect(response.body).toStrictEqual({ message: "Failed to get station" })
    })

    it("Gives 404 error when incorrect station id is given", async () => {
      const new_station = { ...dummy_station_A, _id: undefined }
      await save_station_data(new_station)

      const response = await superTest(app).get(`/stations/${fake_station_id}`)

      expect(response.status).toBe(404)
      expect(response.body).toStrictEqual({ message: "Station not found" })
    })
  })
})
