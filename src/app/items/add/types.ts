export interface FormData {
  // 商品基本信息
  barcode: string;
  name: string;
  englishName: string;
  brand: string;
  manufacturer: string;
  specification: string;
  width: string;
  height: string;
  depth: string;
  grossWeight: string;
  netWeight: string;
  originCountry: string;
  goodsType: string;
  categoryCode: string;
  categoryName: string;
  price: string;
  referencePrice: string;
  imageUrl: string;
  firstShipDate: string;
  packagingType: string;
  shelfLife: string;
  minSalesUnit: string;
  certificationStandard: string;
  certificateLicense: string;
  note: string;

  // 保质期信息
  hasExpiration: boolean;
  productionDate: string;
  expirationDate: string;
  shelfLifeDays: string;

  // 库存信息
  cabinetId: string;
  quantity: string;
  unit: string;
  itemNote: string;
  brickId: string;
}

export interface Location {
  id: string;
  name: string;
  barcode: string;
} 