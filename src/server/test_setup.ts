import mongoose from "mongoose"

beforeAll(async () => {
  await connect_to_database()
  await clean_database()
  await display_collections()
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

const display_collections = async (): Promise<void> => {
  //console log all collections
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    const documents = await collection.find().toArray()
    console.log(key, documents)
  }
}

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
