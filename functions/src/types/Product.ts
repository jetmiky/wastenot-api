interface Marketplace {
  name: string;
  url: string;
}

interface Product {
  ownerId: string;
  name: string;
  description: string;
  price: number;
  marketplaces: Marketplace[];
}

export default Product;
