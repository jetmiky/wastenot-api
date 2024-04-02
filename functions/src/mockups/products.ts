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
    productImage: [
      "https://firebasestorage.googleapis.com/v0/b/wastenot-c13cd.appspot.com/o/mockups%2Flampu_sendok_1.jpg?alt=media&token=1fcc170d-3c2c-4340-9b36-dbc3525cdf1e",
      "https://firebasestorage.googleapis.com/v0/b/wastenot-c13cd.appspot.com/o/mockups%2Flampu_sendok_2.jpg?alt=media&token=8088aeab-f300-49c7-a459-5621c45fd4d5",
    ],
  },
  {
    name: "Pot Tanaman dan ATK",
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
    productImage: [
      "https://firebasestorage.googleapis.com/v0/b/wastenot-c13cd.appspot.com/o/mockups%2Fpot_tanaman.jpg?alt=media&token=53051d0b-0b01-45c7-afea-6f5365b5dcaa",
      "https://firebasestorage.googleapis.com/v0/b/wastenot-c13cd.appspot.com/o/mockups%2Ftempat_atk.jpg?alt=media&token=331f4452-921e-42c0-b902-a5eea026d7e9",
    ],
  },
];

export default products;
