import React, {useEffect,useState,useRef} from 'react';
import MapComponent from './components/Map';
import Dashboard from './components/Dashboard';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import Order from './types/Order';


const App: React.FC = () => {
  const mapRef = useRef<{ addRoutes: (selectedOrders: Order[]) => void } | null>(null);
  const truckLocation: LngLatLike = [-1.9109365,52.504115];
  const warehouseLocation: LngLatLike = [-1.9109365,52.504115];
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [confirmRoute, setConfirmRoute] = useState<boolean>(false);

  useEffect(() => {
    if (mapRef.current && confirmRoute) {
      mapRef.current.addRoutes(selectedOrders);
    }
  }, [confirmRoute]);
  
  return (
    <div className="h-screen w-screen">
      <Dashboard selectedOrders={selectedOrders} setSelectedOrders={setSelectedOrders} setConfirmRoute={setConfirmRoute}/>
      <MapComponent ref={mapRef} mapContainer={useRef<HTMLDivElement | null>(null)} truckLocation={truckLocation} warehouseLocation={warehouseLocation} />
     
    </div>
  );
};

export default App;