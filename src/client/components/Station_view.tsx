import React, { useEffect, useState } from "react"
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSearchBar,
  EuiSearchBarProps,
  EuiTableSortingType,
  Pagination,
  Query,
  SearchFilterConfig,
} from "@elastic/eui"
import axios from "axios"
import { Stored_station_data } from "../../common"
import {
  Get_stations_query_params,
  Station_query_result,
} from "../../server/controllers/station"
import Single_station_view from "./single_station_view/Single_station_view"
import use_api from "../hooks/use_api"

const Station_view = () => {
  const [is_loading, set_is_loading] = useState(false)
  const [station_data, set_station_data] = useState<Stored_station_data[]>([])
  const [sorting, set_sorting] = useState<EuiTableSortingType<Stored_station_data>>({
    sort: { field: "nimi", direction: "asc" },
  })
  const [search_query, set_search_query] = useState<Query | string>("")
  const [pagination, set_pagination] = useState<Pagination>({
    pageIndex: 0,
    pageSize: 10,
    totalItemCount: 0,
    pageSizeOptions: [10, 25, 50],
    showPerPageOptions: true,
  })
  const api = use_api()
  const [error, set_error] = useState<string | undefined>(undefined)

  const get_station_data = async () => {
    set_error(undefined)
    try {
      if (!sorting || !sorting.sort) throw "Sorting is not defined"

      //Sorting needs to be manually controlled while using filters and pagination
      const params: Get_stations_query_params = {
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        sort: sorting.sort.field,
        order: sorting.sort.direction,
      }
      const response = await api.get<Station_query_result>("/stations", {
        params,
      })

      set_station_data(response.data.stations)
      set_pagination({
        ...pagination,
        totalItemCount: response.data.total_stations,
      })
    } catch (error) {
      if (typeof error === "string") set_error(error)
      console.error(error)
    }
    set_is_loading(false)
  }

  //Fetch data on page load and when pagination changes
  useEffect(() => {
    set_is_loading(true)
    get_station_data()
  }, [pagination.pageIndex, pagination.pageSize, sorting])

  //Create filters for the search bar
  const filters: SearchFilterConfig[] = [
    //A filter to set range for capacity of stations
    {
      type: "field_value_selection",
      field: "kapasiteet",
      name: "Capacity",
      multiSelect: false,
      operator: "gte",
      options: [
        {
          value: 10,
          view: "10 or more",
        },
        {
          value: 25,
          view: "25 or more",
        },
        {
          value: 50,
          view: "50 or more",
        },
      ],
    },
  ]

  //Filter the data based on the search query
  const queried_items = EuiSearchBar.Query.execute(search_query, station_data, {
    defaultFields: ["kapasiteet", "nimi", "namn", "osoite"],
  })

  const on_search_change: EuiSearchBarProps["onChange"] = ({ query, error }) => {
    if (error) {
      console.error(error)
    } else {
      set_search_query(query)
    }
  }

  const [show_single_station_view, set_show_single_station_view] = useState<string>()
  const show_station_view = (station_doc_id: string) => {
    set_show_single_station_view(station_doc_id)
  }
  const close_station_view = () => {
    set_show_single_station_view(undefined)
  }

  //Define the columns for the table to display station data
  const columns: EuiBasicTableColumn<Stored_station_data>[] = [
    {
      field: "nimi",
      name: "Finnish name",
      sortable: true,
      render: (nimi, item) => (
        <EuiLink onClick={() => show_station_view(item._id)} target="_blank">
          {nimi}
        </EuiLink>
      ),
    },
    {
      field: "namn",
      name: "Swedish name",
      sortable: true,
    },
    {
      field: "osoite",
      name: "Finnish address",
      sortable: true,
    },
    {
      field: "kapasiteet",
      name: "Capacity",
      sortable: true,
    },
  ]

  return (
    <>
      <EuiFlexGroup gutterSize="s" direction="column">
        <EuiFlexItem grow={false}>
          <EuiSearchBar
            box={{
              incremental: true,
            }}
            filters={filters}
            onChange={on_search_change}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiBasicTable
            data-testid="station_table"
            loading={is_loading}
            error={error}
            items={queried_items}
            columns={columns}
            pagination={pagination}
            onChange={({ page: { index, size }, sort }) => {
              set_pagination({ ...pagination, pageIndex: index, pageSize: size })
              if (sort) {
                set_sorting({
                  sort: { field: sort.field, direction: sort.direction },
                })
              }
            }}
            sorting={sorting}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      {show_single_station_view && (
        <Single_station_view
          station_doc_id={show_single_station_view}
          on_close={close_station_view}
        />
      )}
    </>
  )
}

export default Station_view
