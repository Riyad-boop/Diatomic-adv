import React, {useEffect,useState,useRef} from 'react';
import MapComponent from './components/Map';
import Dashboard from './components/Dashboard';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import Order from './types/Order';
import Warehouse from './types/Warehouse';
import DeliveryVehicle from './types/DeliveryVehicle';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import assembleQueryURL from './components/RouteQueryBuilder';

const App: React.FC = () => {
  const mapRef = useRef<Map | null>(null)
  const [Warehouses, setWarehouses] = useState<Warehouse[]>(
    [new Warehouse('1', [-1.9109365,52.504115]), 
    new Warehouse('2', [-1.8496529862234183,52.46825020597893]), 
    new Warehouse('3', [-1.936793262719931,52.46958617249447])]
  );
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(Warehouses[0]);
  const [confirmRoute, setConfirmRoute] = useState<boolean>(false);
  
  async function addRoutes(selectedVehicle: DeliveryVehicle) {
      console.log("adding routes to vehicle...", selectedOrders);
      // Create an empty GeoJSON feature collection for drop-off locations
      const waypointRegistry = turf.featureCollection([]);
  
      // Initialize pointHopper as an empty object
      const DeliveryPoints: Record<string, Feature> = {};
      
      // add each order to the waypointRegistry
      for (const order of selectedOrders) {
        const { name, address, location, packages } = order;
        const deliveryOrder = new Order(name, address, location, packages);
        const pt = turf.point([deliveryOrder.location[0], deliveryOrder.location[1]], {
          orderTime: Date.now(),
          key: Math.random()
        });
        waypointRegistry.features.push(pt);
        DeliveryPoints[pt.properties.key] = pt
      }

      const query = await fetch(assembleQueryURL([selectedVehicle.location[0],selectedVehicle.location[1]],DeliveryPoints,selectedWarehouse.toLngLat()), { method: 'GET' });
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
          // update vehicle route
          selectedVehicle.setRoute(turf.featureCollection([turf.feature(response.trips[0].geometry)]));
          selectedVehicle.showRoute();
          setConfirmRoute(true);
          // return response;
      }
      // Add all the delivery points to the map

    }

  useEffect(() => {
    if (mapRef.current && confirmRoute && selectedWarehouse && selectedOrders.length > 0) {
      console.log("creating vehicle...");
      // create a vehicle for the selected warehouse
      const vehicle = new DeliveryVehicle(Math.random().toString(36).substr(2, 9), selectedWarehouse.location, selectedOrders, mapRef.current);
      addRoutes(vehicle);
      // add vehicle to the warehouse
      selectedWarehouse.addVehicle(vehicle);
      // update the warehouse array with the selected warehouse
      setWarehouses(Warehouses.map((w) => w.id === selectedWarehouse.id ? selectedWarehouse : w));
    }
  }, [confirmRoute]);

  //TODO REMOVE THIS
  useEffect(() => {
    if (selectedWarehouse) {
      setSelectedOrders([]);
    }
    console.log("updated selected warehouse", selectedWarehouse);
  }
  , [selectedWarehouse]);
  
  return (
    <div className="h-screen w-screen">
      <Dashboard 
      ref={mapRef}
      selectedWarehouse={selectedWarehouse.location} 
      selectedOrders={selectedOrders} 
      setSelectedOrders={setSelectedOrders} 
      setConfirmRoute={setConfirmRoute}/>

      <MapComponent
        ref={mapRef} // Pass the ref to the MapComponent
        Warehouses={Warehouses}
        setWarehouses={setWarehouses}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
      />
     
    </div>
  );
};

export default App;