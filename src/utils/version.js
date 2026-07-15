// Dynamic version generator matching base version with current YYMMDD date
const baseVersion = "2.0.2";

const today = new Date();
const yy = String(today.getFullYear()).slice(-2);
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');

export const APP_VERSION = `${baseVersion}.${yy}${mm}${dd}`;
