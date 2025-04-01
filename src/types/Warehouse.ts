// import React, { useEffect, useRef, useState,useImperativeHandle, forwardRef  } from 'react';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import * as turf from '@turf/turf';
// import { Feature, FeatureCollection } from 'geojson';
// import Delivery from '../types/Order';
import Order from './Order';
import DeliveryVehicle from './DeliveryVehicle';

class Warehouse {
    id: string;
    location: number[]
    orders: Order[] = [];
    vehicles: Array<DeliveryVehicle> = [];
    // add orders to the warehouse
    // add adv to the warehouse
    // move add routes function here

    constructor(id: string, location: number[]) {
        this.id = id;
        this.location = location;
    }

    toLngLat(): LngLatLike {
        return [this.location[0], this.location[1]];
    }

    setOrders(orders: Order[]) {
        this.orders = orders;
    }

    // update completed orders
    updateOrders(){
        // iterate all vehicles and check if they have completed any deliveries
        // if they have completed any deliveries, update the orders
        this.vehicles.forEach(vehicle => {
            if (vehicle.completedDeliveries.features.length > 0){
                // update the orders
                vehicle.completedDeliveries.features.forEach((delivery) => {
                    const order = delivery.properties?.order;
                    if (order){
                        order.pending = false;
                    }
                });
            }
        });
    }

    showWarehouseOrders(map: mapboxgl.Map){
        // set route layer to empty
        (map.getSource('route') as mapboxgl.GeoJSONSource).setData(turf.featureCollection([]));
        // set completed dropoff points to empty
        (map.getSource('completed-dropoff-points') as mapboxgl.GeoJSONSource).setData(turf.featureCollection([]));
        //create a GeoJSON feature collection for orders
        const pendingOrders = turf.featureCollection(this.orders
            .filter(order => order.pending && order.location) // Filter out invalid orders
            .map(order => turf.point(order.location, { order }))
        );
        (map.getSource('dropoff-points') as mapboxgl.GeoJSONSource).setData(pendingOrders);

        // create a GeoJSON feature collection for completed orders
        const completedOrders = turf.featureCollection(this.orders
            .filter(order => !order.pending && order.location) // Filter out invalid orders
            .map(order => turf.point(order.location, { order }))
        );
        (map.getSource('completed-dropoff-points') as mapboxgl.GeoJSONSource).setData(completedOrders);
    }

    setVehicles(vehicles: Array<DeliveryVehicle>) {
        this.vehicles = vehicles;
    }

    addVehicle(vehicle: DeliveryVehicle) {
        this.vehicles.push(vehicle);
    }
}

export default Warehouse;


/* TODO
- Add ADV class:
    - id: string
    - location: number[]
    - Route (waypointRegistry):  FeatureCollection<Geometry, GeoJsonProperties>
    - Deliveries (DeliveryPoints): FeatureCollection<Geometry, GeoJsonProperties>
    - DeliverPackage(): void
*/