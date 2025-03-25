/* TODO
- Add ADV class:
    - id: string
    - location: number[]
    - Route (waypointRegistry):  FeatureCollection<Geometry, GeoJsonProperties>
    - Deliveries (DeliveryPoints): FeatureCollection<Geometry, GeoJsonProperties>
    - DeliverPackage(): void
*/

import * as turf from '@turf/turf';
import { FeatureCollection} from 'geojson';
import Order from './Order';
import mapboxgl, { Map, LngLatLike} from 'mapbox-gl';


export default class DeliveryVehicle {
    id: string;
    location: number[];
    route: FeatureCollection;
    deliveries: FeatureCollection;
    map: mapboxgl.Map;
    distanceTraveled: number = 0;
    

    constructor(id: string, location: number[],deliveries: Order[], map: mapboxgl.Map) {
        this.id = id;
        this.location = location;
        this.route = turf.featureCollection([]);
        // create a GeoJSON feature collection for drop-off locations
        this.deliveries = turf.featureCollection(deliveries.map((order) => {
            return turf.point(order.location, { order });
        }));
        this.map = map;

        this.updateVehicleLocation(location);
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
        //TODO 25/03/2025 show dropoffs
        // (this.map.getSource('dropoffs-symbol') as mapboxgl.GeoJSONSource).setData(this.deliveries);
    }

    DeliverPackage(index: number) {
        // Deliver the package
        console.log('Delivering package');
        this.deliveries.features.splice(index, 1);
    }


    MoveAlongRoute() {
        // Move the ADV along the route
        if (!this.route || !this.location) return;

        const line = this.route.features[0] as any;
        const routeLength = turf.length(line); // Get the total length of the route in kilometers

        this.distanceTraveled += 0.1; // Move 0.1 km (100 meters) per click
    
        if (this.distanceTraveled > routeLength) {
          console.log('Truck has reached the end of the route');
          return;
        }

        // Get the new position along the route
        const nextPos = turf.along(line, this.distanceTraveled);

        // if nextPos is <= a certain distance from the next delivery point, deliver the package
        for (let i = 0; i < this.deliveries.features.length; i++) {
            const delivery = this.deliveries.features[i];
            if (delivery.geometry.type === 'Point') {
                const distanceToDelivery = turf.distance(nextPos, turf.point(delivery.geometry.coordinates), { units: 'kilometers' });
                if (distanceToDelivery < 0.1) {
                    this.DeliverPackage(i);
                }
            }
        }

        // Update the truck marker position
        if (nextPos.geometry.type === 'Point') {
            this.updateVehicleLocation(nextPos.geometry.coordinates);
        }
    }
}