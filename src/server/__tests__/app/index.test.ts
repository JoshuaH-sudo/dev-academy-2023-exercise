import path from "path"
import { get_mongo_uri } from "../../index"


// Save old environment variables to reset before each test
const OLD_ENV = process.env

describe("Index", () => {
  describe("Mongo URI", () => {
    beforeEach(async () => {
      // clears the cache
      jest.resetModules()

      console.debug("Before each")
      console.debug(process.env.MONGO_URI_FILE)
      console.debug(process.env.MONGO_URI)
      // Reset environment variables for index test
      process.env = { ...OLD_ENV }

      console.debug("after")
      console.debug(process.env.MONGO_URI_FILE)
      console.debug(process.env.MONGO_URI)
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
