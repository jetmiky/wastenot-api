/* eslint-disable max-len */
import Product from "../types/Product";

const products: Product[] = [
  {
    name: "Lampu Sendok",
    description:
      "Lampu tidur dari sendok plastik adalah inovasi kreatif yang terbuat dari daur ulang bahan bekas, memberikan pencahayaan lembut dan suasana nyaman di ruangan. Desainnya yang ramah lingkungan dan unik membuatnya menjadi pilihan hiasan dekoratif yang menarik di rumah.",
    price: 150000,
    marketplaces: [
      {
        name: "Lazada",
        url: "https://www.lazada.co.id/products/lampu-xiaomi-sikat-led-usb-fleksibel-i5211436456-s11045280401.html",
      },
      {
        name: "Tokopedia",
        url: "https://www.tokopedia.com/lbagstore/lampu-led-engsel-sendok-buka-pintu-kabinet-lemari-laci-otomatis-nyala",
      },
    ],
    ownerId: "",
    productImage: [],
  },
  {
    name: "Piring Estetik",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    price: 300000,
    marketplaces: [
      {
        name: "Lazada",
        url: "https://www.lazada.co.id/products/piring-rotan-bulat-asli-piring-angkringan-piring-estetik-rotan-piring-rotan-i7929368528-s14370892516.html",
      },
    ],
    ownerId: "",
    productImage: [],
  },
];

export default products;
