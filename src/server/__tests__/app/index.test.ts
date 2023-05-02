import path from "path"
import { get_mongo_uri } from "../../index"

describe("Index", () => {
  describe("Mongo URI", () => {
    // Save old environment variables to reset before each test
    let OLD_ENV = process.env
    beforeAll(() => {
      OLD_ENV = process.env
    })

    beforeEach(async () => {
      // Reset environment variables for index test
      process.env = { ...OLD_ENV }
    })

    afterAll(() => {
      // Reset environment variables after index test
      process.env = OLD_ENV
    })

    it("Will get the mongo uri from the MONGO_URI environment variable", async () => {
      process.env.MONGO_URI = "test"

      const mongo_uri = await get_mongo_uri()

      expect(mongo_uri).toBe("test")
    })

    it("Will get the mongo uri from the MONGO_URI_FILE environment variable", async () => {
      const mongo_uri_env_path = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "__mocks__",
        "mongo_uri.env"
      )

      process.env.MONGO_URI_FILE = mongo_uri_env_path

      const mongo_uri = await get_mongo_uri()

      expect(mongo_uri).toBe("test2")
    })
  })
})
