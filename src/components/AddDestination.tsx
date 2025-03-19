import React, { useEffect, useRef } from 'react';
import mapboxgl, { Map,LngLat ,LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import assembleQueryURL from './RouteQueryBuilder';

export default async function addDeliveryWaypoint(coordinates: LngLat, deliveryPoints: FeatureCollection, waypointRegistry: Record<string, Feature>, truckLocation: LngLatLike, warehouseLocation: LngLatLike, mapInstance: React.MutableRefObject<Map | null>) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    const pt = turf.point([coordinates.lng, coordinates.lat], {
      orderTime: Date.now(),
      key: Math.random()
    });
    deliveryPoints.features.push(pt);
    waypointRegistry[pt.properties.key] = pt;

    // Add a marker for the new waypoint
    const markerElement = document.createElement('div');
    markerElement.className =
      'w-5 h-5 border-2 border-white rounded-full bg-red-600 pointer-events-none';
    new mapboxgl.Marker(markerElement)
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(mapInstance.current!);

  
    // Make a request to the Optimization API
    const query = await fetch(assembleQueryURL(truckLocation,waypointRegistry,warehouseLocation), { method: 'GET' });
    const response = await query.json();
  
    // Create an alert for any requests that return an error
    if (response.code !== 'Ok') {
      const handleMessage =
        response.code === 'InvalidInput'
          ? 'Refresh to start a new route. For more information: https://docs.mapbox.com/api/navigation/optimization/#optimization-api-errors'
          : 'Try a different point.';
      alert(`${response.code} - ${response.message}\n\n${handleMessage}`);
      // Remove invalid point
      deliveryPoints.features.pop();
      delete waypointRegistry[pt.properties.key];
      return;
    }
    else{
        return response;
    }
    // remove else and uncomment below
    //  // Create a GeoJSON feature collection
    //  const routeGeoJSON = turf.featureCollection([
    //     turf.feature(response.trips[0].geometry)
    //   ]);
    //   // Update the `route` source by getting the route source
    //   // and setting the data equal to routeGeoJSON
    //   const routeSource = mapInstance.current!.getSource('route');
    //   if (routeSource) {
    //     (routeSource as mapboxgl.GeoJSONSource).setData(routeGeoJSON);
    //   }
  }