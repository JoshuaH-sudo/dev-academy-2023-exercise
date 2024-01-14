//Using import syntax allows typings from express
import express from "express";
import { rudder_stack_client } from "..";
const router = express.Router()

/* GET home page. */
router.get("/", (req, res, next) => {
  rudder_stack_client.track({
    userId: "test-user",
    event: "home_page_visited",
    properties: {
      "test-property": "test-value",
    },
  })
  res.sendFile("index.html", { root: "public" })
})

export default router
