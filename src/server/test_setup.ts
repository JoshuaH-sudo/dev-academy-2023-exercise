import mongoose from "mongoose"

//Making absolutely sure there is no data in the database before any test
beforeAll(async () => {
  await connect_to_database()
})

// Save old environment variables to reset before each test
const OLD_ENV = process.env

beforeEach(async () => {
  // clears the cache
  jest.resetModules() 
  // Reset environment variables for index test
  process.env = { ...OLD_ENV }
  //Ensure there is no data in the database before each test
  await clean_database()
  jest.restoreAllMocks()
})

afterEach(async () => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  await disconnect_from_database()
})

const clean_database = () => {
  const collections = mongoose.connection.collections

  const promises = []
  for (const key in collections) {
    const collection = collections[key]
    promises.push(collection.deleteMany({}))
  }

  return Promise.all(promises)
}

export const connect_to_database = () => {
  // @ts-ignore global variables are provided by environment @shelf/jest-mongodb
  return mongoose.connect(global.__MONGO_URI__, { dbName: global.__MONGO_DB_NAME__ })
}

export const disconnect_from_database = (): Promise<void> => {
  return mongoose.connection.close()
}
