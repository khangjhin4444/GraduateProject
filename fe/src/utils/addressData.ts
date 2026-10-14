import rawData from "./data.json";

export interface Ward {
  ward_code: string;
  name: string;
  province_code: string;
}

export interface Province {
  province_code: string;
  name: string;
  short_name: string;
  code: string;
  place_type: string;
  wards: Ward[];
}
const cleanText = (str: string) =>
  str.normalize("NFC").replace(/\s+/g, " ").trim();

export const provincesData: Province[] = (rawData as Province[]).map(
  (province) => ({
    ...province,
    name: cleanText(province.name),
    short_name: cleanText(province.short_name),
    wards: province.wards.map((ward) => ({
      ...ward,
      name: cleanText(ward.name),
    })),
  }),
);
