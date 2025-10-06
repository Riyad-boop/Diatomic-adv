/* TODO
- Add ADV class:
    - id: string
    - location: number[]
    - Route (waypointRegistry):  FeatureCollection<Geometry, GeoJsonProperties>
    - Deliveries (DeliveryPoints): FeatureCollection<Geometry, GeoJsonProperties>
    - DeliverPackage(): void
*/

import * as turf from '@turf/turf';
import { Feature, FeatureCollection} from 'geojson';
import Order from './Order';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';
import Warehouse from './Warehouse';


export default class DeliveryVehicle {
    id: string;
    location: number[];
    route: FeatureCollection;
    deliveries: FeatureCollection;
    completedDeliveries: FeatureCollection = turf.featureCollection([]);
    map: mapboxgl.Map;
    deliveryInProgress: boolean = false;
    deliveryWaitingTime: number = 0;
    deliveredItemIndex: number = 0;
    distanceTraveled: number = 0;
    totalDistance: number = 0;
    batteryLevel: number = 100;
    currentWeight: number = 0;
    warehouse: Warehouse;
    //TODO add battery level which will be decremented as the vehicle moves along the route and total weight of the packages per movement tick.
    

    constructor(id: string, location: number[], deliveries: Order[], warehouse:Warehouse, map: mapboxgl.Map) {
        this.id = id;
        this.location = location;
        this.route = turf.featureCollection([]);
        // create a GeoJSON feature collection for drop-off locations
        this.deliveries = turf.featureCollection(deliveries.map((order) => {
            return turf.point(order.location, { order });
        }));
        this.warehouse = warehouse;
        this.map = map;

        this.updateVehicleLocation(location);
        this.updateCurrentWeight();
    }

    updateCurrentWeight(){
        console.log('Updating current weight', this.deliveries.features);
        this.currentWeight = this.deliveries.features.reduce((total, delivery) => total + delivery.properties?.order.orderWeight, 0);
    }

    updateVehicleLocation(location: number[]) {
        this.location = location;
        // Add this vehicle to the vehicle layer GeoJSON source
        const vehicleSourceId = 'vehicle';
        const vehicleSymbolSourceId = 'vehicle-symbol';
        let vehicleSource = this.map.getSource(vehicleSourceId) as mapboxgl.GeoJSONSource;

        // Add this vehicle as a feature to the GeoJSON source
        const vehicleFeature = turf.point(this.location, { id: this.id });
        const currentData = vehicleSource._data as GeoJSON.FeatureCollection;

        // replace the current data where vehicle id matches with the updated vehicle feature
        const updatedFeatures = currentData.features.filter((feature) => feature.properties?.id !== this.id);
        updatedFeatures.push(vehicleFeature);

        const featureCollection = turf.featureCollection(updatedFeatures);

        // update the vehicle layer
        vehicleSource.setData(featureCollection);
        // update the vehicle-symbol layer
        (this.map.getSource(vehicleSymbolSourceId) as mapboxgl.GeoJSONSource).setData(featureCollection);
    } 


    setRoute(route: FeatureCollection) {
        this.route = route;
    }

    setLocation(location: number[]) {
        this.location = location;
    }

    showRoute(){
        (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData(this.route);
        // hide remaining-dropoff-points source and show dropoff-points source
        (this.map.getSource('dropoff-points') as mapboxgl.GeoJSONSource).setData(this.deliveries);
        (this.map.getSource('remaining-dropoff-points') as mapboxgl.GeoJSONSource).setData(turf.featureCollection([]));
        (this.map.getSource('completed-dropoff-points') as mapboxgl.GeoJSONSource).setData(this.completedDeliveries);
    }

    DeliverPackage(index: number){ 
        // remove the next delivery point from the deliveries feature collection and add it to the completed deliveries feature collection
        this.completedDeliveries.features.push(this.deliveries.features[index]);
        this.deliveries.features.splice(index, 1);
        // get the last delivery point and mark the order as completed
        this.warehouse.markOrdersAsCompleted(this.completedDeliveries.features[this.completedDeliveries.features.length - 1].properties?.order);
        // reset the delivery in progress flag
        this.deliveryInProgress = false;
        // reset the distance traveled
        this.distanceTraveled = 0;
        // update the current weight
        this.updateCurrentWeight();
    }


    MoveAlongRoute() {
        // Move the ADV along the route
        if (!this.route || !this.location) return;

        if (this.deliveryInProgress) {
            this.deliveryWaitingTime -= 1;
            if (this.deliveryWaitingTime === 0) {
                this.DeliverPackage(this.deliveredItemIndex);
            }
            return;
        }

        const line = this.route.features[0] as any;
        const routeLength = turf.length(line); // Get the total length of the route in kilometers
    
        if (this.totalDistance > routeLength) {
          console.log('Truck has reached the end of the route');
          return;
        }

        this.totalDistance += 0.1; // Move 0.1 km (100 meters) per click
        this.distanceTraveled += 0.1;

        // Get the new position along the route
        const nextPos = turf.along(line, this.totalDistance);

        // if nextPos is <= a certain distance from the next delivery point, deliver the package
        for (let i = 0; i < this.deliveries.features.length; i++) {
            const delivery = this.deliveries.features[i];
            if (delivery.geometry.type === 'Point') {
                const distanceToDelivery = turf.distance(nextPos, turf.point(delivery.geometry.coordinates), { units: 'kilometers' });
                if (distanceToDelivery < 0.1) {
                    this.deliveryInProgress = true;
                    // make a random wait time between 1 and 5 
                    this.deliveryWaitingTime = Math.floor(Math.random() * 5) + 1;
                    console.log('Waiting for', this.deliveryWaitingTime, 'ticks');
                    this.deliveredItemIndex = i;
                    break;
                }
            }
        }

        // Update the truck marker position
        if (nextPos.geometry.type === 'Point') {
            this.updateVehicleLocation(nextPos.geometry.coordinates);
        }

        // Update the battery level
        this.updateBatteryLevel();

    }

    updateBatteryLevel(){
        // Update the battery level of the truck based on the distance traveled and the current weight
        // The battery level should decrease as the truck moves along the route
        // The battery level should decrease faster as the weight of the packages increases
        this.batteryLevel -= (this.distanceTraveled * 0.5) + (this.currentWeight * 0.05);
    }


    showPopup(map: mapboxgl.Map){
        // Create a popup for the truck showing the id, packages left to deliver, and the distance traveled, and the battery level
        new mapboxgl.Popup()
        .setLngLat(this.location as LngLatLike)
        .setHTML(`<h3>Truck ID: ${this.id}</h3>
        <p>Deliveries left: ${this.deliveries.features.length}</p>
        <p>Distance traveled: ${this.totalDistance.toFixed(2)} km</p>
        <p>Delivery in progress: ${this.deliveryInProgress ? 'Yes' : 'No'}</p>
        <p>Delivery waiting time: ${this.deliveryWaitingTime} ticks</p>
        <p>Current weight: ${this.currentWeight.toFixed(2)} kg</p>
        <p>Battery level: ${this.batteryLevel.toFixed(2)}%</p>`)
        .addTo(map);
    }
}