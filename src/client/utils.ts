  export const convert_distance_to_km = (distance: number) => {
    if (distance < 1000) {
      return `${distance} m`
    } else {
      return `${(distance / 1000).toFixed(2)} km`
    }
  }
