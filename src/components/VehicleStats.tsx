import React, { useState, useEffect} from 'react';
import Warehouse from '../types/Warehouse';
import DeliveryVehicle from '../types/DeliveryVehicle';
import { Feature, FeatureCollection } from 'geojson';
import { Map, LngLatLike } from 'mapbox-gl';
import * as turf from '@turf/turf';
import Order from '../types/Order';

export default function VehicleStats(props: { warehouse: Warehouse }) {

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
        <div>
            {props.warehouse.vehicles.map((vehicle) => {
                const allOrders = [
                    ...vehicle.deliveries.features,
                    ...vehicle.completedDeliveries.features,
                ];

                return (
                    <div key={vehicle.id} className="mt-2">
                        <div
                            className="cursor-pointer font-bold"
                            onClick={() => toggleVehicle(vehicle.id)}
                        >
                            Vehicle {vehicle.id} {openVehicles[vehicle.id] ? '▲' : '▼'}
                        </div>
                        {openVehicles[vehicle.id] && (
                            <div className="ml-4">
                                {/* <div>Battery Level: {vehicle.batteryLevel}</div> */}
                                <div className="relative w-full h-6 bg-gray-300 rounded-lg shadow-inner overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full transition-all duration-300 ease-in-out"
                                        style={{
                                            width: `${vehicle.batteryLevel}%`,
                                            background:
                                                vehicle.batteryLevel > 80
                                                ? `#4caf50` // Green for full battery
                                                : vehicle.batteryLevel > 50
                                                ? `#ffcc00` // Yellow for high battery
                                                :vehicle.batteryLevel > 20
                                                ? `#ff9900` // Orange for medium battery
                                                : `#ff4d4d`, // Solid red for low battery
                                        }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                        ⚡ {vehicle.batteryLevel.toFixed(0)}%
                                    </div>
                                </div>
                                <div>Distance Traveled: {vehicle.totalDistance.toFixed(2)} km</div>
                                <div>Weight: {vehicle.currentWeight.toFixed(3)} kg</div>
                                <button
                                    className="cursor-pointer font-bold mt-2"
                                    onClick={() => toggleVehicle(`${vehicle.id}-allOrders`)}
                                >
                                    {openVehicles[`${vehicle.id}-allOrders`] 
                                        ? `Hide Orders (${allOrders.length}) ▲` 
                                        : `Show Orders (${allOrders.length}) ▼`}
                                </button>
                                {openVehicles[`${vehicle.id}-allOrders`] && (
                                    <div className="ml-4">
                                        {allOrders.map((delivery) => {
                                            const order = delivery.properties?.order as Order;
                                            return (
                                                <div key={order.name} className="mt-2">
                                                    <div
                                                        className="cursor-pointer font-bold"
                                                        onClick={() => toggleOrder(order.name)}
                                                    >
                                                        Order {order.name}{' '}
                                                        {openOrders[order.name] ? '▲' : '▼'}
                                                        <span
                                                            className={`ml-2 px-2 py-1 rounded text-white ${
                                                                order.pending
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-green-600'
                                                            }`}
                                                        >
                                                            {order.pending
                                                                ? 'Pending'
                                                                : 'Delivered'}
                                                        </span>
                                                    </div>
                                                    {openOrders[order.name] && (
                                                        <div className="ml-4">
                                                            <div>Weight: {order.orderWeight}</div>
                                                            <div>
                                                                Location: {order.location.join(', ')}
                                                            </div>
                                                            <div>
                                                                Status:{' '}
                                                                {order.pending
                                                                    ? 'Pending'
                                                                    : 'Delivered'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}