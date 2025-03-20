class Package {
    id: string;
    weight: number;
    size: [number, number, number];

    constructor(id: string, weight: number, size: [number, number, number]) {
      this.id = id;
      this.weight = weight;
      this.size = size;
  }
}

class Order {
    name: string;
    address: string;
    location: [number, number];
    packages: [Package];
  
  
     constructor(name: string, address:string , location: [number, number], packages: [Package]) {
        this.name = name;
        this.address = address;
        this.location = location
        this.packages = packages;
      }
  }



export default { Order, Package };