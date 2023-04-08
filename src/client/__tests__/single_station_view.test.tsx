import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import Single_station_view from "../components/single_station_view/Single_station_view"
import { dummy_station_A, dummy_station_stats } from "../../__mocks__/data"
import Popular_returns from "../components/single_station_view/components/Popular_returns"
import Popular_departures from "../components/single_station_view/components/Popular_departures"
import { convert_distance_to_km } from "../utils"
import Title_and_address from "../components/single_station_view/components/Title_and_address"
import server from "../../__mocks__/server"
import { rest } from "msw"
import { Station_stats } from "../../server/controllers/station"

describe("Single station view", () => {
  const station_doc_id = dummy_station_A._id
  const on_close_mock = jest.fn()
  it("Renders", async () => {
    render(
      <Single_station_view
        station_doc_id={station_doc_id}
        on_close={on_close_mock}
      />
    )
    const element = await screen.findByTestId("single_station_view")
    expect(element).toBeInTheDocument()
  })

  it("Displays station data", async () => {
    const { findByText } = render(<Title_and_address station={dummy_station_A} />)

    // await waitFor(async () => {
    const title = await findByText(dummy_station_A.nimi)
    const address = await findByText(dummy_station_A.osoite)

    expect(title).toBeInTheDocument()
    expect(address).toBeInTheDocument()
    // })
  })

  it("Displays correct total journeys", async () => {
    render(
      <Single_station_view
        station_doc_id={station_doc_id}
        on_close={on_close_mock}
      />
    )

    await waitFor(async () => {
      const element = await screen.findByText(
        dummy_station_stats.total_journeys_ended
      )
      expect(element).toBeInTheDocument()
    })

    await waitFor(async () => {
      const element = await screen.findByText(
        dummy_station_stats.total_journeys_started
      )
      expect(element).toBeInTheDocument()
    })
  })

  it("Shows popular return stations", async () => {
    //Using the exact component to make it easier to test
    const { findByText } = render(
      <Popular_returns
        switch_station={() => jest.fn()}
        station_stats={dummy_station_stats}
      />
    )

    const element = await findByText(
      `1. ${dummy_station_stats.top_5_return_stations[0].nimi}`
    )

    expect(element).toBeInTheDocument()
  })

  it("Shows popular departure stations", async () => {
    const { findByText } = render(
      <Popular_departures
        switch_station={() => jest.fn()}
        station_stats={dummy_station_stats}
      />
    )

    const element = await findByText(
      `1. ${dummy_station_stats.top_5_departure_stations[0].nimi}`
    )

    expect(element).toBeInTheDocument()
  })

  it("Shows popular departure stations", async () => {
    const { findByText } = render(
      <Popular_departures
        switch_station={() => jest.fn()}
        station_stats={dummy_station_stats}
      />
    )

    const element = await findByText(
      `1. ${dummy_station_stats.top_5_departure_stations[0].nimi}`
    )

    expect(element).toBeInTheDocument()
  })

  it("Converts distance to km", () => {
    const distance = 1000
    const distance_in_km = convert_distance_to_km(distance)
    expect(distance_in_km).toBe("1.00 km")
  })

  it("Converts distance to m", () => {
    const distance = 900
    const distance_in_m = convert_distance_to_km(distance)
    expect(distance_in_m).toBe("900 m")
  })

  it("Filter by month", async () => {
    server.use(
      //Route to test that the stations are filtered by month
      rest.get(
        "http://localhost:3000/api/station_stats/:station_doc_id",
        (req, res, ctx) => {
          const end_date_data = req.url.searchParams.get("start_date")
          if (!end_date_data) {
            throw new Error("No end date")
          }
          const month = new Date(end_date_data).getMonth()
          if (month === 12) {
            const new_stats: Station_stats = {
              top_5_return_stations: [],
              top_5_departure_stations: [],
              total_journeys_ended: 0,
              total_journeys_started: 0,
              average_distance_ended: 0,
              average_distance_started: 0,
            }
            return res(ctx.json(new_stats))
          } else {
            return res(ctx.json(dummy_station_stats))
          }
        }
      )
    )

    const { findByText } = render(
      <Single_station_view
        station_doc_id={station_doc_id}
        on_close={on_close_mock}
      />
    )

    //check that data is shown in view
    expect(
      await findByText(`1. ${dummy_station_stats.top_5_return_stations[0].nimi}`)
    )

    const december_button = await findByText("Dec")

    act(() => {
      december_button.click()
    })

    //check that the chart has been updated
    const popular_station = await findByText(
      `1. ${dummy_station_stats.top_5_return_stations[0].nimi}`
    )

    expect(popular_station).not.toBeInTheDocument()
  })

  //Unable to test chart, does not render all child components
})
