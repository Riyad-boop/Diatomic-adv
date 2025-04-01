import React, { useEffect, useRef, useState,useImperativeHandle, forwardRef  } from 'react';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import addDeliveryWaypoint from './AddDestination';
import Order from '../types/Order';
import Warehouse from '../types/Warehouse';
import DeliveryVehicle from '../types/DeliveryVehicle';


mapboxgl.accessToken = 'pk.eyJ1Ijoicml5YWQtayIsImEiOiJja3cwdHNkaGkweXRoMm9udGUwNTN6aHc3In0.z-H0YXy5-vtH0AdTCyPsLQ';

interface MapComponentProps {
  Warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  selectedWarehouse: Warehouse;
  setSelectedWarehouse: React.Dispatch<React.SetStateAction<Warehouse>>;
}

const MapComponent = forwardRef<Map | null, MapComponentProps>(
  ({Warehouses,setWarehouses, selectedWarehouse, setSelectedWarehouse }, ref) => {
    
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const [addWarehouseMode, setAddWarehouseMode] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<DeliveryVehicle | null>(null);
  // Track the state with a ref since event listeners need to access the latest state
  const addWarehouseModeRef = useRef(addWarehouseMode);
  const [warehouseId, setWarehouseId] = useState<number>(4);
  const addWarehouseIdRef = useRef(warehouseId);
  const WarehouseRef = useRef(Warehouses);
      
  // Expose the Mapbox instance to the parent component via the ref
  useImperativeHandle(ref, () => mapInstance.current!);

  useEffect(() => {
    addWarehouseModeRef.current = addWarehouseMode;
  }, [addWarehouseMode]);

  useEffect(() => {
    addWarehouseIdRef.current = warehouseId;
  }, [warehouseId]);

  useEffect(() => {
    WarehouseRef.current = Warehouses;
  }, [Warehouses]);

  //whenever the selected warehouse changes, show a popup
  useEffect(() => {
    if (mapInstance.current) {
      new mapboxgl.Popup()
        .setLngLat(selectedWarehouse.location as LngLatLike)
        .setHTML(`
          <h3> Currently selected warehouse ID: ${selectedWarehouse.id}</h3>
          <p>Location: ${selectedWarehouse.location}</p>
          `)

        .addTo(mapInstance.current);
    }
  }, [selectedWarehouse]);
  


  useEffect(() => {
      if (mapContainer.current) {
        mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: selectedWarehouse.location as LngLatLike,
        zoom: 14,
      });
    }
    if (mapInstance.current) {
      mapInstance.current.on('load', async () => {
        
        // // Display all orders on the map
        // const delivery_json = await fetch(`${process.env.PUBLIC_URL}/orders.json`).then(r => r.json())
        // // Add all the delivery points to the map
        // for (const element of delivery_json.deliveries) {
        //   const { name, address, location, packages } = element;
        //   const delivery = new Order(name, address, location, packages);
        
        //   // Create a new popup
        //   const popup = new mapboxgl.Popup({
        //     offset: 25,
        //     closeButton: false,
        //   })
        //     .setHTML(`
        //       <h3>${delivery.name}</h3>
        //       <p>${delivery.address}</p>`); // Set the popup's HTML content
        
        //   // Create a new marker element
        //   const markerElement = document.createElement('div');
        //   markerElement.className = 'w-5 h-5 border-2 border-white rounded-full bg-red-600 pointer-events-auto';
        
        //   // Create a new marker
        //   new mapboxgl.Marker(markerElement)
        //     .setLngLat([delivery.location[0], delivery.location[1]]) // Set the marker's position
        //     .addTo(mapInstance.current!); // Add the marker to the map
        
        //   // Add hover events to show/hide the popup
        //   markerElement.addEventListener('mouseenter', () => {
        //     popup.addTo(mapInstance.current!); // Show the popup on hover
        //     popup.setLngLat([delivery.location[0], delivery.location[1]]);
        //   });
        
        //   markerElement.addEventListener('mouseleave', () => {
        //     popup.remove(); // Hide the popup when the mouse leaves
        //   });
        // }

        // Add a circle layer for the warehouse
        mapInstance.current!.addLayer({
          id: 'warehouse',
          type: 'circle',
          source: {
            data: warehouses,
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
            data: warehouses,
            type: 'geojson',
          },
          layout: {
            'icon-image': 'grocery',
            'icon-size': 1.5,
          },
        });

        // add layer for selected dropoff points
        mapInstance.current!.addLayer({
          id: 'selected-dropoff-points',
          type: 'circle',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson'
          },
          paint: {
            'circle-radius': 7,
            'circle-color': '#007bff', // blue
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });

        // add layer for dropoff points
        mapInstance.current!.addLayer({
          id: 'dropoff-points',
          type: 'circle',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson'
          },
          paint: {
            'circle-radius': 7,
            'circle-color': '#f1c40f', // yellow
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });

         // add layer for remaining order points
         mapInstance.current!.addLayer({
          id: 'remaining-dropoff-points',
          type: 'circle',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson'
          },
          paint: {
            'circle-radius': 7,
            'circle-color': '#e53e3e', // red
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });

        // completed order layer
        mapInstance.current!.addLayer({
          id: 'completed-dropoff-points',
          type: 'circle',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson'
          },
          paint: {
            'circle-radius': 7,
            'circle-color': '#38a169', // green
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });

        //add circle layer for vehicles
        mapInstance.current!.addLayer({
          id: 'vehicle',
          type: 'circle',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson',
          },
          paint: {
            'circle-radius': 20,
            'circle-color': 'white',
            'circle-stroke-color': '#3887be',
            'circle-stroke-width': 2.5,
          }
        });
        // add symbol layer for vehicles
        mapInstance.current!.addLayer({
          id: 'vehicle-symbol',
          type: 'symbol',
          source: {
            data: emptyFeatureCollection,
            type: 'geojson'
          },
          layout: {
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'car',
            'icon-size': 3,
          }
        });

        // Add a layer for the routes
        mapInstance.current!.addSource('route', {
          type: 'geojson',
          data: emptyFeatureCollection
        });
        
        // add layer for route lines
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

        //add route directional arrows
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
      });
      
      // TODO - move this to parent component
      // on click event check if the feature is a warehouse and set the selected warehouse
      mapInstance.current.on('click', 'warehouse', (e) => {
        const features = mapInstance.current!.queryRenderedFeatures(e.point, {
          layers: ['warehouse'],
        });
        if (features.length > 0) {
          const feature = features[0];
          console.log('Warehouse clicked:', feature);
          const warehouse = WarehouseRef.current.find((w) => w.id === feature.properties!.id);
          if (warehouse) {
            setSelectedWarehouse(warehouse);
            setSelectedVehicle(null);
            // show all the orders assigned to the warehouse
            warehouse.showWarehouseOrders(mapInstance.current!);
            
          }
        }
      });

      // TODO - move this to parent component
      // on click event check if the feature is a warehouse and set the selected warehouse
      mapInstance.current.on('click', (e) => {
        if (!addWarehouseModeRef.current) return;
        const newWarehouse = new Warehouse(addWarehouseIdRef.current.toString(), [e.lngLat.lng, e.lngLat.lat]);
        setWarehouseId(addWarehouseIdRef.current! + 1);
        setWarehouses((prevWarehouses) => {
          const updatedWarehouses = [...prevWarehouses, newWarehouse];
          console.log('New warehouse added:', updatedWarehouses);
      
          // update the layers
          const warehouses_features = turf.featureCollection(
              updatedWarehouses.map((warehouse: Warehouse) =>
                  turf.point(warehouse.location as [number, number], { id: warehouse.id })
              )
          );
      
          (mapInstance.current!.getSource('warehouse') as mapboxgl.GeoJSONSource).setData(warehouses_features);
          (mapInstance.current!.getSource('warehouse-symbol') as mapboxgl.GeoJSONSource).setData(warehouses_features);
      
          return updatedWarehouses;
        });
      });

      // on click of a vehicle marker, show the route and select the parent warehouse
      mapInstance.current.on('click', 'vehicle', (e) => {
        const features = mapInstance.current!.queryRenderedFeatures(e.point, {
          layers: ['vehicle'],
        });
        if (features.length > 0) {
          const feature = features[0];
          console.log('Vehicle clicked:', feature);
          const warehouse = WarehouseRef.current.find((w) => w.vehicles.some((v : DeliveryVehicle) => v.id === feature.properties!.id));
          if (warehouse) {
            setSelectedWarehouse(warehouse);
          }
          // show the route
          const vehicle = warehouse!.vehicles.find((v : DeliveryVehicle ) => v.id === feature.properties!.id);
          vehicle!.showRoute();
          setSelectedVehicle(vehicle!);
        }
      });
    }

    // Create a GeoJSON feature collection for the warehouse
    const warehouses = turf.featureCollection(
      Warehouses.map((warehouse: Warehouse) => turf.point(warehouse.location as [number, number] , { id: warehouse.id }))
    );
    // Create an empty GeoJSON feature collection for drop-off locations
    // const deliveryPoints = turf.featureCollection([]);
    // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
    const emptyFeatureCollection = turf.featureCollection([]);


    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);


    // Function to move the truck along the route
    const moveTrucks = () => {
    if (!Warehouses) return;
    // loop through all the vehicles and move them along the route
    for (const warehouse of Warehouses) {
      for (const vehicle of warehouse.vehicles){
        if (selectedVehicle && vehicle.id == selectedVehicle!.id){
          vehicle.showRoute();
        }
        vehicle.MoveAlongRoute();
      }
    }
  };
  
  return (
    <div>
      <div ref={mapContainer} className="absolute inset-0"></div>
      <button
        onClick={moveTrucks}
        className="absolute top-4 right-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Move Trucks
      </button>
      <button
        onClick={() => setAddWarehouseMode(!addWarehouseMode)}
        className="absolute top-20 right-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {addWarehouseMode ? 'Cancel Add Warehouse' : 'Add Warehouse'}
      </button>

    </div>
  );
});

export default MapComponent;

