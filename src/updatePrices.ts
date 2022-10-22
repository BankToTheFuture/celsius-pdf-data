import { updatePrices } from './main';

if (require.main === module) {
  (async () => {
    await updatePrices();
  })();
}
