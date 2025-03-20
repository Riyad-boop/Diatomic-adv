import React, { useEffect, useRef } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import * as turf from '@turf/turf';

mapboxgl.accessToken = 'pk.eyJ1Ijoicml5YWQtayIsImEiOiJja3cwdHNkaGkweXRoMm9udGUwNTN6aHc3In0.z-H0YXy5-vtH0AdTCyPsLQ';

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    const truckLocation: [number, number] = [-83.093, 42.376];
    const warehouseLocation: [number, number] = [-83.083, 42.363];

    if (mapContainer.current) {
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: truckLocation,
        zoom: 14,
      });

      mapInstance.current.on('load', async () => {
        // Add truck marker
        const marker = document.createElement('div');
        marker.className =
          'w-5 h-5 border-2 border-white rounded-full bg-blue-600 pointer-events-none';

        new mapboxgl.Marker(marker).setLngLat(truckLocation).addTo(mapInstance.current!);

         // Add a circle layer for the warehouse
         mapInstance.current!.addLayer({
          id: 'warehouse',
          type: 'circle',
          source: {
            data: warehouse,
            type: 'geojson',
          },
          paint: {
            'circle-radius': 20,
            'circle-color': 'white',
            'circle-stroke-color': '#3887be',
            'circle-stroke-width': 3,
          },
        });

        // Add a symbol layer for the warehouse
        mapInstance.current!.addLayer({
          id: 'warehouse-symbol',
          type: 'symbol',
          source: {
            data: warehouse,
            type: 'geojson',
          },
          layout: {
            'icon-image': 'grocery',
            'icon-size': 1.5,
          },
        });
        

        // add dropoffs
        await mapInstance.current!.on('click', addWaypoints);
        mapInstance.current!.addLayer({
          id: 'dropoffs-symbol',
          type: 'symbol',
          source: {
            data: dropoffs,
            type: 'geojson'
          },
          layout: {
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'marker-15'
          }
        });
      });
    }


    // Create a GeoJSON feature collection for the warehouse
    const warehouse = turf.featureCollection([turf.point(warehouseLocation)]);
    // Create an empty GeoJSON feature collection for drop-off locations
    const dropoffs = turf.featureCollection([]);
    // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
    const nothing = turf.featureCollection([]);

    async function newDropoff(coordinates: mapboxgl.LngLat) {
      // Store the clicked point as a new GeoJSON feature with
      // two properties: `orderTime` and `key`
      const pt = turf.point([coordinates.lng, coordinates.lat], {
        orderTime: Date.now(),
        key: Math.random()
      });
      dropoffs.features.push(pt);
      console.log(dropoffs);
    }
    
    function updateDropoffs(geojson: GeoJSON.FeatureCollection) {
      const source = mapInstance.current!.getSource('dropoffs-symbol');
      if (source) {
        (source as mapboxgl.GeoJSONSource).setData(geojson);
      }
    }
    
    async function addWaypoints(event: mapboxgl.MapMouseEvent) {
      // When the map is clicked, add a new drop off point
      // and update the `dropoffs-symbol` layer
      await newDropoff(mapInstance.current!.unproject(event.point));
      updateDropoffs(dropoffs);
    }


    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  return <div ref={mapContainer} className="absolute inset-0"></div>;
};



export default MapComponent;

