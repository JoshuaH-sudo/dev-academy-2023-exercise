import Config from "../../models/config"
const start_database = require("../../index").start_database

//Using require to make it easier to mock the functions
const journey_controller = require("../../controllers/journey")
const station_controller = require("../../controllers/station")

const mock_controller_csv_loaders = () => {
  const journey_csv_spy = jest
    .spyOn(journey_controller, "import_journey_csv_to_database")
    .mockImplementation(() => Promise.resolve())

  const station_csv_spy = jest
    .spyOn(station_controller, "import_stations_csv_to_database")
    .mockImplementation(() => Promise.resolve())

  return { journey_csv_spy, station_csv_spy }
}

describe("App", () => {
  it("Initializes the database at startup", async () => {
    const { journey_csv_spy, station_csv_spy } = mock_controller_csv_loaders()
    //mock mongoose.connect to prevent it from connecting to the database during this test
    jest
      .spyOn(require("mongoose"), "connect")
      .mockImplementation(() => Promise.resolve())

    await start_database()

    expect(journey_csv_spy).toHaveBeenCalled()
    expect(station_csv_spy).toHaveBeenCalled()

    //check that the config collection has been updated
    const config = await Config.findOne()
    expect(config).not.toBeNull()
    expect(config?.csv_data_is_loaded).toBe(true)
  })

  it("Won't initialize the database if csv data is already loaded", async () => {
    await new Config({ csv_data_is_loaded: true }).save()
    const { journey_csv_spy, station_csv_spy } = mock_controller_csv_loaders()
    //mock mongoose.connect to prevent it from connecting to the database during this test
    jest
      .spyOn(require("mongoose"), "connect")
      .mockImplementation(() => Promise.resolve())

    await start_database()

    expect(journey_csv_spy).not.toHaveBeenCalled()
    expect(station_csv_spy).not.toHaveBeenCalled()

    //check that the config collection has been updated
    const config = await Config.findOne()
    expect(config).not.toBeNull()
    expect(config?.csv_data_is_loaded).toBe(true)
  })
})
