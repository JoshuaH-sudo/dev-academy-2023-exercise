import mongoose from "mongoose"


//Making absolutely sure there is no data in the database before any test
beforeAll(async () => {
  await connect_to_database()
  await clean_database()
})

beforeEach(async () => {
  await clean_database()
  jest.restoreAllMocks()
})

afterEach(async () => {
  await clean_database()
  jest.restoreAllMocks()
})

afterAll(async () => {
  await clean_database()
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

export const connect_to_database = (): Promise<void> => {
  //@ts-ignore mongo uri is provided by jest-mongodb
  return mongoose.connect(globalThis.__MONGO_URI__)
}

export const disconnect_from_database = (): Promise<void> => {
  return mongoose.connection.close()
}
