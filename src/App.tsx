import React, {useEffect,useState,useRef} from 'react';
import MapComponent from './components/Map';
// import RoutePlanner from './components/RoutePlanner';
import Dashboard from './components/Dashboard';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import Order from './types/Order';
import Warehouse from './types/Warehouse';
import DeliveryVehicle from './types/DeliveryVehicle';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';
import assembleQueryURL from './components/RouteQueryBuilder';
import WarehouseStats from './components/WarehouseStats';

const App: React.FC = () => {
  const mapRef = useRef<Map | null>(null)
  const [Warehouses, setWarehouses] = useState<Warehouse[]>(
    [new Warehouse('1', [-1.9109365,52.504115]), 
    new Warehouse('2', [-1.8496529862234183,52.46825020597893]), 
    new Warehouse('3', [-1.936793262719931,52.46958617249447])]
  );
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>(Warehouses[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<DeliveryVehicle | null>(null);
  const [confirmRoute, setConfirmRoute] = useState<boolean>(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  
  async function addRoutes(activeVehicle: DeliveryVehicle) {
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

      const query = await fetch(assembleQueryURL([activeVehicle.location[0],activeVehicle.location[1]],DeliveryPoints,selectedWarehouse.toLngLat()), { method: 'GET' });
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
          activeVehicle.setRoute(turf.featureCollection([turf.feature(response.trips[0].geometry)]));
          activeVehicle.showRoute();
          setConfirmRoute(false);
          // return response;
      }
      // Add all the delivery points to the map
    }

  
  function sortOrders(data: Order[]) {
    // for each order calculate the distance from the selected warehouse
    const transformedOrders = data.map((order) => {
      let newOrder = new Order(order.name, order.address, order.location, order.packages);
      newOrder.setDistance(selectedWarehouse.location);
      newOrder.calculateTotalWeight();
      return newOrder;
    });
    // sort the orders by distance
    const sortedOrders = transformedOrders.sort((a:any, b:any) => a.distance - b.distance);
    return sortedOrders;
  }

  useEffect(() => {
    if (mapRef.current && confirmRoute && selectedWarehouse && selectedOrders.length > 0) {
      // update warehouse's list of orders
      selectedWarehouse.setOrders([...selectedWarehouse.orders, ...selectedOrders]);
      // remove the selected orders from the pending orders
      const remainingOrders = pendingOrders.filter((order) => !selectedOrders.includes(order));
      setPendingOrders(remainingOrders);

      // create a vehicle for the selected warehouse
      console.log("creating vehicle...");
      // create a vehicle for the selected warehouse
      const vehicle = new DeliveryVehicle(Math.random().toString(36).substr(2, 9), selectedWarehouse.location, selectedOrders, mapRef.current);
      addRoutes(vehicle);
      // set the selected vehicle to the vehicle
      setSelectedVehicle(vehicle);
      
      // add vehicle to the warehouse
      selectedWarehouse.addVehicle(vehicle);
      // update the warehouse array with the selected warehouse
      setWarehouses(Warehouses.map((w) => w.id === selectedWarehouse.id ? selectedWarehouse : w));
      // set selected vehicle to the vehicle
      setSelectedWarehouse(selectedWarehouse);
      // reset the selected orders
      setSelectedOrders([]);
    }
  }, [confirmRoute]);

  //Reorder the orders whenever a new warehouse is selected
  useEffect(() => {
    if (selectedWarehouse) {
      setSelectedOrders([]);
    }
    console.log("updated selected warehouse", selectedWarehouse);
    if (pendingOrders.length > 0 ){
      sortOrders(pendingOrders);
    }
  }
  , [selectedWarehouse]);


  // on load fetch the available orders
  useEffect(() => {
    const fetchDeliveries = async () => {
        const data = await fetch(`${process.env.PUBLIC_URL}/orders.json`).then(r => r.json());
        setPendingOrders(sortOrders(data.deliveries)); // Set the transformed array of Order objects
    };
    fetchDeliveries();
  }, []);

  
  return (
    <div className="h-screen w-screen">

      {/* When a warehouse is clicked show the stats page */}
      {/* {selectedWarehouse && <WarehouseStats warehouse={selectedWarehouse}/>} */}

      <Dashboard 
      ref={mapRef}
      selectedWarehouse={selectedWarehouse} 
      pendingOrders={pendingOrders}
      selectedOrders={selectedOrders} 
      setSelectedOrders={setSelectedOrders} 
      setConfirmRoute={setConfirmRoute}/>

      <MapComponent
        ref={mapRef} // Pass the ref to the MapComponent
        Warehouses={Warehouses}
        setWarehouses={setWarehouses}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
      />
     
    </div>
  );
};

export default App;