import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import { PhoneNumberID } from "./Strings";

interface Requester {
  name: string;
  phone: PhoneNumberID;
  address: string;
  pickupSchedule: Timestamp;
  geoPoint: GeoPoint;
}

interface Waste {
  wasteId: string;
  wasteWeight: number;
  wastePoint: number;
}

export type PickupStatus =
  | "Belum diproses"
  | "Proses diambil"
  | "Menunggu penimbangan"
  | "Selesai";

interface PickupOrder {
  userId: string;
  bankId: string;
  requester: Requester;
  realizedPickupTime: Timestamp;
  wasteImageUrl: string;
  wastes: Waste[];
  status: PickupStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default PickupOrder;
