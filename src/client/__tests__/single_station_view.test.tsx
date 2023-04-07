import React from "react"
import { findByTitle, render, screen, waitFor } from "@testing-library/react"
import Single_station_view from "../components/single_station_view/Single_station_view"
import { dummy_station_A, dummy_station_stats } from "../../__mocks__/data"
import { convert_distance_to_km } from "../utils"

describe("Single station view", () => {
  const station_doc_id = "1"
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
    render(
      <Single_station_view
        station_doc_id={station_doc_id}
        on_close={on_close_mock}
      />
    )
    const element = await screen.findByText(dummy_station_A.nimi)
    expect(element).toBeInTheDocument()
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

  it("Displays correct average distance", async () => {
    const { container } = render(
      <Single_station_view
        station_doc_id={station_doc_id}
        on_close={on_close_mock}
      />
    )

    await waitFor(async () => {
      const started_km_distance = convert_distance_to_km(
        dummy_station_stats.average_distance_started
      )
      const element = container.querySelector(`[title="${started_km_distance}"]`)
      expect(element).toBeInTheDocument()
    })

    await waitFor(async () => {
      const ended_km_distance = convert_distance_to_km(
        dummy_station_stats.average_distance_started
      )
      const element = container.querySelector(`[title="${ended_km_distance}"]`)
      expect(element).toBeInTheDocument()
    })
  })
})
