// This function shows the warehouse statistics and a dropdown for each car
// each car has a separate ui showing the battery level, distance traveled, and the number of packages left to deliver

import React, { useState, useEffect} from 'react';
import Warehouse from '../types/Warehouse';
import DeliveryVehicle from '../types/DeliveryVehicle';
import { Feature, FeatureCollection } from 'geojson';
import { Map, LngLatLike } from 'mapbox-gl';
import * as turf from '@turf/turf';
import Order from '../types/Order';
import VehicleStats from './VehicleStats';

const WarehouseStats = (props: { warehouse: Warehouse }) => {
    return (
        <div
            className="bg-gray-800 bg-opacity-60 hover:bg-opacity-100 hover:shadow-lg hover:bg-gray-900 text-white p-4 overflow-y-auto"
            style={{ pointerEvents: 'auto' }}
        >
            <h1 className="text-2xl font-bold text-center">Warehouse {props.warehouse.id}</h1>

            <section className="mt-4">
            {/* Add order-related content here if needed */}
            </section>

            <section className="mt-4">
            <h2 className="text-xl font-bold">Vehicles</h2>
            <VehicleStats warehouse={props.warehouse} />
            </section>
        </div>
    );
};

export default WarehouseStats;