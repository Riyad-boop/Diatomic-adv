
import React, { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import Order from '../types/Order';


interface DasboardProps {
    selectedOrders: Order[];
    setSelectedOrders: React.Dispatch<React.SetStateAction<Order[]>>
    setConfirmRoute: React.Dispatch<React.SetStateAction<boolean>>
  }

export default function Dashboard({ selectedOrders, setSelectedOrders, setConfirmRoute}: DasboardProps) {
    const warehouseLocation:[number, number]= [-1.9109365,52.504115];
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [totalWeight, setTotalWeight] = useState<number>(0);

    useEffect(() => {
        const fetchDeliveries = async () => {
            const data = await fetch(`${process.env.PUBLIC_URL}/orders.json`).then(r => r.json());
            const transformedOrders = data.deliveries.map((element: any) => {
                const { name, address, location, packages } = element;
                let order = new Order(name, address, location, packages);
                order.setDistance(warehouseLocation);
                order.calculateTotalWeight();
                return order;
            });
            // sort the orders by distance
            //const sortedOrders = transformedOrders.sort((a:any, b:any) => a.distance - b.distance);
            setPendingOrders(transformedOrders); // Set the transformed array of Order objects
            
        };
        fetchDeliveries();
    }, []);

    // useffect to update the distance estimate
    useEffect(() => {
        computeDistanceEstimate();
        computeTotalDeliveryWeight();
        // plot points on the map
        plotPoints();
    }, [selectedOrders]);

    // Plot points on the map
    function plotPoints() {}


    function computeTotalDeliveryWeight() {
        // Calculate the total weight of the selected orders
        setTotalWeight(selectedOrders.reduce((total, order) => total + order.orderWeight, 0));
    }

    // Greedy Algorithm: Nearest Neighbor
    const computeDistanceEstimate = () => {
        if (selectedOrders.length === 0) {
            setTotalDistance(0);
            return;
        }

        let currentLocation = warehouseLocation;
        // sort the orders by distance to the warehouse
        let remainingOrders = [...selectedOrders].sort((a, b) => a.distance - b.distance)
        let distance = 0;

        while (remainingOrders.length > 0) {
            // Find the nearest order
            let nearestOrderIndex = 0;
            //shortestDistance is the item with the lowest distance value, we can use our sorted list and then pop this item off
            let shortestDistance = remainingOrders[0].distance;
            currentLocation = remainingOrders[0].location;

            // skip the first item in the list and calculate the distance between the current location and the remaining orders
            for (let i = 1; i < remainingOrders.length; i++) {
                // Calculate the distance between the current location and the order
                const orderDistance = turf.distance(
                    turf.point(currentLocation),
                    turf.point(remainingOrders[i].location)
                );
                // if 
                if (orderDistance < shortestDistance) {
                    shortestDistance = orderDistance;
                    nearestOrderIndex = i;
                }
            }

            // Update distance and move to the nearest order
            distance += shortestDistance;
            currentLocation = remainingOrders[nearestOrderIndex].location;

            // Remove the visited order from the list using the index
            remainingOrders.splice(nearestOrderIndex, 1);
        }

        // Return to the warehouse
        distance += turf.distance(turf.point(currentLocation), turf.point(warehouseLocation));

        setTotalDistance(distance);
    };


    return (
      <div
        className="h-screen w-1/3 fixed top-0 left-0 bg-gray-800 bg-opacity-60  
        hover:bg-opacity-100 hover:shadow-lg hover:bg-gray-900
        text-white p-4 z-10 overflow-y-auto"
        style={{ pointerEvents: 'auto' }} // Ensures interactivity
      >
        <h1 className="text-2xl font-bold text-center">Route Planner Dashboard</h1>
        <p className="mt-4 text-lg font-semibold">
            Total Distance (Estimate): {totalDistance.toFixed(2)} km
        </p>
        <p className="mt-4 text-lg font-semibold">
            Total Weight: {totalWeight} kg
        </p>
        <p className="mt-4 text-lg font-semibold">
            Cost Estimate: £{(totalDistance * 0.5 + totalWeight * 0.025).toFixed(2)}
        </p>

        <button
            onClick={() => setConfirmRoute(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Confirm Route & Select ADV
        </button>

        <div className="mt-4">
        {pendingOrders.map((order, index) => (
            <div key={index} className="border-b border-gray-600 py-2 flex items-center">
                <input
                    type="checkbox"
                    className="mr-2"
                    id={`order-${index}`}
                    onChange={(e) => {
                        if (e.target.checked) {
                            // Add the order to the selectedOrders array if the checkbox is checked and the size is less than 10
                            if (selectedOrders.length < 10){
                                setSelectedOrders([...selectedOrders, order]);
                            }
                            else{
                                alert("You can only select up to 10 orders");
                                e.target.checked = false;
                            }
                        } else {
                            // Remove the order from the selectedOrders array if the checkbox is unchecked
                            // Return a new array rather than modifying the original selectedOrders array.
                            setSelectedOrders(selectedOrders.filter((o) => o !== order));
                        }
                    }}
                />
                <label htmlFor={`order-${index}`} className="flex-grow">
                    <h2 className="text-lg font-semibold">{order.name}</h2>
                    <p>{order.address}</p>
                    <p>{Object.keys(order.packages).length} packages </p>
                    <p>
                        Weight: {order.orderWeight} kg
                    </p>
                    <p>Distance From Depot: {order.distance} km</p>
                </label>
            </div>
        ))}
        </div>
      </div>
    );
  };