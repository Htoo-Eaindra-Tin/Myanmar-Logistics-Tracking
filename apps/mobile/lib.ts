import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEMO_DRIVER={id:'demo-driver',name:'Aung Aung',email:'driver@example.com',password:'driver123',role:'DRIVER'} as const;
export const DEMO_USERS=[
 {role:'ADMIN',email:'admin@example.com',password:'admin123'},
 {role:'TRADER',email:'trader@example.com',password:'trader123'},
 {role:'DRIVER',email:'driver@example.com',password:'driver123'},
];

export const GPS=[{name:'Yangon',lat:16.8409,lng:96.1735},{name:'Mandalay',lat:21.9588,lng:96.0891},{name:'Lashio',lat:22.0347,lng:96.4583},{name:'Muse',lat:23.9714,lng:97.9073}]
export const DEMO_SHIPMENT_KEY='demo-driver-shipment';
export const DEMO_STATUS_KEY='demo-driver-status';

const INITIAL_SHIPMENT={id:'shipment-demo-1',tracking_number:'MYT-2026-001',trader_id:'demo-trader',driver_id:'demo-driver',cargo_description:'Agricultural products',origin:'Yangon',destination:'Muse',route_id:'route-muse',status:'IN_TRANSIT',latitude:21.9588,longitude:96.0891};

export async function getDemoShipment(){const raw=await AsyncStorage.getItem(DEMO_SHIPMENT_KEY);return raw?JSON.parse(raw):INITIAL_SHIPMENT}
export async function setDemoShipment(shipment:any){await AsyncStorage.setItem(DEMO_SHIPMENT_KEY,JSON.stringify(shipment))}
export async function getDemoStatusIndex(){const raw=await AsyncStorage.getItem(DEMO_STATUS_KEY);return raw?Number(raw):0}
export async function setDemoStatusIndex(i:number){await AsyncStorage.setItem(DEMO_STATUS_KEY,String(i))}
export async function queueUpdate(update:any){const raw=await AsyncStorage.getItem('pending_updates');const arr=raw?JSON.parse(raw):[];arr.push({...update,queued_at:new Date().toISOString()});await AsyncStorage.setItem('pending_updates',JSON.stringify(arr));return arr.length}
export async function pendingCount(){const raw=await AsyncStorage.getItem('pending_updates');return raw?JSON.parse(raw).length:0}
export async function syncQueue(){const raw=await AsyncStorage.getItem('pending_updates');const arr=raw?JSON.parse(raw):[];if(!arr.length)return 0;const last=arr[arr.length-1];const shipment=await getDemoShipment();await setDemoShipment({...shipment,status:last.status,latitude:last.latitude,longitude:last.longitude});await AsyncStorage.removeItem('pending_updates');return arr.length}
