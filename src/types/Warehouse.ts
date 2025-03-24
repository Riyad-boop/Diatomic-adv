// import React, { useEffect, useRef, useState,useImperativeHandle, forwardRef  } from 'react';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
// import * as turf from '@turf/turf';
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