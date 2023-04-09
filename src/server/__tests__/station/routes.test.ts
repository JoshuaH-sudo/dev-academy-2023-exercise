const app = require("../../index")
import superTest from "supertest"
import { save_station_data } from "../../controllers/station"
import { dummy_station_A } from "../../../__mocks__/data"
import Station from "../../models/station"

//Testing the routes from an external perspective
//This will ensure that the routes exist and return the correct status codes
describe("Station Routes", () => {
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

  it("Gives station by id", async () => {
    //store station data without _id
    const new_station = { ...dummy_station_A, _id: undefined }
    const stored_station = await save_station_data(new_station)
    //Check that get_station returns the correct station from collection
    const found_station = await Station.findById(stored_station._id)
    if (!found_station) {
      throw new Error("Station not found")
    }

    const response = await superTest(app).get(
      `/stations/${found_station._id.toString()}`
    )

    expect(response.status).toBe(200)
    //Check if the response contains the station with the same id. Needs to be converted to string because the id is an object
    expect(response.body._id.toString()).toBe(found_station._id.toString())
  })

  it("Gives error when incorrect station id is given", async () => {
    //store station data without _id
    const new_station = { ...dummy_station_A, _id: undefined }
    const stored_station = await save_station_data(new_station)
    //Check that get_station returns the correct station from collection
    const found_station = await Station.findById(stored_station._id)
    if (!found_station) {
      throw new Error("Station not found")
    }

    //This id is not in the database but is a valid id string
    const response = await superTest(app).get("/stations/643274a15192df30bdc034a0")

    //Check if the response was called
    expect(response.status).toBe(404)
    //Check if the response was called with the correct error message
    expect(response.body).toStrictEqual({ message: "Station not found" })
  })
})
