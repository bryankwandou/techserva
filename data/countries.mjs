// Country (from the visitor's IP) to site language. The build drops any language the site does not carry.
export const countryLang = Object.fromEntries(`
ID:id MY:ms BN:ms SG:en PH:tl TH:th VN:vi KH:km LA:lo MM:my TL:pt
CN:zh-CN TW:zh-TW HK:zh-TW MO:zh-TW JP:ja KR:ko MN:mn
IN:hi PK:ur BD:bn NP:ne LK:si MV:dv BT:dz AF:ps
SA:ar AE:ar EG:ar IQ:ar JO:ar KW:ar QA:ar BH:ar OM:ar YE:ar SY:ar LB:ar LY:ar TN:ar DZ:ar MA:ar SD:ar PS:ar MR:ar
IR:fa IL:iw TR:tr AZ:az GE:ka AM:hy KZ:kk UZ:uz KG:ky TJ:tg TM:tk
RU:ru UA:uk BY:be PL:pl CZ:cs SK:sk HU:hu RO:ro MD:ro BG:bg RS:sr HR:hr BA:bs SI:sl MK:mk AL:sq XK:sq ME:sr GR:el CY:el
DE:de AT:de CH:de LI:de FR:fr BE:nl LU:lb MC:fr NL:nl IT:it SM:it VA:it MT:mt ES:es AD:ca PT:pt
SE:sv NO:no DK:da FI:fi IS:is FO:fo GL:kl EE:et LV:lv LT:lt IE:en GB:en
US:en CA:en AU:en NZ:en
MX:es GT:es SV:es HN:es NI:es CR:es PA:es CU:es DO:es PR:es CO:es VE:es EC:es PE:es BO:es CL:es AR:es UY:es PY:es GQ:es
BR:pt AO:pt MZ:pt CV:pt GW:pt ST:pt HT:ht
KE:sw TZ:sw UG:en RW:rw BI:rn ET:am ER:ti SO:so DJ:fr MG:mg MW:ny ZM:en ZW:sn BW:tn LS:st SZ:ss
NG:en GH:en SN:fr ML:fr BF:fr NE:fr TD:fr CI:fr CM:fr GA:fr CG:fr CD:fr CF:fr TG:fr BJ:fr GN:fr
ZA:en NA:en WS:sm TO:to FJ:fj PG:tpi
`.trim().split(/\s+/).map(p => p.split(':')));
