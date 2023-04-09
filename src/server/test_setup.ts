import mongoose from "mongoose"


//Making absolutely sure there is no data in the database before any test
beforeAll(async () => {
  await connect_to_database()
})

beforeEach(async () => {
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
  return mongoose.connect(global.__MONGO_URI__, {dbName: global.__MONGO_DB_NAME__})
}

export const disconnect_from_database = (): Promise<void> => {
  return mongoose.connection.close()
}
