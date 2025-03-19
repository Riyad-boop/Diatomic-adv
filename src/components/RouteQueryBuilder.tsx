import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';

 // Here you'll specify all the parameters necessary for requesting a response from the Optimization API
export default function assembleQueryURL(truckLocation: LngLatLike, waypointRegistry: Record<string, Feature>, warehouseLocation: LngLatLike): string {
    // Store the location of the truck in a constant called coordinates
    const coordinates = [truckLocation];
    const distributions = [];
    const restaurantIndex = 0; // Initialize with a default value (e.g., timestamp or 0)
    const keepTrack: any = [truckLocation];

    // Create an array of GeoJSON feature collections for each point
    const restJobs = Object.keys(waypointRegistry).map((key) => waypointRegistry[key]);

    // If there are any orders from this restaurant
    if (restJobs.length > 0) {
      // Check to see if the request was made after visiting the restaurant
      const needToPickUp =
        restJobs.filter((d) => {
          return d.properties && d.properties.orderTime > restaurantIndex;
        }).length > 0;

      // If the request was made after picking up from the restaurant,
      // Add the restaurant as an additional stop
      if (needToPickUp) {
        const restaurantIndex = coordinates.length;
        // Add the restaurant as a coordinate
        coordinates.push(warehouseLocation);
        // push the restaurant itself into the array
        keepTrack.push(warehouseLocation);
      }

      for (const job of restJobs) {
        console.log(job);

        // Add dropoff to list
        if (job.geometry && job.geometry.type === 'Point') {
          keepTrack.push(job);
        }
        //ignore error above
        if (job.geometry && job.geometry.type === 'Point') {
          coordinates.push(job.geometry.coordinates as [number, number]);
        }
        // if order not yet picked up, add a reroute
        if (job.properties && (job.properties as { orderTime: number }).orderTime > restaurantIndex) {
          distributions.push(`${restaurantIndex},${coordinates.length - 1}`);
        }
      }
    }

    // Set the profile to `driving`
    // Coordinates will include the current location of the truck,
    return `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates.join(
    ';'
    )}?distributions=${distributions.join(
    ';'
    )}&overview=full&steps=true&geometries=geojson&source=first&access_token=${
    mapboxgl.accessToken
    }`;
}