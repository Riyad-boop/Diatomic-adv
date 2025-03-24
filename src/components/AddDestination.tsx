import React, { useEffect, useRef } from 'react';
import mapboxgl, { Map,LngLat ,LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import assembleQueryURL from './RouteQueryBuilder';

export default async function addDeliveryWaypoint(coordinates: LngLat | null, waypointRegistry: Record<string, Feature>, truckLocation: LngLatLike, warehouseLocation: LngLatLike) {
    
    if (coordinates){
      // Store the clicked point as a new GeoJSON feature with
      // two properties: `orderTime` and `key`
      const pt = turf.point([coordinates.lng, coordinates.lat], {
        orderTime: Date.now(),
        key: Math.random()
      });
      waypointRegistry[pt.properties.key] = pt;
    }
    
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
      return;
    }
    else{
        return response;
    }
  }