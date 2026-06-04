// ============================================================
//  Shared Constants — Single source of truth
//  Eliminates 9 duplicate flag maps across pages
// ============================================================

export const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",
  NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",
  IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",
  COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",UAE:"🇦🇪",CIV:"🇨🇮",
  JAM:"🇯🇲",CZE:"🇨🇿",UKR:"🇺🇦",SUI:"🇨🇭",DEN:"🇩🇰",SWE:"🇸🇪",NOR:"🇳🇴",POL:"🇵🇱",
  AUT:"🇦🇹",HUN:"🇭🇺",SRB:"🇷🇸",TUR:"🇹🇷",GRE:"🇬🇷",PAR:"🇵🇾",BOL:"🇧🇴",VEN:"🇻🇪",
  ALG:"🇩🇿",TUN:"🇹🇳",COD:"🇨🇩",MLI:"🇲🇱",BFA:"🇧🇫",CMR:"🇨🇲",GHA:"🇬🇭",
};

export const CN_NAMES: Record<string, string> = {
  ARG:"阿根廷",BRA:"巴西",FRA:"法国",ESP:"西班牙",ENG:"英格兰",POR:"葡萄牙",GER:"德国",ITA:"意大利",
  NED:"荷兰",BEL:"比利时",CRO:"克罗地亚",USA:"美国",CAN:"加拿大",MEX:"墨西哥",JPN:"日本",KOR:"韩国",
  IRN:"伊朗",NGA:"尼日利亚",MAR:"摩洛哥",SEN:"塞内加尔",EGY:"埃及",AUS:"澳大利亚",NZL:"新西兰",URU:"乌拉圭",
  COL:"哥伦比亚",ECU:"厄瓜多尔",PER:"秘鲁",CHI:"智利",KSA:"沙特",QAT:"卡塔尔",UAE:"阿联酋",CIV:"科特迪瓦",
  JAM:"牙买加",CZE:"捷克",UKR:"乌克兰",SUI:"瑞士",DEN:"丹麦",SWE:"瑞典",NOR:"挪威",POL:"波兰",
  AUT:"奥地利",HUN:"匈牙利",SRB:"塞尔维亚",TUR:"土耳其",GRE:"希腊",PAR:"巴拉圭",BOL:"玻利维亚",VEN:"委内瑞拉",
  ALG:"阿尔及利亚",TUN:"突尼斯",COD:"民主刚果",MLI:"马里",BFA:"布基纳法索",CMR:"喀麦隆",GHA:"加纳",
};

export const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export const NAV = [
  { label: "指挥中心", href: "/" },
  { label: "实时比赛", href: "/live" },
  { label: "赛程", href: "/schedule" },
  { label: "球队", href: "/teams" },
  { label: "球员", href: "/players" },
  { label: "预测", href: "/predictions" },
];

export const HOST_CITIES = [
  { city: "Los Angeles", country: "US" },{ city: "New York", country: "US" },
  { city: "Dallas", country: "US" },{ city: "Miami", country: "US" },
  { city: "Atlanta", country: "US" },{ city: "Kansas City", country: "US" },
  { city: "San Francisco", country: "US" },{ city: "Seattle", country: "US" },
  { city: "Boston", country: "US" },{ city: "Houston", country: "US" },
  { city: "Philadelphia", country: "US" },{ city: "Toronto", country: "CA" },
  { city: "Vancouver", country: "CA" },{ city: "Mexico City", country: "MX" },
  { city: "Guadalajara", country: "MX" },{ city: "Monterrey", country: "MX" },
];

export function flag(c: string): string { return FLAG[c] || "🏳"; }
export function cnName(c: string): string { return CN_NAMES[c] || ""; }
