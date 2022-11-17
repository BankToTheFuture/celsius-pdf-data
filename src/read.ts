import xlsx from 'node-xlsx';

/**
 * Raw asset cell to token object
 * @param data
 * @returns
 */
export function parseCrypto(data: string): Asset[] {
  if (data != undefined) {
    const assets = data.split('\r\n');
    return categorizeAssets(assets);
  }
  return undefined;
}

const totalTokens = {};

/**
 * Array of tokens as text to object
 * @param data
 * @returns
 */
export function categorizeAssets(data: string[]): Asset[] {
  const assets = data.reduce((acc, curr) => {
    const [token, qtyStr, qtyStr2] = curr.split(' ');
    totalTokens[token] = 1;
    const qty = token == 'USDT' ? parseFloat(qtyStr2) : parseFloat(qtyStr);
    acc.push({ symbol: token, qty });

    return acc;
  }, []);

  return assets;
}

interface Asset {
  symbol: string;
  qty: number;
}

interface User {
  schedule: string;
  address: string;
  name: string;
  earn: Asset[];
  custody: Asset[];
  withheld: Asset[];
  collateral: Asset[];
}

// const users: User[] = [];

/**
 * Parse excel file
 */
export function parseFile(file: string) {
  const users: User[] = [];
  const workSheetsFromFile = xlsx.parse(`${__dirname}/../data/${file}.xlsx`);
  const data = workSheetsFromFile[0].data;
  let SCHEDULE = 0;
  let ADDRESS = 2;
  let NAME = 1;
  let EARN = 5;
  let CUSTODY = 6;
  let WITHHELD = 7;
  let COLLATERAL = 8;

  for (const row of data) {
    const rowArray = row as string[];

    if (rowArray?.includes('SCHEDULE F LINE')) {
      SCHEDULE = rowArray.findIndex((val) => val == 'SCHEDULE F LINE');
      NAME = rowArray.findIndex((val) => val == 'CREDITORS NAME');
      ADDRESS = rowArray.findIndex((val) => val == 'ADDRESS');
      EARN = rowArray.findIndex((val) => val == 'EARN ACCOUNT');
      CUSTODY = rowArray.findIndex((val) => val == 'CUSTODY ACCOUNT');
      WITHHELD = rowArray.findIndex((val) => val == 'WITHHELD ACCOUNT');
      COLLATERAL = rowArray.findIndex(
        (val) => val == 'COLLATERAL ON LOAN RECEIVABLE',
      );
      // skip headings
      console.log('Hone in on headings...');
    } else {
      const schedule: string = rowArray?.[SCHEDULE];
      const name: string = rowArray?.[NAME];
      if (name == null) {
        console.error('Unable to parse name');
      }
      const address: string = rowArray?.[ADDRESS];
      const isDisputedContingentOrUnliquidated: string = rowArray?.[3];
      const isSubjectToOffset: string = rowArray?.[4];
      const earn: string = rowArray?.[EARN];
      const custody: string = rowArray?.[CUSTODY];
      const withheld: string = rowArray?.[WITHHELD];
      const collateral: string = rowArray?.[COLLATERAL];

      const earnTokens = parseCrypto(earn);
      const custodyTokens = parseCrypto(custody);
      const withheldTokens = parseCrypto(withheld);
      const collateralTokens = parseCrypto(collateral);

      users.push({
        schedule,
        name,
        address,
        earn: earnTokens,
        custody: custodyTokens,
        withheld: withheldTokens,
        collateral: collateralTokens,
      });
    }
  }
  return users;
}
