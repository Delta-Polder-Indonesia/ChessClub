/*
 * Kode IOC diringkas dari country-data-list 1.6.3; kode wilayah ditambahkan.
 * https://github.com/sonatrix/country-list
 *
 * The MIT License
 *
 * Copyright (c) 2010-2018 Google, Inc. http://angularjs.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const KODE_NEGARA = {
  "AC": "SHP", "AD": "AND", "AE": "UAE", "AF": "AFG", "AG": "ANT", "AL": "ALB", "AM": "ARM",
  "AO": "ANG", "AR": "ARG", "AS": "ASA", "AT": "AUT", "AU": "AUS", "AW": "ARU", "AZ": "AZE",
  "BA": "BIH", "BB": "BAR", "BD": "BAN", "BE": "BEL", "BF": "BUR", "BG": "BUL", "BH": "BRN",
  "BI": "BDI", "BJ": "BEN", "BM": "BER", "BN": "BRU", "BO": "BOL", "BR": "BRA", "BS": "BAH",
  "BT": "BHU", "BW": "BOT", "BY": "BLR", "BZ": "BIZ", "CA": "CAN", "CD": "COD", "CF": "CAF",
  "CG": "CGO", "CH": "SUI", "CI": "CIV", "CK": "COK", "CL": "CHI", "CM": "CMR", "CN": "CHN",
  "CO": "COL", "CR": "CRC", "CU": "CUB", "CV": "CPV", "CY": "CYP", "CZ": "CZE", "DE": "GER",
  "DJ": "DJI", "DK": "DEN", "DM": "DMA", "DO": "DOM", "DZ": "ALG", "EC": "ECU", "EE": "EST",
  "EG": "EGY", "ER": "ERI", "ES": "ESP", "ET": "ETH", "FI": "FIN", "FJ": "FIJ", "FM": "FSM",
  "FO": "FAI", "FR": "FRA", "GA": "GAB", "GB": "GBR", "GB-ENG": "ENG", "GB-NIR": "NIR", "GB-SCT": "SCO",
  "GB-WLS": "WLS", "GD": "GRN", "GE": "GEO", "GG": "GCI", "GH": "GHA", "GM": "GAM", "GN": "GUI",
  "GQ": "GEQ", "GR": "GRE", "GT": "GUA", "GU": "GUM", "GW": "GBS", "GY": "GUY", "HK": "HKG",
  "HN": "HON", "HR": "CRO", "HT": "HAI", "HU": "HUN", "ID": "INA", "IE": "IRL", "IL": "ISR",
  "IN": "IND", "IQ": "IRQ", "IR": "IRI", "IS": "ISL", "IT": "ITA", "JE": "JCI", "JM": "JAM",
  "JO": "JOR", "JP": "JPN", "KE": "KEN", "KG": "KGZ", "KH": "CAM", "KI": "KIR", "KM": "COM",
  "KN": "SKN", "KP": "PRK", "KR": "KOR", "KW": "KUW", "KY": "CAY", "KZ": "KAZ", "LA": "LAO",
  "LB": "LIB", "LC": "LCA", "LI": "LIE", "LK": "SRI", "LR": "LBR", "LS": "LES", "LT": "LTU",
  "LU": "LUX", "LV": "LAT", "LY": "LBA", "MA": "MAR", "MC": "MON", "MD": "MDA", "ME": "MNE",
  "MG": "MAD", "MH": "MHL", "MK": "MKD", "ML": "MLI", "MM": "MYA", "MN": "MGL", "MO": "MAC",
  "MR": "MTN", "MT": "MLT", "MU": "MRI", "MV": "MDV", "MW": "MAW", "MX": "MEX", "MY": "MAS",
  "MZ": "MOZ", "NA": "NAM", "NE": "NIG", "NG": "NGR", "NI": "NCA", "NL": "NED", "NO": "NOR",
  "NP": "NEP", "NR": "NRU", "NZ": "NZL", "OM": "OMA", "PA": "PAN", "PE": "PER", "PG": "PNG",
  "PH": "PHI", "PK": "PAK", "PL": "POL", "PR": "PUR", "PS": "PLE", "PT": "POR", "PW": "PLW",
  "PY": "PAR", "QA": "QAT", "RO": "ROU", "RS": "SRB", "RU": "RUS", "RW": "RWA", "SA": "KSA",
  "SB": "SOL", "SC": "SEY", "SD": "SUD", "SE": "SWE", "SG": "SGP", "SI": "SLO", "SK": "SVK",
  "SL": "SLE", "SM": "SMR", "SN": "SEN", "SO": "SOM", "SR": "SUR", "SS": "SSD", "ST": "STP",
  "SV": "ESA", "SY": "SYR", "SZ": "SWZ", "TD": "CHA", "TG": "TOG", "TH": "THA", "TJ": "TJK",
  "TL": "TLS", "TM": "TKM", "TN": "TUN", "TO": "TGA", "TR": "TUR", "TT": "TTO", "TV": "TUV",
  "TW": "TPE", "TZ": "TAN", "UA": "UKR", "UG": "UGA", "US": "USA", "UY": "URU", "UZ": "UZB",
  "VC": "VIN", "VE": "VEN", "VG": "IVB", "VI": "ISV", "VN": "VIE", "VU": "VAN", "WS": "SAM",
  "XK": "KOS", "YE": "YEM", "ZA": "RSA", "ZM": "ZAM", "ZW": "ZIM",
};

/** Kode tampilan IOC bila tersedia, selain itu kode negara Chess.com. */
export function kodeNegaraTampilan(nilai) {
  const kode = typeof nilai === "string" ? nilai.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}(?:-[A-Z]{3})?$/.test(kode)) return null;
  return KODE_NEGARA[kode] || kode;
}
