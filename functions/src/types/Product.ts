interface Marketplace {
  name: string;
  url: string;
}

interface Product {
  id?: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  marketplaces: Marketplace[];
}

export default Product;
