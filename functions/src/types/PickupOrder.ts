import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import { PhoneNumberID } from "./Strings";

interface Requester {
  name: string;
  phone: PhoneNumberID;
  address: string;
  pickupSchedule: Timestamp;
  geoPoint: GeoPoint;
}

export interface Waste {
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
  id?: string;
  userId: string;
  bankId: string;
  requester: Requester;
  realizedPickupTime: Timestamp | null;
  wasteImageUrl: string;
  wastes: Waste[];
  status: PickupStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default PickupOrder;
