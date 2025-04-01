// This function shows the warehouse statistics and a dropdown for each car
// each car has a separate ui showing the battery level, distance traveled, and the number of packages left to deliver

import React, { useState } from 'react';
import Warehouse from '../types/Warehouse';
import DeliveryVehicle from '../types/DeliveryVehicle';
import { Feature, FeatureCollection } from 'geojson';
import { Map, LngLatLike } from 'mapbox-gl';
import { useEffect } from 'react';
import * as turf from '@turf/turf';
import Order from '../types/Order';

const WarehouseStats = (props: { warehouse: Warehouse }) => {
    const [openVehicles, setOpenVehicles] = useState<{ [key: string]: boolean }>({});
    const [openOrders, setOpenOrders] = useState<{ [key: string]: boolean }>({});

    const toggleVehicle = (vehicleId: string) => {
        setOpenVehicles((prev) => ({
            ...prev,
            [vehicleId]: !prev[vehicleId],
        }));
    };

    const toggleOrder = (orderId: string) => {
        setOpenOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };



    return (
        <div
            className="bg-gray-800 bg-opacity-60  
            hover:bg-opacity-100 hover:shadow-lg hover:bg-gray-900
            text-white p-4 overflow-y-auto"
            style={{ pointerEvents: 'auto' }} // Ensures interactivity
        >
            <h1 className="text-2xl font-bold text-center">Warehouse {props.warehouse.id}</h1>
            <div className="text-xl font-bold">Orders</div>
            {props.warehouse.orders.map((order) => (
                <div key={order.name} className="text-lg">
                    <div
                        className="cursor-pointer font-bold"
                        onClick={() => toggleOrder(order.name)}
                    >
                        Order {order.name} {openOrders[order.name] ? '▲' : '▼'}
                    </div>
                    {openOrders[order.name] && (
                        <div className="ml-4">
                            <div>Weight: {order.orderWeight}</div>
                            <div>Location: {order.location}</div>
                            <div>Status: {order.pending ? 'Pending' : 'Delivered'}</div>
                        </div>
                    )}
                </div>
            ))}
            <div className="mt-4"></div>
            <div className="text-xl font-bold">Vehicles</div>
            {props.warehouse.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="text-lg">
                    <div
                        className="cursor-pointer font-bold"
                        onClick={() => toggleVehicle(vehicle.id)}
                    >
                        Vehicle {vehicle.id} {openVehicles[vehicle.id] ? '▲' : '▼'}
                    </div>
                    {openVehicles[vehicle.id] && (
                        <div className="ml-4">
                            <div>Battery Level: {vehicle.batteryLevel}</div>
                            <div>Distance Traveled: {vehicle.distanceTraveled}</div>
                            <div>Number of Packages Left: {vehicle.deliveries.features.length}</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default WarehouseStats;