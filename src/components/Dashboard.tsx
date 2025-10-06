
import React, { useEffect, useRef, useState, forwardRef } from 'react';
import mapboxgl, {Map} from 'mapbox-gl';
import * as turf from '@turf/turf';
import Order from '../types/Order';
import WarehouseStats from './WarehouseStats';
import Warehouse from '../types/Warehouse';
import RoutePlanner from './RoutePlanner';
//TODO when user selects a car show the vehcile info (location, battery level, total weight of the packages, total distance traveled, delivery in progress, delivery waiting time)

interface DasboardProps {
    selectedWarehouse: Warehouse;
    selectedOrders: Order[];
    pendingOrders: Order[];
    setSelectedOrders: React.Dispatch<React.SetStateAction<Order[]>>
    setConfirmRoute: React.Dispatch<React.SetStateAction<boolean>>
  }

const Dashboard = forwardRef<Map | null, DasboardProps>((props, mapRef) => {
    const { selectedWarehouse, selectedOrders,pendingOrders, setSelectedOrders, setConfirmRoute } = props;

    return (
      <div
        className="h-screen w-1/3 fixed top-0 left-0 bg-gray-800 bg-opacity-60  
        hover:bg-opacity-100 hover:shadow-lg hover:bg-gray-900
        text-white p-4 z-10 overflow-y-auto"
        style={{ pointerEvents: 'auto' }} // Ensures interactivity
      >
        <WarehouseStats warehouse={selectedWarehouse} />
        {/* // Only show the route planner if there are pending orders */}
        {pendingOrders.length > 0 && (
          <RoutePlanner
            ref={mapRef}
            warehouseLocation={selectedWarehouse.location}
            selectedOrders={selectedOrders}
            pendingOrders={pendingOrders}
            setSelectedOrders={setSelectedOrders}
            setConfirmRoute={setConfirmRoute}
            />
        )}
      </div>
    );
  });

export default Dashboard;