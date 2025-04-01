
import React, { useEffect, useRef, useState, forwardRef } from 'react';
import mapboxgl, {Map} from 'mapbox-gl';
import * as turf from '@turf/turf';
import Order from '../types/Order';

//TODO when user selects a car show the vehcile info (location, battery level, total weight of the packages, total distance traveled, delivery in progress, delivery waiting time)

interface RoutePlannerProps {
    warehouseLocation: number[];
    selectedOrders: Order[];
    pendingOrders: Order[];
    setSelectedOrders: React.Dispatch<React.SetStateAction<Order[]>>
    setConfirmRoute: React.Dispatch<React.SetStateAction<boolean>>
  }

const RoutePlanner = forwardRef<Map | null, RoutePlannerProps>((props, mapRef) => {
    const { warehouseLocation: selectedWarehouse, selectedOrders,pendingOrders, setSelectedOrders, setConfirmRoute } = props;
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [totalWeight, setTotalWeight] = useState<number>(0);

    // useffect to update the distance estimate
    useEffect(() => {
        computeDistanceEstimate();
        computeTotalDeliveryWeight();
        // plot points on the map
        plotPoints();
    }, [selectedOrders]);

    // Plot points on the map
    function plotPoints() {
        // plot the selected orders on the dropoff-points layer in green dots
        //plot the rest of the orders in red dots
        const deliveryPoints = selectedOrders.map((order) => {
            return turf.point(order.location, { order });
        });
        const remainingPoints = pendingOrders.filter((order) => !selectedOrders.includes(order)).map((order) => {
            return turf.point(order.location, { order });
        });

        const dropoffPointsCollection = turf.featureCollection(deliveryPoints);
        const remainingPointsCollection = turf.featureCollection(remainingPoints);

        // Add the dropoff points to the map
        if (mapRef && 'current' in mapRef && mapRef.current) {
            try{
                (mapRef.current.getSource('selected-dropoff-points') as mapboxgl.GeoJSONSource).setData(dropoffPointsCollection);
                (mapRef.current.getSource('remaining-dropoff-points')as mapboxgl.GeoJSONSource).setData(remainingPointsCollection);
            }
            catch(error){
                console.log("Error plotting points on the map", error);
            }
        }
        
       
    }


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

        let currentLocation = selectedWarehouse;
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
        distance += turf.distance(turf.point(currentLocation), turf.point(selectedWarehouse));

        setTotalDistance(distance);
    };


    return (
      <div className="overflow-y-hidden h-full">
        <div>
            <h1 className="text-xl font-bold text-center">Route Planner</h1>
            <div className="flex flex-col justify-center">
                <div className="flex flex-row justify-start">
                    <p className="mt-4 text-md font-semibold">
                        Total Distance Estimate: {totalDistance.toFixed(2)} km
                    </p>
                    <p className="mt-4 text-md font-semibold">
                        Total Weight: {totalWeight} kg
                    </p>
                    <p className="mt-4 text-md font-semibold">
                        Cost Estimate: £{(totalDistance * 0.5 + totalWeight * 0.025).toFixed(2)}
                    </p>
                </div>

                <button
                onClick={() => {setConfirmRoute(true)}}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                Confirm Route & Select ADV
                </button>
            </div>
            <h2 className="text-lg font-semibold mt-4">Pending Orders</h2>
        </div>
 


        <div className="overflow-y-auto h-full">
            <div className="mt-4">
            {pendingOrders.map((order, index) => (
                <div key={index} className="border-b border-gray-600 py-2 flex items-center">
                    <input
                        type="checkbox"
                        className="mr-2"
                        id={`order-${index}`}
                        checked={selectedOrders.includes(order)} // Check if the order is in the selectedOrders array
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
      </div>
    );
  });

export default RoutePlanner;