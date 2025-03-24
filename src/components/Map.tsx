import React, { useEffect, useRef, useState,useImperativeHandle, forwardRef  } from 'react';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import addDeliveryWaypoint from './AddDestination';
import Delivery from '../types/Order';
import Order from '../types/Order';

mapboxgl.accessToken = 'pk.eyJ1Ijoicml5YWQtayIsImEiOiJja3cwdHNkaGkweXRoMm9udGUwNTN6aHc3In0.z-H0YXy5-vtH0AdTCyPsLQ';


interface MapComponentProps {
  mapContainer: React.RefObject<HTMLDivElement | null>;
  truckLocation: LngLatLike;
  warehouseLocation: LngLatLike;
}

const MapComponent = forwardRef(({ mapContainer, truckLocation, warehouseLocation }: MapComponentProps, ref) => {
  
  // const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<FeatureCollection | null>(null);
  const [truckMarker, setTruckMarker] = useState<mapboxgl.Marker | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useImperativeHandle(ref, () => ({
    addRoutes,
  }));


  function updateDropoffs(geojson: FeatureCollection) {
    const source = mapInstance.current!.getSource('dropoffs-symbol');
    if (source) {
      (source as mapboxgl.GeoJSONSource).setData(geojson);
    }
  }

  async function addRoutes(selectedOrders: Order[]) {
    console.log("add routes")
    console.log(selectedOrders)
    // Create an empty GeoJSON feature collection for drop-off locations
    const deliveryPoints = turf.featureCollection([]);

    // Initialize pointHopper as an empty object
    const waypointRegistry: Record<string, Feature> = {};
    
    // add each order to the waypointRegistry
    for (const order of selectedOrders) {
      const { name, address, location, packages } = order;
      const delivery = new Delivery(name, address, location, packages);
      const pt = turf.point([delivery.location[0], delivery.location[1]], {
        orderTime: Date.now(),
        key: Math.random()
      });
      deliveryPoints.features.push(pt);
      waypointRegistry[pt.properties.key] = pt
    }
    // Add all the delivery points to the map
    await addDeliveryWaypoint(null, waypointRegistry, truckLocation, warehouseLocation)
    .then((response) => {
      if (response) {
        // Create a GeoJSON feature collection
        const routeGeoJSON = turf.featureCollection([
          turf.feature(response.trips[0].geometry)
        ])
        // Update the `route` source by getting the route source
        // and setting the data equal to routeGeoJSON
        const routeSource = mapInstance.current!.getSource('route');
        if (routeSource && routeGeoJSON) {
          setRouteGeoJSON(routeGeoJSON);
          
          if (routeGeoJSON) {
            (routeSource as mapboxgl.GeoJSONSource).setData(routeGeoJSON);
          }
        }
        updateDropoffs(deliveryPoints);
      }
    });

    mapInstance.current!.addLayer({
      id: 'dropoffs-symbol',
      type: 'symbol',
      source: {
        data: deliveryPoints,
        type: 'geojson'
      },
      layout: {
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-image': 'marker-15'
      }
    });
  }

  useEffect(() => {
      if (mapContainer.current) {
        mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: truckLocation,
        zoom: 14,
      });
    }
    if (mapInstance.current) {
      mapInstance.current.on('load', async () => {
        
        const delivery_json = await fetch(`${process.env.PUBLIC_URL}/orders.json`).then(r => r.json())
        // Add all the delivery points to the map
        for (const element of delivery_json.deliveries) {
          const { name, address, location, packages } = element;
          const delivery = new Delivery(name, address, location, packages);
        
          // Create a new popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
          })
            .setHTML(`
              
              <h3>${delivery.name}</h3>
              <p>${delivery.address}</p>`); // Set the popup's HTML content
        
          // Create a new marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'w-5 h-5 border-2 border-white rounded-full bg-red-600 pointer-events-auto';
        
          // Create a new marker
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([delivery.location[0], delivery.location[1]]) // Set the marker's position
            .addTo(mapInstance.current!); // Add the marker to the map
        
          // Add hover events to show/hide the popup
          markerElement.addEventListener('mouseenter', () => {
            popup.addTo(mapInstance.current!); // Show the popup on hover
            popup.setLngLat([delivery.location[0], delivery.location[1]]);
          });
        
          markerElement.addEventListener('mouseleave', () => {
            popup.remove(); // Hide the popup when the mouse leaves
          });
        }

        // Add truck marker
        const marker = document.createElement('div');
        marker.className =
          'w-5 h-5 border-2 border-white rounded-full bg-blue-600 pointer-events-none';

        setTruckMarker(new mapboxgl.Marker(marker).setLngLat(truckLocation).addTo(mapInstance.current!));

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

        mapInstance.current!.addSource('route', {
          type: 'geojson',
          data: emptyFeatureCollection
        });
        
        mapInstance.current!.addLayer(
          {
            id: 'routeline-active',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 22, 12]
            }
          },
          'waterway-label'
        );


        //add route lines
        mapInstance.current!.addLayer(
          {
            id: 'routearrows',
            type: 'symbol',
            source: 'route',
            layout: {
              'symbol-placement': 'line',
              'text-field': '▶',
              'text-size': ['interpolate', ['linear'], ['zoom'], 12, 24, 22, 60],
              'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 12, 30, 22, 160],
              'text-keep-upright': false
            },
            paint: {
              'text-color': '#3887be',
              'text-halo-color': 'hsl(55, 11%, 96%)',
              'text-halo-width': 3
            }
          },
          'waterway-label'
        );

        // add dropoffs
        // await mapInstance.current!.on('click', addWaypoints);
        // mapInstance.current!.addLayer({
        //   id: 'dropoffs-symbol',
        //   type: 'symbol',
        //   source: {
        //     data: deliveryPoints,
        //     type: 'geojson'
        //   },
        //   layout: {
        //     'icon-allow-overlap': true,
        //     'icon-ignore-placement': true,
        //     'icon-image': 'marker-15'
        //   }
        // });
      });
    }



    // Create a GeoJSON feature collection for the warehouse
    const warehouse = turf.featureCollection([turf.point(warehouseLocation as [number, number])]);
    // Create an empty GeoJSON feature collection for drop-off locations
    // const deliveryPoints = turf.featureCollection([]);
    // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
    const emptyFeatureCollection = turf.featureCollection([]);
    // Initialize pointHopper as an empty object
    // const waypointRegistry: Record<string, Feature> = {};

    // function updateDropoffs(geojson: FeatureCollection) {
    //   const source = mapInstance.current!.getSource('dropoffs-symbol');
    //   if (source) {
    //     (source as mapboxgl.GeoJSONSource).setData(geojson);
    //   }
    // }
    
    // async function addWaypoints(event: mapboxgl.MapMouseEvent) {
    //   // When the map is clicked, add a new drop off point
    //   // and update the `dropoffs-symbol` layer
    //   await addDeliveryWaypoint(event.lngLat, deliveryPoints, waypointRegistry, truckLocation, warehouseLocation, mapInstance)
    //   .then((response) => {
    //     if (response) {
    //       // Create a GeoJSON feature collection
    //       const routeGeoJSON = turf.featureCollection([
    //         turf.feature(response.trips[0].geometry)
    //       ])
    //       // Update the `route` source by getting the route source
    //       // and setting the data equal to routeGeoJSON
    //       const routeSource = mapInstance.current!.getSource('route');
    //       if (routeSource && routeGeoJSON) {
    //         setRouteGeoJSON(routeGeoJSON);
            
    //         if (routeGeoJSON) {
    //           (routeSource as mapboxgl.GeoJSONSource).setData(routeGeoJSON);
    //         }
    //       }
    //       updateDropoffs(deliveryPoints);
    //     }
    //   });
    // }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);


    // Function to move the truck along the route
    const moveTruck = () => {

    if (!routeGeoJSON || !truckMarker) return;

    const line = routeGeoJSON.features[0] as any;
    const routeLength = turf.length(line); // Get the total length of the route in kilometers

    // Calculate the new distance traveled
    const newDistance = distanceTraveled + 0.1; // Move 0.1 km (100 meters) per click
    if (newDistance > routeLength) {
      console.log('Truck has reached the end of the route');
      return;
    }

    // Get the new position along the route
    const newPosition = turf.along(line, newDistance);

    // Update the truck marker position
    const [lng, lat] = newPosition.geometry.coordinates;
    truckMarker.setLngLat([lng, lat]);

    // Update the distance traveled
    setDistanceTraveled(newDistance);
  };
  
  return (
    <div>
      <div ref={mapContainer} className="absolute inset-0"></div>
      <button
        onClick={moveTruck}
        className="absolute top-4 right-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Move Truck
      </button>
    </div>
  );
});

export default MapComponent;

