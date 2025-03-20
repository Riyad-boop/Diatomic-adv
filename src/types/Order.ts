import * as turf from '@turf/turf';
import { Units } from '@turf/turf';

class Order {
    name: string;
    address: string;
    location: [number, number];
    packages: {[key: string]: any};
    distance: number = 0;
    orderWeight: number = 0;
  
     constructor(name: string, address:string , location: [number, number], packages: {[key: string]: any}) {
        this.name = name;
        this.address = address;
        this.location = location
        this.packages = packages;
      }

    setDistance(warehouseLocation: [number, number]) {
        // Calculate the distance from the warehouse to this.location point
        const warehouse = turf.point(warehouseLocation);
        const options: { units: Units } = { units: 'kilometers' };
        this.distance = turf.distance(warehouse, this.location, options);
    }

    calculateTotalWeight() {
        // Calculate the total weight of the packages
        this.orderWeight = Object.values(this.packages).reduce((acc, val) => acc + val.weight, 0);
    }
  }



export default Order;