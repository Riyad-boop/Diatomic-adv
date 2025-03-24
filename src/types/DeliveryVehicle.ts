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
    mapMarker: mapboxgl.Marker;
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

        //create a marker for the truck
        const marker = document.createElement('div');
        marker.className =
          'w-5 h-5 border-2 border-white rounded-full bg-blue-600 pointer-events-none';
        this.mapMarker = new mapboxgl.Marker(marker).setLngLat([location[0], location[1]]).addTo(map);
        
    }

    setRoute(route: FeatureCollection) {
        this.route = route;
    }

    setLocation(location: number[]) {
        this.location = location;
    }

    showRoute(){
        (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData(this.route);
        // show dropoffs
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
        const [lng, lat] = nextPos.geometry.coordinates;
        this.mapMarker.setLngLat([lng, lat]);
    }
}